import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import amqp, { Channel, ChannelWrapper } from 'amqp-connection-manager';

@Injectable()
export class ProducerService {
  private channelWrapper: ChannelWrapper;
  private readonly amazonQueue = 'amazon_queue';
  constructor() {
    const connection = amqp.connect([
      process.env.RABBITMQ_URI || 'amqp://localhost',
    ]);
    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue(this.amazonQueue, { durable: true });
      },
    });
  }

  async sendToAmazonQueue(data: any) {
    try {
      await this.channelWrapper.sendToQueue(
        this.amazonQueue,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
        },
      );
    } catch (error) {
      throw new HttpException(
        'Error adding message to amazon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
