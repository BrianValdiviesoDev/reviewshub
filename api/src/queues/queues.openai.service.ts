import { Process, Processor, OnQueueCompleted } from '@nestjs/bull';
import { Injectable, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { Job } from 'bull';
import { Product } from 'src/products/entities/products.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RequestsService } from 'src/requests/requests.service';
import {
  RequestStatus,
  RequestType,
} from 'src/requests/entities/request.entity';
import { Review } from 'src/reviews/entities/reviews.schema';
import { ReviewType } from 'src/reviews/entities/reviews.entity';
import { LogsService } from 'src/logs/logs.service';
import { QueuesService } from './queues.service';
import { HttpService } from '@nestjs/axios';
import { Prompt } from 'src/prompts/entities/prompt.schema';

@Injectable()
@Processor('openai')
export class OpenAiQueueService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private readonly requestService: RequestsService,
    private readonly logsService: LogsService,
    private readonly queuesService: QueuesService,
    private readonly httpService: HttpService,
  ) {}

  @Process('checkProductMatches')
  async handleCheckProductMatches(job: Job): Promise<void> {
    this.logsService.printLog(
      `Init checkProductMatches`,
      'info',
      undefined,
      job.data.productId,
      JSON.stringify({ jobId: job.id, matchId: job.data.matchId }),
      'openai',
    );
    await this.checkProductMatches(job.data.productId, job.data.matchId, job);
  }

  @Process('getProductFacts')
  async handleGetProductFacts(job: Job): Promise<void> {
    this.logsService.printLog(
      `Init getProductFacts`,
      'info',
      undefined,
      job.data.productId,
      JSON.stringify({ jobId: job.id }),
      'openai',
    );
    await this.getFacts(job.data.product, job);
  }

  @Process('generateReviews')
  async handleGenerateReviews(job: Job): Promise<void> {
    this.logsService.printLog(
      `Init generateReviews`,
      'info',
      undefined,
      job.data.productId,
      JSON.stringify({ jobId: job.id, number: job.data.number }),
      'openai',
    );
    await this.generateReviews(job.data.product, job.data.number, job);
  }

  @OnQueueCompleted()
  handleQueueCompleted(job: Job) {
    this.logsService.printLog(
      `End of job`,
      'info',
      undefined,
      job.data.productId,
      JSON.stringify({ jobId: job.id }),
      'openai',
    );
  }

  async checkProductMatches(productId: string, matchId: string, job: Job) {
    if (process.env.OPENAI_API_KEY === undefined) {
      this.logsService.printLog(
        `OPENAI_API_KEY is not defined`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id, matchId: matchId }),
        'openai',
      );
      throw new Error('OPENAI_API_KEY is not defined');
    }

    const product = await this.productModel.findById(productId).populate({
      path: 'checkMatchesPrompt',
      model: Prompt.name,
    });
    const match = await this.productModel.findById(matchId);

    if (!product || !match) {
      this.logsService.printLog(
        `Product or match not found`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id, matchId: matchId }),
        'openai',
      );
      throw new NotFoundException('Product not found');
    }

    if (!product.matches || product.matches.length === 0) {
      this.logsService.printLog(
        `Product without matches`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id, matchId: matchId }),
        'openai',
      );
      throw new NotFoundException('Product has no matches');
    }

    if (
      !product.checkMatchesPrompt ||
      !(product.checkMatchesPrompt as any)?.prompt
    ) {
      this.logsService.printLog(
        `Product without checkMatchesPrompt`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id, matchId: matchId }),
        'openai',
      );
      throw new NotFoundException('Product has no checkMatchesPrompt');
    }

    const prompt = this.fillPrompt(
      (product.checkMatchesPrompt as any)?.prompt,
      product,
      match,
    );
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.logsService.printLog(
      `Calling OpenAI API to check matches`,
      'info',
      undefined,
      productId,
      JSON.stringify({ jobId: job.id, matchId: matchId, prompt: prompt }),
      'openai',
    );
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-4-turbo-preview',
    });

    const response = completion.choices[0].message.content;
    //TODO save token cost

    if (response) {
      let probability: string | number;

      try {
        probability = parseInt(response, 10);
      } catch (e) {
        probability = 'Error: ' + response;
      }

      this.logsService.printLog(
        `OpenAI ended`,
        'result',
        undefined,
        productId,
        JSON.stringify({
          jobId: job.id,
          matchId: matchId,
          response: response,
          probability: probability,
        }),
        'openai',
      );

      product.matches = product.matches.map((m) => {
        if (m.product.toString() === matchId) {
          if (!m.percentage) {
            m.percentage = [];
          }
          m.percentage = [...m.percentage, probability];
        }
        return m;
      });
      const updated = await this.productModel.findOneAndUpdate(
        { _id: productId },
        { matches: product.matches },
        { new: true },
      );

      if (updated && updated.matches) {
        const updatedMatch = updated.matches.find(
          (m) => m.product.toString() === matchId,
        );

        if (updatedMatch && updatedMatch.percentage.length > 0) {
          const average =
            updatedMatch.percentage.reduce((a, b) => a + b) /
            updatedMatch.percentage.length;
          if (average > 80) {
            await this.requestService.create({
              url: match.originUrl,
              type: RequestType.GET_REVIEWS,
              status: RequestStatus.PENDING,
              productId: matchId,
            });
          }
        }
      }
    } else {
      this.logsService.printLog(
        `OpenAI response is empty`,
        'error',
        undefined,
        productId,
        JSON.stringify({
          jobId: job.id,
          matchId: matchId,
          response: completion,
        }),
        'openai',
      );
    }
  }

  async getFacts(productId: string, job: Job) {
    if (process.env.OPENAI_API_KEY === undefined) {
      this.logsService.printLog(
        `OPENAI_API_KEY is not defined`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new Error('OPENAI_API_KEY is not defined');
    }

    const product = await this.productModel.findById(productId).populate({
      path: 'factsPrompt',
      model: Prompt.name,
    });

    if (!product) {
      this.logsService.printLog(
        `Product not found`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new NotFoundException('Product not found');
    }

    if (!product.factsPrompt || !(product.factsPrompt as any)?.prompt) {
      this.logsService.printLog(
        `Product without factsPrompt`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new NotFoundException('Product has no factsPrompt');
    }

    const allReviews = await this.queuesService.getRelatedReviews(productId);
    const reviews = allReviews.filter((r) => r.type === ReviewType.SCRAPPED);

    if (!reviews) {
      this.logsService.printLog(
        `This product has no reviews`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new NotFoundException('This product has no reviews');
    }

    if (process.env.OPENAI_API_KEY === undefined) {
      this.logsService.printLog(
        `OPENAI_API_KEY is not defined`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new Error('OPENAI_API_KEY is not defined');
    }

    const prompt = this.fillPrompt(
      (product.factsPrompt as any)?.prompt,
      product,
      undefined,
      reviews,
    );
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.logsService.printLog(
      `Calling OpenAI API to get facts`,
      'info',
      undefined,
      productId,
      JSON.stringify({ jobId: job, prompt: prompt }),
      'openai',
    );
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant specialized in providing product facts. You will read user reviews, and come up with accurate product facts. You willr eceive further instructions in the user message, with your job is to fulfill.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4-turbo-preview',
    });

    const response = completion.choices[0].message.content;
    this.logsService.printLog(
      `OpenAI Response: ${response}`,
      'result',
      undefined,
      productId,
      JSON.stringify({
        jobId: job,
        response: response ? response.slice(0, 100) + '...' : '',
      }),
      'openai',
    );

    if (response) {
      const facts = response.replaceAll(',', ' ').split('\n');
      const product = await this.productModel.findOneAndUpdate(
        { _id: productId },
        { facts },
        { new: true },
      );
      if (!product) {
        this.logsService.printLog(
          `Product not found updating facts`,
          'error',
          undefined,
          productId,
          JSON.stringify({ jobId: job.id }),
          'openai',
        );
        throw new NotFoundException('Product not found');
      }

      if (product?.pendingReviews > 0) {
        this.queuesService.generateReviews(productId, product.pendingReviews);
      }
    }
  }

  async generateReviews(productId: string, number: number, job: Job) {
    if (process.env.OPENAI_API_KEY === undefined) {
      this.logsService.printLog(
        `OPENAI_API_KEY is not defined`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new Error('OPENAI_API_KEY is not defined');
    }

    const product = await this.productModel.findById(productId).populate({
      path: 'reviewsPrompt',
      model: Prompt.name,
    });

    if (!product) {
      this.logsService.printLog(
        `Product not found`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new NotFoundException('Product not found');
    }

    if (!product.facts) {
      this.logsService.printLog(
        `Product has no facts`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new NotFoundException('Product has no facts');
    }

    if (!product.reviewsPrompt || !(product.reviewsPrompt as any)?.prompt) {
      this.logsService.printLog(
        `Product without reviewsPrompt`,
        'error',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id }),
        'openai',
      );
      throw new NotFoundException('Product has no reviewsPrompt');
    }

    const prompt = this.fillPrompt(
      (product.reviewsPrompt as any)?.prompt,
      product,
    );
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.logsService.printLog(
      `Calling OpenAI API to generate reviews.`,
      'info',
      undefined,
      productId,
      JSON.stringify({ jobId: job.id, prompt: prompt }),
      'openai',
    );
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant specialized in creating product reviews that feel natural. Users will provide you further details in their messages, your job is to fullfill their requests.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4-turbo-preview',
    });

    const response = completion.choices[0].message.content;
    this.logsService.printLog(
      `OpenAI ended`,
      'result',
      undefined,
      productId,
      JSON.stringify({
        jobId: job.id,
        response: response ? response.slice(0, 500) + '...' : '',
      }),
      'openai',
    );
    if (response) {
      const reviews = JSON.parse(response);
      const savedReviews: any = [];
      await Promise.all(
        reviews.map(async (review: any) => {
          const result = await this.reviewModel.create({
            title: review.title,
            description: review.description,
            rating: review.rating,
            product: new Types.ObjectId(productId),
            type: ReviewType.GENERATED,
          });
          savedReviews.push({
            title: review.title,
            description: review.description,
            rating: review.rating,
          });
          return result;
        }),
      );

      if (product.webhookUrl) {
        this.logsService.printLog(
          `Calling webhookUrl`,
          'info',
          undefined,
          productId,
          JSON.stringify({ jobId: job.id, webhookUrl: product.webhookUrl }),
          'openai',
        );

        const response = await this.httpService.axiosRef.post(
          product.webhookUrl,
          { product: productId, reviews: savedReviews },
        );

        if (response.status > 299) {
          this.logsService.printLog(
            `Error calling webhookUrl`,
            'error',
            undefined,
            productId,
            JSON.stringify({
              jobId: job.id,
              webhookUrl: product.webhookUrl,
              status: response.status,
              response: response.data,
            }),
            'openai',
          );
        }
      }

      await this.productModel.findOneAndUpdate(
        { _id: new Types.ObjectId(productId) },
        { pendingReviews: 0 },
        { new: true },
      );
    }
  }

  fillPrompt(
    prompt: string,
    product: Product,
    match?: Product,
    reviews?: Review[],
  ): string {
    const filledPrompt = prompt
      .replaceAll('##product.name##', product.name)
      .replaceAll('##match.name##', match?.name || '')
      .replaceAll('##product.properties##', product.properties || '')
      .replaceAll('##match.properties##', match?.properties || '')
      .replaceAll('##product.price##', product.price || '')
      .replaceAll('##match.price##', match?.price || '')
      .replaceAll('##product.metadata##', product.metadata)
      .replaceAll('##match.metadata##', match?.metadata || '')
      .replaceAll('##product.facts##', product.facts?.join(', ') || '')
      .replaceAll(
        '##product.pendingReviews##',
        product.pendingReviews.toString(),
      )
      .replaceAll('##product.reviews##', JSON.stringify(reviews) || '');
    return filledPrompt;
  }
}
