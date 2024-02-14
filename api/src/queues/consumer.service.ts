import { Injectable, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { LogsService } from 'src/logs/logs.service';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;
  private readonly queueName = process.env.API_QUEUE || 'api_queue';

  constructor(private readonly logsService: LogsService) {
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
            const content = JSON.parse(message.content.toString());
            this.logsService.printLog(
              `Product has no reviews`,
              'info',
              undefined,
              undefined,
              message.content.toString(),
              'queues',
            );
            channel.ack(message);
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
