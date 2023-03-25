import { ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OgmaInterceptorServiceOptions } from '@ogma/nestjs-module';
import { LogObject } from '@ogma/nestjs-module/src/interceptor/interfaces/log.interface';
import { GraphQLParser } from '@ogma/platform-graphql';
import * as otelApi from '@opentelemetry/api';
import { RpcError } from '@zen/common';

@Injectable()
export class GqlWithBodyParser extends GraphQLParser {
  getSuccessContext(
    data: unknown,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & {
    body: unknown;
    responseType: string;
    response?: unknown;
    userId: string | null;
    traceId?: string;
    spanId?: string;
  } {
    const span = otelApi.trace.getActiveSpan();
    const { req } = GqlExecutionContext.create(context).getContext();
    const userId = (req.user as { id: string })?.id || null;
    const successContext = super.getSuccessContext(data, context, startTime, options);

    return {
      ...successContext,
      userId,
      body: req.body,
      responseType: typeof data,
      response: successContext.contentLength < 128 ? data : undefined,
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }

  getErrorContext(
    error: Error | HttpException | RpcError,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & { error: Error | HttpException; traceId?: string; spanId?: string } {
    const span = otelApi.trace.getActiveSpan();
    const logObject = super.getErrorContext(error, context, startTime, options);
    const status = (error as RpcError).status;

    return {
      ...logObject,
      status: status ? `${status}` : logObject.status,
      error,
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
    };
  }
}
