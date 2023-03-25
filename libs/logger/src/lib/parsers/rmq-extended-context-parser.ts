import { ExecutionContext, Injectable } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { OgmaInterceptorServiceOptions } from '@ogma/nestjs-module';
import { LogObject } from '@ogma/nestjs-module/src/interceptor/interfaces/log.interface';
import { RabbitMqParser } from '@ogma/platform-rabbitmq';
import * as otelApi from '@opentelemetry/api';
import { RpcError } from '@zen/common';

@Injectable()
export class RabbitMqWithBodyParser extends RabbitMqParser {
  getSuccessContext(
    data: unknown,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & {
    message: Record<string, any>;
    responseType: string;
    response?: unknown;
    traceId?: string;
    spanId?: string;
  } {
    const span = otelApi.trace.getActiveSpan();
    const rmqContext = context.switchToRpc().getContext<RmqContext>();
    const { content } = rmqContext.getMessage();
    const message = JSON.parse(content.toString());
    const successContext = super.getSuccessContext(data, context, startTime, options);

    return {
      ...successContext,
      message,
      responseType: typeof data,
      response: successContext.contentLength < 128 ? data : undefined,
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }

  getErrorContext(
    error: Error | RpcException,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & { message: Record<string, any>; traceId?: string; spanId?: string } {
    const span = otelApi.trace.getActiveSpan();
    const rmqContext = context.switchToRpc().getContext<RmqContext>();
    const { content } = rmqContext.getMessage();
    const message = JSON.parse(content.toString());
    const logObject = super.getErrorContext(error, context, startTime, options);
    const rpcError =
      error instanceof RpcException ? (error.getError() as RpcError) : { status: null };
    const status = rpcError.status;

    return {
      ...logObject,
      status: status ? `${status}` : logObject.status,
      message,
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }
}
