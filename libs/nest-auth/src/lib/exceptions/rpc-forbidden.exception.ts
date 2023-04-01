import { RpcException } from '@nestjs/microservices';
import { ApiError } from '@zen/common';

export class RpcForbiddenException extends RpcException {
  constructor() {
    super({
      response: ApiError.AuthCommon.FORBIDDEN,
      status: 403,
      message: 'Forbidden',
      name: RpcException.name
    });
  }
};
