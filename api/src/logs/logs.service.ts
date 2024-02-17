import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as moment from 'moment';
import { LogResponseDto } from './dto/log-response.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class LogsService {
  constructor(private readonly httpService: HttpService) {}
  async find(
    fromDate: string,
    toDate: string,
    type?: string,
    requestId?: string,
    productId?: string,
  ): Promise<LogResponseDto[]> {
    const initDate = moment(fromDate).format('YYYY-MM-DD');
    const endDate = moment(toDate).format('YYYY-MM-DD');
    const logs = await this.getLogsFromScrapper(initDate, endDate);
    const rows = logs.split('\n');
    let currentDate = initDate;
    while (currentDate <= endDate) {
      const date = moment(currentDate).format('YYYY-MM-DD');
      const pattern = `logs/${date}.txt`;
      //check if file exists
      if (fs.existsSync(pattern)) {
        const file = await fs.readFileSync(pattern, 'utf-8');
        if (file.length > 0) {
          const fileRows = file.split('\n');
          fileRows.forEach((row: string) => {
            rows.push(row);
          });
        }
      }
      currentDate = moment(currentDate).add(1, 'days').format('YYYY-MM-DD');
    }

    const json = rows.map((row: any) => {
      const [timestamp, type, message, requestId, productId, data, origin] =
        row.split(';');
      return {
        timestamp,
        type,
        message,
        requestId,
        productId,
        data,
        origin,
      };
    });
    if (type || requestId || productId) {
      return json.filter((log: any) => {
        if (type && log.type !== type) {
          return false;
        }
        if (requestId && log.requestId !== requestId) {
          return false;
        }
        if (productId && log.productId !== productId) {
          return false;
        }
        return true;
      });
    }

    return json;
  }

  async getLogsFromScrapper(fromDate: string, toDate: string) {
    return 'NOT IMPLEMENTED YET!';
  }

  printLog(
    message: string,
    type: string = 'info',
    requestID: string | null = null,
    productID: string | null = null,
    data: string | null = null,
    origin: string | null = null,
  ): void {
    /*
    Log structure
    timestamp - type - message - requestID - productID
    */
    data = data ? data.replaceAll('\n', ',').replaceAll(';', ',') : null;
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const log: string = `${now};${type.toUpperCase()};${message};${requestID};${productID};${data};${origin}\n`;
    const date: string = moment().format('YYYY-MM-DD');
    console.log(log);
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }

    fs.appendFileSync(`logs/${date}.txt`, log);
  }
}
