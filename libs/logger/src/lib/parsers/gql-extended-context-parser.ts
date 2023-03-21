import { ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { OgmaInterceptorServiceOptions } from '@ogma/nestjs-module';
import { LogObject } from '@ogma/nestjs-module/src/interceptor/interfaces/log.interface';
import { GraphQLParser } from '@ogma/platform-graphql';
import * as otelApi from '@opentelemetry/api';

@Injectable()
export class GqlWithBodyParser extends GraphQLParser {
  getSuccessContext(
    data: unknown,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & { body: unknown; userId: string | null; traceId?: string; spanId?: string } {
    const span = otelApi.trace.getActiveSpan();
    const { req } = GqlExecutionContext.create(context).getContext();
    const userId = (req.user as { id: string })?.id || null;

    return {
      ...super.getSuccessContext(data, context, startTime, options),
      userId,
      body: req.body,
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }

  getErrorContext(
    error: Error | HttpException,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & { error: Error | HttpException; traceId?: string; spanId?: string } {
    const span = otelApi.trace.getActiveSpan();

    return {
      ...super.getErrorContext(error, context, startTime, options),
      error,
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }
}
