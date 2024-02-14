import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review, ReviewDocument } from './entities/reviews.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { UserRole } from 'src/users/entity/users.entity';
import { Product } from 'src/products/entities/products.schema';
import { ProductType } from 'src/products/entities/products.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}
  async create(createReviewDto: CreateReviewDto): Promise<ReviewDocument> {
    return this.reviewModel.create({
      ...createReviewDto,
      product: new Types.ObjectId(createReviewDto.product),
    });
  }

  async findAll(user: JwtDto): Promise<ReviewDocument[]> {
    if (user.rol !== UserRole.SUPERADMIN && user.rol !== UserRole.MANAGER) {
      throw new ForbiddenException('You are not allowed to create reviews');
    }
    const products = await this.productModel.find({ company: user.company });
    return await this.reviewModel.find({
      product: { $in: products.map((p) => new Types.ObjectId(p._id)) },
    });
  }

  async findByProduct(
    productId: string,
    user: JwtDto,
  ): Promise<ReviewDocument[]> {
    const productFilter: any = {
      _id: new Types.ObjectId(productId),
    };

    if (user.rol !== UserRole.SUPERADMIN) {
      productFilter.company = new Types.ObjectId(user.company);
    }

    const product = await this.productModel.findOne(productFilter);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return await this.reviewModel.find({
      product: new Types.ObjectId(productId),
    });
  }

  async findOne(id: string, user: JwtDto): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(review.product),
      company: new Types.ObjectId(user.company),
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    user: JwtDto,
  ): Promise<ReviewDocument> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('You are not allowed to update reviews');
    }
    const review = await this.reviewModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $set: updateReviewDto,
      },
      { new: true },
    );

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async remove(id: string, user: JwtDto): Promise<void> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('You are not allowed to delete reviews');
    }
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewModel.deleteOne({ _id: new Types.ObjectId(id) });
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
