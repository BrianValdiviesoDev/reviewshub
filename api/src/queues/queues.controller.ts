import { Controller, Post, Param, Body, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueuesService } from './queues.service';

@ApiBearerAuth()
@ApiTags('queues')
@Controller('queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Post('checkMatches/:id')
  async checkMatches(
    @Param('id') id: string,
    @Body() matches: { matches: string[] },
  ) {
    return await this.queuesService.addProductMatchJob(id, matches.matches);
  }

  @Post('endScrapeReviews/:id')
  async endScrapeReviews(@Param('id') id: string) {
    return await this.queuesService.endScrapeReviews(id);
  }
}
