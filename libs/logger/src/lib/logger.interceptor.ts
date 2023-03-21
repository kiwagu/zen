import { APP_INTERCEPTOR } from '@nestjs/core';
import { OgmaInterceptor } from '@ogma/nestjs-module';

export const loggerInterceptor = {
  provide: APP_INTERCEPTOR,
  useClass: OgmaInterceptor
};
