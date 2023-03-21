import { ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { OgmaInterceptorServiceOptions } from '@ogma/nestjs-module';
import { LogObject } from '@ogma/nestjs-module/src/interceptor/interfaces/log.interface';
import { RabbitMqParser } from '@ogma/platform-rabbitmq';
import * as otelApi from '@opentelemetry/api';

@Injectable()
export class RabbitMqWithBodyParser extends RabbitMqParser {
  getSuccessContext(
    data: unknown,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & { traceId?: string; spanId?: string } {
    const span = otelApi.trace.getActiveSpan();

    return {
      ...super.getSuccessContext(data, context, startTime, options),
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }

  getErrorContext(
    error: Error | HttpException,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & { traceId?: string; spanId?: string } {
    const span = otelApi.trace.getActiveSpan();

    return {
      ...super.getErrorContext(error, context, startTime, options),
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }
}
