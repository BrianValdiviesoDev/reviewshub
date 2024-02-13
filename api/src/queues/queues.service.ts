import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Product } from 'src/products/entities/products.schema';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { LogsService } from 'src/logs/logs.service';
import { ProductType } from 'src/products/entities/products.entity';
import {
  RequestStatus,
  RequestType,
} from 'src/requests/entities/request.entity';
import { ReviewType } from 'src/reviews/entities/reviews.entity';
import { ReviewDocument } from 'src/reviews/entities/reviews.schema';

@Injectable()
export class QueuesService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel('Request') private requestModel: Model<any>,
    @InjectModel('Review') private reviewModel: Model<any>,
    @InjectQueue('openai') private readonly openAiQueue: Queue,
    private readonly logsService: LogsService,
  ) {}

  async addProductMatchJob(
    productId: string,
    matches: string[],
  ): Promise<void> {
    if (!matches || matches.length === 0) {
      this.logsService.printLog(
        `No matches provided`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new BadRequestException('No matches provided');
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      this.logsService.printLog(
        `Product not found`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new NotFoundException('Product not found');
    }

    if (!product.matches || product.matches.length === 0) {
      this.logsService.printLog(
        `Product has no matches`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new BadRequestException('Product has no matches');
    }
    matches.forEach(async (match: string) => {
      const job = await this.openAiQueue.add('checkProductMatches', {
        productId,
        matchId: match,
      });
      this.logsService.printLog(
        `checkProductMatch added to queue.`,
        'info',
        undefined,
        productId,
        JSON.stringify({ jobId: job.id, matchId: match }),
        'queues',
      );
      return job;
    });
  }

  async getProductFacts(productId: string): Promise<void> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      this.logsService.printLog(
        `Product not found`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new NotFoundException('Product not found');
    }

    const allReviews = await this.getRelatedReviews(productId);
    const reviews = allReviews.filter((r) => r.type === ReviewType.SCRAPPED);
    if (reviews.length === 0) {
      this.logsService.printLog(
        `Product has no reviews`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new BadRequestException('Product has no reviews');
    }

    const job = await this.openAiQueue.add('getProductFacts', {
      product: productId,
    });
    this.logsService.printLog(
      `getProductFacts added to queue.`,
      'info',
      undefined,
      productId,
      JSON.stringify({ jobId: job.id }),
      'queues',
    );
  }

  async requestNewReviews(
    productId: string,
    number: number,
    user: JwtDto,
  ): Promise<void> {
    if (!number) {
      this.logsService.printLog(
        `No reviews number provided`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new BadRequestException('No reviews number provided');
    }
    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(productId),
      company: new Types.ObjectId(user.company),
    });
    if (!product) {
      this.logsService.printLog(
        `Product not found to generate reviews`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new NotFoundException('Product not found');
    }

    this.generateReviews(productId, number);
  }

  async generateReviews(productId: string, number: number): Promise<void> {
    const job = await this.openAiQueue.add('generateReviews', {
      product: productId,
      number: number,
    });
    this.logsService.printLog(
      `generateReviews added to queue`,
      'info',
      undefined,
      productId,
      JSON.stringify({ jobId: job.id, number }),
      'queues',
    );
  }

  async endScrapeReviews(productId: string): Promise<void> {
    let product = await this.productModel.findById(productId);
    if (!product) {
      this.logsService.printLog(
        `Product not found from endScrapeReviews`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new NotFoundException('Product not found');
    }

    if (product.type === ProductType.SCRAPPED) {
      product = await this.productModel.findOne({
        matches: { $elemMatch: { product: new Types.ObjectId(productId) } },
        type: ProductType.MANUAL,
        $or: [{ facts: { $exists: false } }, { facts: { $size: 0 } }],
      });
      if (!product) {
        this.logsService.printLog(
          `Product not found as match of other from endScrapeReviews`,
          'error',
          undefined,
          productId,
          undefined,
          'queues',
        );
        throw new NotFoundException('Product not found as match of other');
      }
    }

    if (!product.matches || product.matches.length === 0) {
      this.logsService.printLog(
        `Product has no matches and can not build facts`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new BadRequestException('Product has no matches');
    }

    const matchesId = product.matches
      .map((p) => new Types.ObjectId(p.product._id))
      .filter((id) => id.toString() !== productId);
    const requests = await this.requestModel.find({
      productId: { $in: matchesId },
      type: RequestType.GET_REVIEWS,
      status: { $in: [RequestStatus.PENDING, RequestStatus.IN_PROGRESS] },
    });
    if (requests.length > 0) {
      this.logsService.printLog(
        `Product has pending requests`,
        'error',
        undefined,
        productId,
        undefined,
        'queues',
      );
      throw new BadRequestException('Product has pending requests');
    }

    this.getProductFacts(product._id.toString());
  }

  async getRelatedReviews(productId: string): Promise<ReviewDocument[]> {
    const product = await this.productModel.findById(productId);
    const relatedProducts = [productId];

    if (product?.matches && product.matches.length > 0) {
      relatedProducts.push(
        ...product.matches.map((p) => p.product._id.toString()),
      );
    }

    if (!product || product.type === ProductType.SCRAPPED) {
      const parentProducts = await this.productModel.findOne({
        matches: { $elemMatch: { product: new Types.ObjectId(productId) } },
        type: ProductType.MANUAL,
        $or: [{ facts: { $exists: false } }, { facts: { $size: 0 } }],
      });

      if (parentProducts) {
        relatedProducts.push(parentProducts._id.toString());
      }
    }
    return await this.reviewModel.find({
      product: { $in: relatedProducts.map((p) => new Types.ObjectId(p)) },
    });
  }
}
