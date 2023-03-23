import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { CaslFactory, JwtPayload, RequestUser } from '@zen/nest-auth';

import { AppAbility } from './casl/casl.factory';
import { ConfigService } from './config';
import { AuthSession } from './models/auth-session';
import { PrismaClient } from './prisma';
import { JwtService } from './jwt';

@Injectable()
export class AppService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly caslFactory: CaslFactory
  ) {}

  public async getUserByUsername(username: string, prisma: PrismaClient) {
    return prisma.user.findFirst({
      where: {
        username: {
          mode: 'insensitive',
          equals: username,
        },
      },
    });
  }

  async getAuthSession(user: RequestUser, rememberMe = false): Promise<AuthSession> {
    const jwtPayload: JwtPayload = {
      jti: randomUUID(),
      aud: this.config.siteUrl,
      sub: user.id,
      roles: user.roles,
    };

    const expiresIn = rememberMe
      ? this.config.expiresInRememberMe
      : (this.config.jwtOptions.signOptions?.expiresIn as number);


    const token = this.jwtService.sign(jwtPayload, { expiresIn });

    const ability = await this.createAbility(user);

    return {
      userId: user.id,
      roles: user.roles,
      rules: ability.rules,
      token,
      rememberMe,
      expiresIn,
    };
  }

  async createAbility(user: RequestUser): Promise<AppAbility> {
    return this.caslFactory.createAbility(user);
  }
}
