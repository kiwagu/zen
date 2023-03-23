import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcError } from '@zen/common';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(error: RpcError) {
    if (error.name === 'RpcException') {
      throw new HttpException(error.response, error.status);
    }

    return error;
  }
}
