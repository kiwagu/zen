import * as rfs from 'rotating-file-stream';
import { MailerOptions } from '@nestjs-modules/mailer';
import { NestApplicationOptions } from '@nestjs/common';
import { JwtModuleOptions } from '@nestjs/jwt';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { OTLPExporterNodeConfigBase } from '@opentelemetry/otlp-exporter-base';
import { UploadOptions } from 'graphql-upload/graphqlUploadExpress.js';
import { StrategyOptions as GoogleStrategyOptions } from 'passport-google-oauth20';

export const serviceName = 'iam';

export abstract class EnvironmentBase {
  readonly serviceName: string;
  readonly broker: {
    url: string;
  }
  readonly siteUrl: string;
  readonly production: boolean;
  readonly expressPort: string | number;
  readonly cors?: NestApplicationOptions['cors'];
  readonly graphql: {
    readonly subscriptions?: boolean;
    readonly sandbox?: boolean;
    readonly introspection?: boolean;
    readonly csrfPrevention?: boolean;
    readonly uploads?: UploadOptions;
  };
  readonly publicRegistration: boolean;
  readonly jwtOptions: JwtModuleOptions;
  readonly expiresInRememberMe: number;
  readonly mail: Omit<MailerOptions, 'template'>;
  readonly throttle: ThrottlerModuleOptions;
  readonly bcryptCost: number;
  readonly oauth?: {
    loginConfirmedURL: string;
    google?: GoogleStrategyOptions;
  };
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
  readonly ogma?: {
    readonly logFilePath: string;
    readonly options?: rfs.Options;
  };
}
