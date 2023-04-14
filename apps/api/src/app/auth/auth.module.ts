import { Module, Provider } from '@nestjs/common';

import { environment } from '../../environments/environment';
import { AuthController } from './auth.controller';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';

const oauthProviders: Provider[] = [];
if (environment.oauth?.google?.clientID) oauthProviders.push(GoogleOAuthStrategy);

@Module({
  providers: [...oauthProviders],
  controllers: [AuthController],
})
export class ZenAuthModule {}
