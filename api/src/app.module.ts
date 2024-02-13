import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RequestsModule } from './requests/requests.module';
import { QueuesModule } from './queues/queues.module';
import { BullModule } from '@nestjs/bull';
import { LogsModule } from './logs/logs.module';
import { PromptsModule } from './prompts/prompts.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_DB_URI'),
      }),
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }),
    UsersModule,
    AuthModule,
    CompaniesModule,
    ProductsModule,
    ReviewsModule,
    RequestsModule,
    QueuesModule,
    LogsModule,
    PromptsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
