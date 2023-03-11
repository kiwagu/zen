import { ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OgmaInterceptorServiceOptions } from '@ogma/nestjs-module';
import { LogObject } from '@ogma/nestjs-module/src/interceptor/interfaces/log.interface';
import { GraphQLParser } from '@ogma/platform-graphql';

@Injectable()
export class GqlWithBodyParser extends GraphQLParser {
  getSuccessContext(
    data: unknown,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ) {
    const { req, res, ...rest } = GqlExecutionContext.create(context).getContext();
    const userId = (req.user as { id: string })?.id || null;
    const logObject: LogObject & {
      userId?: string | null;
      body?: Record<string, unknown>;
      traceId?: string;
      spanId?: string;
    } = {
      callerAddress: this.getCallerIp(context),
      method: this.getMethod(context),
      callPoint: this.getCallPoint(context),
      responseTime: Date.now() - startTime,
      contentLength: Buffer.from(JSON.stringify(data)).byteLength,
      protocol: this.getProtocol(context),
      status: this.getStatus(context, options.color && !options.json),
      userId,
      body: req.body,
      traceId: undefined,
      spanId: undefined,
    };

    const otelData = rest && rest[Symbol.for('opentelemetry.graphql_data')];
    if (otelData && otelData.span) {
      const { spanId, traceId } = otelData.span.spanContext();

      logObject.spanId = spanId;
      logObject.traceId = traceId;
    }

    return logObject;
  }

  getErrorContext(
    error: Error | HttpException,
    context: ExecutionContext,
    startTime: number,
    options: OgmaInterceptorServiceOptions
  ): LogObject & { error: (Error | HttpException) } {
    return {
      callerAddress: this.getCallerIp(context),
      method: this.getMethod(context),
      callPoint: this.getCallPoint(context),
      status: this.getStatus(context, options.color && !options.json, error),
      responseTime: Date.now() - startTime,
      contentLength: Buffer.from(JSON.stringify(error.message)).byteLength,
      protocol: this.getProtocol(context),
      error,
    };
  }
}
