import { RequestStatus, RequestType } from '../entities/request.entity';

export class CreateRequestDto {
  url: string;
  type: RequestType;
  status: RequestStatus;
  productId: string;
}
