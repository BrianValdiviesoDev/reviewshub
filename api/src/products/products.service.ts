import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './entities/products.schema';
import { Model, Types } from 'mongoose';
import {
  RequestStatus,
  RequestType,
} from 'src/requests/entities/request.entity';
import {
  MarketPlaces,
  ProductResponse,
  ProductStatus,
} from './entities/products.entity';
import { RequestsService } from 'src/requests/requests.service';
import { CreateRequestDto } from 'src/requests/dto/create-request.dto';
import { Request } from 'src/requests/entities/requests.schema';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { UserRole } from 'src/users/entity/users.entity';
import { QueuesService } from 'src/queues/queues.service';
import { Prompt } from 'src/prompts/entities/prompt.schema';
import { PromptTypes } from 'src/prompts/entities/prompt.entity';
import { ProducerService } from 'src/queues/producer.service';
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Request.name) private requestModel: Model<Request>,
    @InjectModel(Prompt.name) private promptModel: Model<Prompt>,
    private requestsService: RequestsService,
    private queuesService: QueuesService,
    private producerService: ProducerService,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    user: JwtDto,
    pendingReviews: number = 0,
    webhookUrl?: string,
  ): Promise<ProductDocument> {
    let data: any = {
      ...createProductDto,
      company: user.company ? new Types.ObjectId(user.company) : undefined,
      pendingReviews,
      webhookUrl,
    };
    if (!createProductDto.factsPrompt) {
      const prompt = await this.promptModel
        .findOne({
          type: PromptTypes.GENERATE_FACTS,
        })
        .sort({ createdAt: -1 });
      data = {
        ...data,
        factsPrompt: prompt?._id,
      };
    }
    if (!createProductDto.reviewsPrompt) {
      const prompt = await this.promptModel
        .findOne({
          type: PromptTypes.GENERATE_REVIEWS,
        })
        .sort({ createdAt: -1 });
      data = {
        ...data,
        reviewsPrompt: prompt?._id,
      };
    }

    if (!createProductDto.checkMatchesPrompt) {
      const prompt = await this.promptModel
        .findOne({
          type: PromptTypes.CHECK_MATCHES,
        })
        .sort({ createdAt: -1 });
      data = {
        ...data,
        checkMatchesPrompt: prompt?._id,
      };
    }

    data = {
      ...data,
      factsPrompt: new Types.ObjectId(data.factsPrompt),
      reviewsPrompt: new Types.ObjectId(data.reviewsPrompt),
      checkMatchesPrompt: new Types.ObjectId(data.checkMatchesPrompt),
    };
    const product = await this.productModel.create(data);
    this.producerService.sendToAmazonQueue({ new_product: product.name });
    //await this.findProductInMarketplaces(product._id.toString(), user);
    return product;
  }

  async findProductInMarketplaces(
    productId: string,
    user: JwtDto,
  ): Promise<void> {
    let filter: any = {
      _id: new Types.ObjectId(productId),
    };

    if (user.rol !== UserRole.SUPERADMIN) {
      filter = {
        ...filter,
        company: new Types.ObjectId(user.company),
      };
    }

    const product = await this.productModel.findOne(filter);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const requests = Object.values(MarketPlaces)
      .map((marketplace) => {
        return {
          url: this.getMarketPlaceSearchUrl(marketplace, product.name),
          type: RequestType.FIND_PRODUCT,
          status: RequestStatus.PENDING,
          productId,
        };
      })
      .filter((r) => r.url);

    await this.requestsService.createMany(requests);
    await this.requestsService.startScrapper();
  }

  async findAll(user: JwtDto): Promise<ProductResponse[]> {
    let match = {};
    if (user.rol !== UserRole.SUPERADMIN) {
      match = {
        company: new Types.ObjectId(user.company),
      };
    }
    const products = await this.productModel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'product',
          as: 'scrappedReviews',
        },
      },
      {
        $lookup: {
          from: 'requests',
          localField: '_id',
          foreignField: 'productId',
          as: 'requests',
        },
      },
    ]);

    const productsResponse = products.map((p) => {
      const inProgress = p.requests.find(
        (r: Request) => r.status === RequestStatus.IN_PROGRESS,
      );

      let status = ProductStatus.PROCESSING;

      if (!inProgress) {
        const pending = p.requests.find(
          (r: Request) => r.status === RequestStatus.PENDING,
        );
        if (pending) {
          status = ProductStatus.PENDING;
        } else {
          const error = p.requests.find(
            (r: Request) => r.status === RequestStatus.ERROR,
          );
          if (error) {
            status = ProductStatus.ERROR;
          } else {
            status = ProductStatus.DONE;
          }
        }
      }
      return {
        ...p,
        status,
      };
    });

    return productsResponse;
  }

  async findOne(id: string, user: JwtDto): Promise<ProductDocument> {
    let filter: any = {
      _id: new Types.ObjectId(id),
    };
    if (user.rol !== UserRole.SUPERADMIN) {
      filter = {
        ...filter,
        company: new Types.ObjectId(user.company),
      };
    }

    const product = await this.productModel.findOne(filter).populate({
      path: 'matches.product',
      model: Product.name,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: JwtDto,
  ): Promise<ProductDocument> {
    let filter: any = {
      _id: new Types.ObjectId(id),
    };
    if (user.rol !== UserRole.SUPERADMIN) {
      filter = {
        ...filter,
        company: new Types.ObjectId(user.company),
      };
    }
    const update = {
      name: updateProductDto.name,
      marketplace: updateProductDto.marketplace,
      image: updateProductDto.image,
      originUrl: updateProductDto.originUrl,
      matches: updateProductDto.matches,
      properties: updateProductDto.properties,
      metadata: updateProductDto.metadata,
      price: updateProductDto.price,
      rating: updateProductDto.rating,
      reviews: updateProductDto.reviews,
      factsPrompt: new Types.ObjectId(updateProductDto.factsPrompt),
      reviewsPrompt: new Types.ObjectId(updateProductDto.reviewsPrompt),
      checkMatchesPrompt: new Types.ObjectId(
        updateProductDto.checkMatchesPrompt,
      ),
    };
    const product = await this.productModel.findOneAndUpdate(
      filter,
      {
        $set: update,
      },
      { new: true },
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async remove(id: string, user: JwtDto): Promise<void> {
    let filter: any = {
      _id: new Types.ObjectId(id),
    };
    if (user.rol !== UserRole.SUPERADMIN) {
      filter = {
        ...filter,
        company: new Types.ObjectId(user.company),
      };
    }
    const product = await this.productModel.findOne(filter);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    //TODO remove reviews and requests
    await this.productModel.deleteOne(filter);
  }

  async verifyProduct(
    id: string,
    matchId: string,
    user: JwtDto,
  ): Promise<ProductDocument> {
    let filter: any = {
      _id: new Types.ObjectId(id),
    };
    if (user.rol !== UserRole.SUPERADMIN) {
      filter = {
        ...filter,
        company: new Types.ObjectId(user.company),
      };
    }
    const product = await this.productModel.findOne(filter);

    const match = await this.productModel.findById({
      _id: new Types.ObjectId(matchId),
    });

    if (!product || !match || !product.matches) {
      throw new NotFoundException('Products not found');
    }

    const matches = product.matches.map((p) => {
      if (p.product.toString() === matchId) {
        return {
          ...p,
          percentage: 100,
        };
      }
      return p;
    });

    const updated = await this.productModel.findOneAndUpdate(
      filter,
      {
        $set: { matches },
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    const reviewRequest: CreateRequestDto = {
      url: match.originUrl,
      type: RequestType.GET_REVIEWS,
      status: RequestStatus.PENDING,
      productId: matchId,
    };

    await this.requestsService.create(reviewRequest);

    return updated;
  }

  async buildFacts(productId: string): Promise<void> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.matches) {
      if (!product.matches.find((m) => m.percentage.length === 0)) {
        const matchesId = product.matches.map(
          (p) => new Types.ObjectId(p.product._id),
        );
        const requests = await this.requestModel.find({
          productId: { $in: matchesId },
          type: RequestType.GET_REVIEWS,
          status: RequestStatus.PENDING,
        });
        if (requests.length === 0) {
          this.queuesService.getProductFacts(productId);
        }
      }
    }
  }

  getMarketPlaceSearchUrl(marketplace: MarketPlaces, keywords: string): string {
    if (marketplace === MarketPlaces.AMAZON) {
      const searchTerm = keywords.replace(' ', '+');
      return `https://www.amazon.com/s?k=${searchTerm}`;
    }
    /*
    if (marketplace === MarketPlaces.PCCOMPONENTES) {
      const searchTerm = encodeURIComponent(keywords);
      return `https://www.pccomponentes.com/buscar/?query=${searchTerm}`;
    }

    if (marketplace === MarketPlaces.MANOMANO) {
      const searchTerm = keywords.replace(' ', '+');
      return `https://www.manomano.es/busqueda/${searchTerm}`;
    }

    if (marketplace === MarketPlaces.FNAC) {
      const searchTerm = keywords.replace(' ', '+');
      return `https://www.fnac.es/SearchResult/ResultList.aspx?Search=${searchTerm}&sft=1&sa=0`;
    }
    */

    return '';
  }
}
