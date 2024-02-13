import { Module } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Prompt, PromptSchema } from './entities/prompt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
  ],
  controllers: [PromptsController],
  providers: [PromptsService],
})
export class PromptsModule {}
