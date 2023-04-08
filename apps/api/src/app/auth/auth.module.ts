import { Module, Provider } from '@nestjs/common';

import { PrismaModule } from '@zen/nest-api/prisma';

import { environment } from '../../environments/environment';
import { defaultFieldsProvider } from '../graphql/default-fields';
import { JwtModule } from '../jwt';
import { AuthController } from './auth.controller';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';

const oauthProviders: Provider[] = [];
if (environment.oauth?.google?.clientID) oauthProviders.push(GoogleOAuthStrategy);

@Module({
  imports: [JwtModule, PrismaModule],
  providers: [defaultFieldsProvider, ...oauthProviders],
  exports: [JwtModule, defaultFieldsProvider],
  controllers: [AuthController],
})
export class ZenAuthModule {}
