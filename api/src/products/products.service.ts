import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  Pipeline,
  ProductResponse,
  ProductStatus,
  ProductType,
} from './entities/products.entity';
import { RequestsService } from 'src/requests/requests.service';
import { CreateRequestDto } from 'src/requests/dto/create-request.dto';
import { Request } from 'src/requests/entities/requests.schema';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { UserRole } from 'src/users/entity/users.entity';
import { Prompt } from 'src/prompts/entities/prompt.schema';
import { PromptTypes } from 'src/prompts/entities/prompt.entity';
import { ProducerService } from 'src/queues/producer.service';
import { EventTypes } from 'src/queues/queues.entities';
import { SocketGateway } from 'src/socket/socket.gateway';
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Prompt.name) private promptModel: Model<Prompt>,
    private requestsService: RequestsService,
    private producerService: ProducerService,
    private readonly socketService: SocketGateway,
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

    const pipeline: Pipeline = {
      findInMarketplaces: false,
      readProducts: false,
      matching: false,
      readReviews: false,
      buildFacts: false,
      done: false,
    };

    data = {
      ...data,
      factsPrompt: new Types.ObjectId(data.factsPrompt),
      reviewsPrompt: new Types.ObjectId(data.reviewsPrompt),
      checkMatchesPrompt: new Types.ObjectId(data.checkMatchesPrompt),
      pipeline,
    };
    const product = await this.productModel.create(data);
    await this.resetPipeline(product._id.toString(), user);
    await this.findProductInMarketplaces(product._id.toString(), user);
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
    requests.forEach((r) => {
      this.requestsService.create(r, user);
    });
    this.resetPipeline(productId, user);
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

  getMarketPlaceSearchUrl(marketplace: MarketPlaces, keywords: string): string {
    if (marketplace === MarketPlaces.AMAZON) {
      const searchTerm = keywords.replaceAll(' ', '+');
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

  async manualBuildFacts(productId: string, user: JwtDto): Promise<void> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new BadRequestException('You are not allowed to build facts');
    }
    await this.buildFacts(productId);
  }

  async buildFacts(productId: string): Promise<void> {
    await this.producerService.sendToApiQueue({
      event: EventTypes.generate_product_facts,
      data: { productId: productId },
    });
  }

  async getNewReviews(
    productId: string,
    number: number,
    user: JwtDto,
  ): Promise<void> {
    const product = await this.productModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(productId),
        company: new Types.ObjectId(user.company),
      },
      {
        $set: { pendingReviews: number },
      },
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.producerService.sendToApiQueue({
      event: EventTypes.generate_reviews,
      data: { productId: productId },
    });
  }

  async resetPipeline(productId: string, user: JwtDto): Promise<void> {
    const pipeline: Pipeline = {
      findInMarketplaces: false,
      readProducts: false,
      matching: false,
      readReviews: false,
      buildFacts: false,
      done: false,
    };
    await this.updatePipeline(productId, pipeline);
  }

  async updatePipeline(productId: string, pipeline: Pipeline): Promise<void> {
    await this.productModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(productId),
      },
      {
        $set: {
          pipeline: {
            ...pipeline,
          },
        },
      },
    );

    await this.socketService.emit(EventTypes.pipeline_updated, {
      productId,
      pipeline,
    });
  }

  async checkPipeline(productId: string): Promise<void> {
    const exists = await this.productModel.findById(productId);
    if (!exists) {
      throw new NotFoundException('Product not found');
    }
    let product;
    if (exists.type === ProductType.SCRAPPED) {
      product = await this.findOriginalProduct(productId);
      if (!product) {
        throw new NotFoundException('Original product not found');
      }
    } else {
      product = exists;
    }

    const pipeline: Pipeline = {
      findInMarketplaces: false,
      readProducts: false,
      matching: false,
      readReviews: false,
      buildFacts: false,
      done: false,
    };

    const requestsOrigin = await this.requestsService.findByProduct(
      product._id.toString(),
    );
    const requests = await this.requestsService.findByProduct(productId);
    const pendingRequests = [...requestsOrigin, ...requests].filter(
      (r) =>
        r.status === RequestStatus.PENDING ||
        r.status === RequestStatus.IN_PROGRESS,
    );

    const findInMarketplaces = pendingRequests.find(
      (r) => r.type === RequestType.FIND_PRODUCT,
    );
    if (!findInMarketplaces) {
      pipeline.findInMarketplaces = true;
    }

    if (product.matches && product.matches.length > 0) {
      const pendingMatch = product.matches.find((m) => m.percentage.length < 1);
      if (!pendingMatch) {
        pipeline.matching = true;
      }

      const readProducts = pendingRequests.find(
        (r) => r.type === RequestType.GET_PRODUCT_INFO,
      );
      if (!readProducts) {
        pipeline.readProducts = true;
      }

      const readReviews = pendingRequests.find(
        (r) => r.type === RequestType.GET_REVIEWS,
      );
      if (!readReviews && !pendingMatch) {
        pipeline.readReviews = true;
      }
      if (product.facts && product.facts.length > 0) {
        pipeline.buildFacts = true;
      }
    }

    if (
      pipeline.findInMarketplaces ||
      pipeline.readProducts ||
      pipeline.readReviews ||
      pipeline.buildFacts
    ) {
      pipeline.done = false;
    }
    await this.updatePipeline(productId, pipeline);
  }

  async findOriginalProduct(matchId: string): Promise<Product | null> {
    return await this.productModel.findOne({
      'matches.product': new Types.ObjectId(matchId),
    });
  }

  async addReviews(productId: string, reviews: string[]): Promise<void> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const pendingReviews = product.pendingReviews - reviews.length;
    await this.productModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(productId),
      },
      {
        $set: { reviews, pendingReviews },
      },
    );
    await this.socketService.emit(EventTypes.new_reviews_generated, {
      productId,
    });
    await this.checkPipeline(productId);
  }
}
