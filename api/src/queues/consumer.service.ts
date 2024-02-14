import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;
  private readonly logger = new Logger(ConsumerService.name);
  private readonly queueName = 'api_queue';
  constructor() {
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
            channel.ack(message);
          }
        });
      });
    } catch (err) {
      this.logger.error('Error starting the consumer:', err);
    }
  }
}
