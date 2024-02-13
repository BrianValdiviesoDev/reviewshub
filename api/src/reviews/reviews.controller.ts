import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserRole } from 'src/users/entity/users.entity';
import { Roles } from 'src/auth/roles.decorator';
import { QueuesService } from 'src/queues/queues.service';

@ApiBearerAuth()
@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly queuesService: QueuesService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @Req() req: any) {
    return this.reviewsService.create(createReviewDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.reviewsService.findAll(req.user);
  }

  @UseGuards(AuthGuard)
  @Get('/product/:productId')
  findByProduct(@Param('productId') productId: string, @Req() req: any) {
    return this.reviewsService.findByProduct(productId, req.user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.update(id, updateReviewDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.remove(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Post('generateReviews/:id')
  async getNewReviews(
    @Param('id') id: string,
    @Body() data: { number: number },
    @Req() request: any,
  ) {
    return await this.queuesService.requestNewReviews(
      id,
      data.number,
      request.user,
    );
  }
}
