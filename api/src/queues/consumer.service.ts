import { Injectable, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { LogsService } from 'src/logs/logs.service';
import { EventTypes, QueueMessage } from './queues.entities';
import { OpenaiService } from 'src/openai/openai.service';
import { ProductsService } from 'src/products/products.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { RequestsService } from 'src/requests/requests.service';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;
  private readonly queueName = process.env.API_QUEUE || 'api_queue';

  constructor(
    private readonly logsService: LogsService,
    private readonly openaiService: OpenaiService,
    private readonly productService: ProductsService,
    private readonly socketService: SocketGateway,
    private readonly requestService: RequestsService,
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
                case EventTypes.update_pipeline:
                  if (content.data?.productId) {
                    await this.productService.checkPipeline(
                      content.data.productId,
                    );
                  }
                  break;
                case EventTypes.product_updated:
                  if (content.data?.productId) {
                    await this.socketService.emit(content.event, content.data);
                  }
                  break;
                case EventTypes.new_reviews_generated:
                  if (content.data?.productId) {
                    await this.socketService.emit(content.event, content.data);
                  }
                  break;
                case EventTypes.request_updated:
                  if (content.data?.requestId) {
                    await this.socketService.emit(content.event, content.data);
                    const request = await this.requestService.findById(
                      content.data.requestId,
                    );
                    if (request) {
                      await this.productService.checkPipeline(
                        request.productId.toString(),
                      );
                    }
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
