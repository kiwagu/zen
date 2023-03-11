import * as rfs from "rotating-file-stream";
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { OgmaInterceptor, OgmaModule } from '@ogma/nestjs-module';
import { ExpressParser } from '@ogma/platform-express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

import { environment } from '../environments/environment';
import { ConfigModule, ConfigService } from './config';
import { ToolsController } from './controllers';
import { ZenGraphQLModule } from './graphql';
import { GqlWithBodyParser } from './graphql/gql-extended-context-parser';
import { JwtModule } from './jwt';
import { MailModule } from './mail';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    OgmaModule.forRootAsync({
      useFactory() {
        const writable =
          environment.ogma &&
          rfs.createStream(environment.ogma.logFilePath, environment.ogma.options);

        return {
          interceptor: {
            http: ExpressParser,
            gql: GqlWithBodyParser,
          },
          service: {
            application: environment.serviceName,
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
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.throttle,
    }),
    ConfigModule,
    ZenGraphQLModule,
    JwtModule,
    MailModule,
    PrismaModule,
  ],
  controllers: [ToolsController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: OgmaInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(graphqlUploadExpress(environment.graphql.uploads)).forRoutes('graphql');
  }
}
