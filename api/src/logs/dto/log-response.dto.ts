export class LogResponseDto {
  timestamp: Date;
  message: string;
  type: string;
  requestId: string;
  productId: string;
  data: any;
  origin: string;
}
