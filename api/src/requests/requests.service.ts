import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Request, RequestDocument } from './entities/requests.schema';
import { Model, Types } from 'mongoose';
import { RequestStatus } from './entities/request.entity';
import { HttpService } from '@nestjs/axios';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { UserRole } from 'src/users/entity/users.entity';
import { Product } from 'src/products/entities/products.schema';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Request.name) private requestModel: Model<Request>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly httpService: HttpService,
  ) {}

  async create(
    createRequestDto: CreateRequestDto,
    user?: JwtDto,
  ): Promise<RequestDocument> {
    const exists = await this.requestModel.findOne({
      productId: createRequestDto.productId,
      type: createRequestDto.type,
      status: RequestStatus.PENDING,
      url: createRequestDto.url,
    });
    if (exists) {
      return exists;
    }
    const data = {
      ...createRequestDto,
      productId: new Types.ObjectId(createRequestDto.productId),
      company: user?.company,
    };
    const request = await this.requestModel.create(data);
    await this.startScrapper();
    return request;
  }

  async createMany(
    createRequestDto: CreateRequestDto[],
  ): Promise<RequestDocument[]> {
    const insert = createRequestDto.map((req) => {
      return {
        ...req,
        productId: new Types.ObjectId(req.productId),
      };
    });
    return await this.requestModel.insertMany(insert);
  }

  async findAll(user: JwtDto): Promise<RequestDocument[]> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('You are not allowed to list requests');
    }
    return await this.requestModel.find();
  }

  async findByProduct(id: string, user: JwtDto): Promise<RequestDocument[]> {
    if (user.rol !== UserRole.SUPERADMIN && user.rol !== UserRole.MANAGER) {
      throw new ForbiddenException('You are not allowed to list requests');
    }
    const filter: any = {
      _id: new Types.ObjectId(id),
    };

    if (user.rol === UserRole.MANAGER) {
      filter.company = new Types.ObjectId(user.company);
    }

    const product = await this.productModel.findOne(filter);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const matchesId =
      product.matches?.map((p) => new Types.ObjectId(p.product._id)) || [];
    matchesId.push(new Types.ObjectId(product._id));
    return await this.requestModel.find({
      productId: { $in: matchesId },
    });
  }

  async findOne(id: string, user: JwtDto): Promise<RequestDocument> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('You are not allowed to list requests');
    }
    const req = await this.requestModel.findById(id);
    if (!req) {
      throw new NotFoundException('Request not found');
    }
    return req;
  }

  async updateStatus(
    id: string,
    status: RequestStatus,
    user: JwtDto,
  ): Promise<RequestDocument> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('You are not allowed to list requests');
    }
    const req = await this.requestModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $set: { status },
      },
      { new: true },
    );

    if (!req) {
      throw new NotFoundException('Request not found');
    }

    return req;
  }

  async remove(id: string, user: JwtDto): Promise<void> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('You are not allowed to list requests');
    }
    const req = await this.requestModel.findById(id);
    if (!req) {
      throw new NotFoundException('Request not found');
    }

    await this.requestModel.deleteOne({ _id: new Types.ObjectId(id) });
  }

  async startScrapper(): Promise<void> {
    const response = await this.httpService.axiosRef.post(
      `${process.env.SCRAPPER_URL}/controls/start`,
      {},
    );
    if (response.status !== 200) {
      throw new Error('Error starting scrapper');
    }
    return;
  }

  async stopScrapper(): Promise<void> {
    const response = await this.httpService.axiosRef.post(
      `${process.env.SCRAPPER_URL}/controls/stop`,
      {},
    );
    if (response.status !== 200) {
      throw new Error('Error stopping scrapper');
    }
    return;
  }
}
