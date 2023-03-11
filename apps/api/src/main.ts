import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app/app.module';
import { PrismaService } from './app/prisma';
import { environment } from './environments/environment';
import { OgmaService } from '@ogma/nestjs-module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: environment.cors, bufferLogs: true });

  const ogma = app.get(OgmaService, { strict: false });
  app.useLogger(ogma);

  const prisma: PrismaService = app.get(PrismaService);
  prisma.enableShutdownHooks(app);

  if (environment.production) app.use(helmet());

  const port = process.env.PORT || environment.expressPort;

  await app.listen(port, () => {
    Logger.log(`GraphQL server running at http://localhost:${port}/graphql`);
  });
}

bootstrap();
