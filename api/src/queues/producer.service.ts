import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import amqp, { Channel, ChannelWrapper } from 'amqp-connection-manager';
import { QueueMessage } from './queues.entities';
import { LogsService } from 'src/logs/logs.service';

@Injectable()
export class ProducerService {
  private amazonChannel: ChannelWrapper;
  private apiChannel: ChannelWrapper;
  private readonly amazonQueue = process.env.AMAZON_QUEUE || 'amazon_queue';
  private readonly apiQueue = process.env.API_QUEUE || 'api_queue';

  constructor(private logsService: LogsService) {
    const connection = amqp.connect([
      process.env.RABBITMQ_URI || 'amqp://localhost',
    ]);
    this.amazonChannel = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue(this.amazonQueue, { durable: true });
      },
    });

    this.apiChannel = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue(this.apiQueue, { durable: true });
      },
    });
  }

  async sendToAmazonQueue(data: QueueMessage) {
    try {
      await this.amazonChannel.sendToQueue(
        this.amazonQueue,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
        },
      );
      this.logsService.printLog(
        `${data.event} added to ${this.amazonQueue}.`,
        'info',
        undefined,
        undefined,
        JSON.stringify({ data }),
        'queues',
      );
    } catch (error) {
      throw new HttpException(
        'Error adding message to amazon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendToApiQueue(data: QueueMessage) {
    try {
      await this.apiChannel.sendToQueue(
        this.apiQueue,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
        },
      );
      this.logsService.printLog(
        `${data.event} added to ${this.apiQueue}.`,
        'info',
        undefined,
        undefined,
        JSON.stringify({ data }),
        'queues',
      );
    } catch (error) {
      throw new HttpException(
        'Error adding message to API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
