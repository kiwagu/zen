import { Module } from '@nestjs/common';
import { NestAuthModule } from '@zen/nest-auth';

import { environment } from '../../environments/environment';
import { JwtModule } from '../jwt';
import { PrismaModule } from '../prisma';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

const oauthProviders = [];
if (environment.oauth?.google?.clientID) oauthProviders.push(GoogleOAuthStrategy);

@Module({
  imports: [JwtModule, PrismaModule, NestAuthModule.register(CaslAbilityFactory)],
  providers: [JwtStrategy, AuthService, ...oauthProviders],
  exports: [JwtModule, AuthService],
  controllers: [AuthController],
})
export class ZenAuthModule {}
