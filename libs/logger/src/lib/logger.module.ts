import { join } from 'path';

import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OgmaInterceptor, OgmaInterceptorOptions, OgmaModule } from '@ogma/nestjs-module';
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
                console.log(JSON.parse(String(msg)), '\n');

                if (writable) {
                  writable.write(Buffer.from(msg as string));
                }
              },
            },
          },
        };
      },
    });
  }
}
