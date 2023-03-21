import { join } from 'path';

import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OgmaInterceptor, OgmaInterceptorOptions, OgmaModule } from '@ogma/nestjs-module';
import * as otelApi from '@opentelemetry/api';
import * as rfs from 'rotating-file-stream';

import { environment } from '../environments/environment';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: OgmaInterceptor,
    },
  ],
  exports: [],
})
export class LoggerModule {
  static forRoot({
    serviceName,
    interceptor,
  }: {
    serviceName: string;
    interceptor?: OgmaInterceptorOptions;
  }): DynamicModule {
    return OgmaModule.forRootAsync({
      useFactory() {
        const writable =
          environment.ogma &&
          rfs.createStream(
            join(process.cwd(), `data/logs/${serviceName}.log`),
            environment.ogma.options
          );

        return {
          interceptor: interceptor || false,
          service: {
            application: serviceName,
            json: true,
            stream: {
              write(msg) {
                const parsedLog = JSON.parse(String(msg));

                // A little cleaninig
                delete parsedLog.ool
                if (parsedLog.correlationId === '') {
                  delete parsedLog.correlationId
                }

                let traceId = null;

                if (!parsedLog.traceId) {
                  const span = otelApi.trace.getActiveSpan();
                  traceId = span?.spanContext().traceId;

                  if (traceId) {
                    parsedLog.traceId = traceId;
                  }
                }

                // It's pretty enough for showing a colored log
                console.log(parsedLog, '\n');

                if (writable) {
                  writable.write(
                    Buffer.from(traceId ? JSON.stringify(parsedLog) + '\n' : (msg as string))
                  );
                }
              },
            },
          },
        };
      },
    });
  }
}
