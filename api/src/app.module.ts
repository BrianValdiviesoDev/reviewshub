import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RequestsModule } from './requests/requests.module';
import { LogsModule } from './logs/logs.module';
import { PromptsModule } from './prompts/prompts.module';
import { OpenaiModule } from './openai/openai.module';
import { QueuesModule } from './queues/queues.module';
import { SocketModule } from './socket/socket.module';

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
    UsersModule,
    AuthModule,
    CompaniesModule,
    ProductsModule,
    ReviewsModule,
    RequestsModule,
    LogsModule,
    PromptsModule,
    OpenaiModule,
    QueuesModule,
    SocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
