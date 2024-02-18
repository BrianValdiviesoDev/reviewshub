import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, verifyProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entity/users.entity';
import { RequestNewsReviewsDto } from './dto/request-reviews.dto';

@ApiBearerAuth()
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(createProductDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  @Post('/generate')
  requestNewReviews(@Body() data: RequestNewsReviewsDto, @Req() req: any) {
    return this.productsService.create(
      data.product,
      req.user,
      data.numberOfReviews,
      data.webhookUrl,
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.productsService.findAll(req.user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.productsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.productsService.remove(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/verify')
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  verify(
    @Param('id') id: string,
    @Body() verify: verifyProductDto,
    @Req() req: any,
  ) {
    return this.productsService.verifyProduct(id, verify.matchId, req.user);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/findinmarketplaces')
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  findInMarketplaces(@Param('id') id: string, @Req() req: any) {
    return this.productsService.findProductInMarketplaces(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/buildFacts')
  @Roles(UserRole.SUPERADMIN)
  buildFacts(@Param('id') id: string, @Req() req: any) {
    return this.productsService.manualBuildFacts(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Post(':id/generateReviews')
  generateReviews(
    @Param('id') id: string,
    @Body() data: RequestNewsReviewsDto,
    @Req() req: any,
  ) {
    return this.productsService.getNewReviews(
      id,
      data.numberOfReviews,
      req.user,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':id/checkMatches')
  @Roles(UserRole.SUPERADMIN)
  checkmatches(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.productsService.checkProductMatches(id, data.matches, req.user);
  }
}
