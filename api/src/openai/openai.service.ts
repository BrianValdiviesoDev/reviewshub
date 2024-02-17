import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Product } from 'src/products/entities/products.schema';
import { LogsService } from 'src/logs/logs.service';
import {
  RequestStatus,
  RequestType,
} from 'src/requests/entities/request.entity';
import { ReviewType } from 'src/reviews/entities/reviews.entity';
import { Review } from 'src/reviews/entities/reviews.schema';
import { ReviewsService } from 'src/reviews/reviews.service';
import { ProducerService } from 'src/queues/producer.service';
import { EventTypes } from 'src/queues/queues.entities';
import { Prompt } from 'src/prompts/entities/prompt.schema';
import OpenAI from 'openai';
import { RequestsService } from 'src/requests/requests.service';
import { HttpService } from '@nestjs/axios';
import { Request } from 'src/requests/entities/requests.schema';
import { Pipeline } from 'src/products/entities/products.entity';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class OpenaiService {
  match_threshold: number = process.env.MATCH_THRESHOLD
    ? parseInt(process.env.MATCH_THRESHOLD)
    : 85;

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Request.name) private requestModel: Model<Request>,
    private readonly reviewService: ReviewsService,
    private readonly logsService: LogsService,
    private readonly producerService: ProducerService,
    private readonly requestService: RequestsService,
    private readonly httpService: HttpService,
  ) {}

  async checkProductMatches(productId: string, matchId: string) {
    if (process.env.OPENAI_API_KEY === undefined) {
      this.logsService.printLog(
        `OPENAI_API_KEY is not defined`,
        'error',
        undefined,
        productId,
        JSON.stringify({ matchId: matchId }),
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
        JSON.stringify({ matchId: matchId }),
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
        JSON.stringify({ matchId: matchId }),
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
        JSON.stringify({ matchId: matchId }),
        'openai',
      );
      throw new NotFoundException('Product has no checkMatchesPrompt');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [];
    if ((product.checkMatchesPrompt as any)?.preprompt) {
      messages.push({
        role: 'system',
        content: this.fillPrompt(
          (product.checkMatchesPrompt as any)?.preprompt,
          product,
          match,
        ),
      });
    }
    messages.push({
      role: 'user',
      content: this.fillPrompt(
        (product.checkMatchesPrompt as any)?.prompt,
        product,
        match,
      ),
    });
    this.logsService.printLog(
      `Calling OpenAI API to check matches`,
      'info',
      undefined,
      productId,
      JSON.stringify({ matchId: matchId, messages: messages }),
      'openai',
    );
    const completion = await openai.chat.completions.create({
      messages: messages as ChatCompletionMessageParam[],
      model: (product.checkMatchesPrompt as any)?.model,
    });

    const response = completion.choices[0].message.content;
    //TODO save token cost

    if (response) {
      console.log('========= CHECK MATCHES RESPONSE =========');
      console.log(response);
      console.log('========= CHECK MATCHES RESPONSE=========');
      let probability: number | undefined;

      if (response.length > 2) {
        console.log('Response is too long, truncating');
        try {
          const json = JSON.parse(response);
          if (json.probability) {
            probability = parseInt(json.probability);
          } else if (json.response) {
            probability = parseInt(json.response);
          }
        } catch (e) {
          console.log('Error parsing json probability', e);
          this.logsService.printLog(
            `OpenAI error parsing json probability`,
            'error',
            undefined,
            productId,
            JSON.stringify({
              matchId: matchId,
              response: response,
              error: e,
            }),
            'openai',
          );
        }
      } else {
        try {
          probability = parseInt(response, 10);
        } catch (e) {
          console.log('Error parsing probability', e);
          this.logsService.printLog(
            `OpenAI error parsing probability`,
            'error',
            undefined,
            productId,
            JSON.stringify({
              matchId: matchId,
              response: response,
              error: e,
            }),
            'openai',
          );
        }
      }

      if (typeof probability === 'number') {
        this.logsService.printLog(
          `OpenAI ended`,
          'result',
          undefined,
          productId,
          JSON.stringify({
            matchId: matchId,
            response: response,
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
          await this.producerService.sendToApiQueue({
            event: EventTypes.product_updated,
            data: {
              productId: updated._id.toString(),
            },
          });
          await this.producerService.sendToApiQueue({
            event: EventTypes.update_pipeline,
            data: {
              productId: updated._id.toString(),
            },
          });
          const updatedMatch = updated.matches.find(
            (m) => m.product.toString() === matchId,
          );

          if (updatedMatch && updatedMatch.percentage.length > 0) {
            const average =
              updatedMatch.percentage.reduce((a, b) => a + b) /
              updatedMatch.percentage.length;
            if (average > this.match_threshold) {
              await this.requestService.create({
                url: match.originUrl,
                type: RequestType.GET_REVIEWS,
                status: RequestStatus.PENDING,
                productId: matchId,
              });
            }
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
          matchId: matchId,
          response: completion,
        }),
        'openai',
      );
    }
  }

  async getFacts(productId?: string, matchId?: string) {
    if (!productId && !matchId) {
      this.logsService.printLog(
        `No productId or matchId provided`,
        'error',
        undefined,
        productId,
        undefined,
        'openai',
      );
      throw new NotFoundException('No productId or matchId provided');
    }

    if (process.env.OPENAI_API_KEY === undefined) {
      this.logsService.printLog(
        `OPENAI_API_KEY is not defined`,
        'error',
        undefined,
        productId,
        undefined,
        'openai',
      );
      throw new Error('OPENAI_API_KEY is not defined');
    }

    let product: Product | null;
    if (!productId) {
      product = await this.productModel
        .findOne({
          'matches.product': new Types.ObjectId(matchId),
        })
        .populate({
          path: 'factsPrompt',
          model: Prompt.name,
        });
    } else {
      product = await this.productModel.findById(productId).populate({
        path: 'factsPrompt',
        model: Prompt.name,
      });
    }

    if (!product) {
      this.logsService.printLog(
        `Product not found`,
        'error',
        undefined,
        productId,
        undefined,
        'openai',
      );
      throw new NotFoundException('Product not found');
    }
    productId = product._id.toString();

    if (!product.factsPrompt || !(product.factsPrompt as any)?.prompt) {
      this.logsService.printLog(
        `Product without factsPrompt`,
        'error',
        undefined,
        productId,
        undefined,
        'openai',
      );
      throw new NotFoundException('Product has no factsPrompt');
    }

    if (!product.matches || product.matches.length === 0) {
      this.logsService.printLog(
        `Product has not matches`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new NotFoundException('Product has not matches');
    }

    const matchesId = product.matches.map(
      (p) => new Types.ObjectId(p.product._id),
    );
    const requests = await this.requestModel.find({
      productId: { $in: matchesId },
      status: RequestStatus.PENDING,
    });

    if (requests.length > 1) {
      this.logsService.printLog(
        `Product has pending requests`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new NotFoundException('Product has pending requests');
    }

    const allReviews = await this.reviewService.getRelatedReviews(productId);
    const reviews = allReviews.filter((r) => r.type === ReviewType.SCRAPPED);

    if (!reviews) {
      this.logsService.printLog(
        `This product has no reviews`,
        'error',
        undefined,
        productId,
        undefined,
        'openai',
      );
      throw new NotFoundException('This product has no reviews');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [];
    if ((product.factsPrompt as any)?.preprompt) {
      messages.push({
        role: 'system',
        content: this.fillPrompt(
          (product.factsPrompt as any)?.preprompt,
          product,
          undefined,
        ),
      });
    }
    messages.push({
      role: 'user',
      content: this.fillPrompt(
        (product.factsPrompt as any)?.prompt,
        product,
        undefined,
      ),
    });
    this.logsService.printLog(
      `Calling OpenAI API to get facts`,
      'info',
      undefined,
      productId,
      JSON.stringify({ messages }),
      'openai',
    );
    const completion = await openai.chat.completions.create({
      messages: messages as ChatCompletionMessageParam[],
      model: (product.factsPrompt as any)?.model,
    });

    const response = completion.choices[0].message.content;
    this.logsService.printLog(
      `OpenAI Response ended`,
      'result',
      undefined,
      productId,
      JSON.stringify({
        response: response ? response.slice(0, 100) + '...' : '',
      }),
      'openai',
    );

    if (response) {
      console.log('========= FACTS RESPONSE =========');
      console.log(response);
      console.log('========= FACTS RESPONSE =========');
      const facts = response.replaceAll(',', ' ').split('\n');
      const product = await this.productModel.findById(productId);
      if (!product) {
        this.logsService.printLog(
          `Product not found updating facts`,
          'error',
          undefined,
          productId,
          undefined,
          'openai',
        );
        throw new NotFoundException('Product not found');
      }

      const pipeline: Pipeline = {
        ...product.pipeline,
        buildFacts: true,
      };
      await this.productModel.updateOne(
        { _id: productId },
        { facts, pipeline },
        { new: true },
      );
      await this.producerService.sendToApiQueue({
        event: EventTypes.product_updated,
        data: {
          productId: productId,
        },
      });
      await this.producerService.sendToApiQueue({
        event: EventTypes.pipeline_updated,
        data: { productId: productId, pipeline },
      });

      await this.producerService.sendToApiQueue({
        event: EventTypes.product_facts_generated,
        data: { productId: productId },
      });
    }
  }

  async generateReviews(productId: string) {
    if (process.env.OPENAI_API_KEY === undefined) {
      this.logsService.printLog(
        `OPENAI_API_KEY is not defined`,
        'error',
        undefined,
        productId,
        undefined,
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
        undefined,
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
        undefined,
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
        undefined,
        'openai',
      );
      throw new NotFoundException('Product has no reviewsPrompt');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [];
    if ((product.reviewsPrompt as any)?.preprompt) {
      messages.push({
        role: 'system',
        content: this.fillPrompt(
          (product.reviewsPrompt as any)?.preprompt,
          product,
          undefined,
        ),
      });
    }
    messages.push({
      role: 'user',
      content: this.fillPrompt(
        (product.reviewsPrompt as any)?.prompt,
        product,
        undefined,
      ),
    });
    this.logsService.printLog(
      `Calling OpenAI API to generate reviews.`,
      'info',
      undefined,
      productId,
      undefined,
      'openai',
    );
    const completion = await openai.chat.completions.create({
      messages: messages as ChatCompletionMessageParam[],
      model: (product.reviewsPrompt as any)?.model,
    });

    const response = completion.choices[0].message.content;
    this.logsService.printLog(
      `OpenAI ended`,
      'result',
      undefined,
      productId,
      JSON.stringify({
        response: response ? response.slice(0, 500) + '...' : '',
      }),
      'openai',
    );
    if (response) {
      console.log('========= REVIEWS RESPONSE =========');
      console.log(response);
      console.log('========= REVIEWS RESPONSE =========');
      try {
        const reviews = JSON.parse(response);
        const savedReviews: any = [];
        await Promise.all(
          reviews.map(async (review: any) => {
            const result = await this.reviewService.create({
              title: review.title,
              description: review.description,
              rating: review.rating,
              product: productId,
              type: ReviewType.GENERATED,
              url: '',
              username: '',
              userAvatar: '',
              reviewDate: new Date(),
              buyDate: new Date(),
              images: [],
              positiveVotes: 0,
              negativeVotes: 0,
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
            JSON.stringify({ webhookUrl: product.webhookUrl }),
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
                webhookUrl: product.webhookUrl,
                status: response.status,
                response: response.data,
              }),
              'openai',
            );
          }
        }
        const pendingReviews = product.pendingReviews + savedReviews.length;
        const updatedProduct = await this.productModel.findOneAndUpdate(
          { _id: new Types.ObjectId(productId) },
          { $set: { pendingReviews, 'pipeline.done': true } },
          { new: true },
        );

        await this.producerService.sendToApiQueue({
          event: EventTypes.pipeline_updated,
          data: {
            productId: productId,
            pipeline: updatedProduct?.pipeline,
          },
        });

        await this.producerService.sendToApiQueue({
          event: EventTypes.new_reviews_generated,
          data: {
            productId: productId,
          },
        });
      } catch (e) {
        console.error('Error parsing reviews', e);
      }
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
      .replaceAll('##product.price##', product.price?.toString() || '')
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
