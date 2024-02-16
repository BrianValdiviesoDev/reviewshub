import { Injectable, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { LogsService } from 'src/logs/logs.service';
import { EventTypes, QueueMessage } from './queues.entities';
import { OpenaiService } from 'src/openai/openai.service';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;
  private readonly queueName = process.env.API_QUEUE || 'api_queue';

  constructor(
    private readonly logsService: LogsService,
    private readonly openaiService: OpenaiService,
  ) {
    const connection = amqp.connect([
      process.env.RABBITMQ_URI || 'amqp://localhost',
    ]);
    this.channelWrapper = connection.createChannel();
  }

  public async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(this.queueName, { durable: true });
        await channel.consume(this.queueName, async (message) => {
          if (message) {
            const content: QueueMessage = JSON.parse(
              message.content.toString(),
            );
            this.logsService.printLog(
              `Message received`,
              'info',
              undefined,
              undefined,
              message.content.toString(),
              'queues',
            );

            channel.ack(message);
            try {
              switch (content.event) {
                case EventTypes.check_match:
                  if (content.data?.matchId && content.data?.productId) {
                    await this.openaiService.checkProductMatches(
                      content.data.productId,
                      content.data.matchId,
                    );
                  }
                  break;
                case EventTypes.generate_product_facts:
                  if (content.data?.productId) {
                    this.openaiService.getFacts(content.data.productId);
                  }
                  break;
                case EventTypes.generate_reviews:
                  if (content.data?.productId) {
                    this.openaiService.generateReviews(content.data.productId);
                  }
                  break;
                case EventTypes.new_reviews_scrapped:
                  if (content.data?.productId) {
                    await this.openaiService.getFacts(
                      undefined,
                      content.data.productId,
                    );
                  }
                  break;
                case EventTypes.product_facts_generated:
                  if (content.data?.productId) {
                    await this.openaiService.generateReviews(
                      content.data.productId,
                    );
                  }
                  break;
                default:
                  this.logsService.printLog(
                    `Event not recognized: ${content.event}`,
                    'error',
                    undefined,
                    undefined,
                    message.content.toString(),
                    'queues',
                  );
                  break;
              }
            } catch (err) {
              this.logsService.printLog(
                `Error processing message: ${content.event}`,
                'error',
                undefined,
                undefined,
                err.toString(),
                'queues',
              );
            }
          }
        });
      });
    } catch (err) {
      this.logsService.printLog(
        `Can't start consumer service`,
        'error',
        undefined,
        undefined,
        undefined,
        'queues',
      );
    }
  }
}
