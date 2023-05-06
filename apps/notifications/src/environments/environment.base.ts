import { MailerOptions } from '@nestjs-modules/mailer';

import { JwtModuleOptions } from '@nestjs/jwt';
import { OTLPExporterNodeConfigBase } from '@opentelemetry/otlp-exporter-base';
import { RedisOptions } from '@nestjs/microservices';

export const serviceName = 'notifications';

export abstract class EnvironmentBase {
  readonly production: boolean;
  readonly serviceName: string;
  readonly redis: RedisOptions['options'];
  readonly broker: {
    url: string;
  }
  readonly siteUrl: string;
  readonly jwtOptions: JwtModuleOptions;
  readonly mail: Omit<MailerOptions, 'template'>;
  readonly openTelemetry?:
    | false
    | {
        serviceName: string;
        exporters: {
          enableConsole?: boolean;
          enableOtlp?: boolean;
        };
        collectorOptions?: OTLPExporterNodeConfigBase;
      };
}
