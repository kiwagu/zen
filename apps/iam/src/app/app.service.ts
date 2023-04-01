import { Injectable } from '@nestjs/common';

import crypto from 'crypto';
import { bcrypt } from 'hash-wasm';

import { CaslFactory, JwtPayload, RequestUser } from '@zen/nest-auth';
import { PrismaClient } from '@zen/nest-api/prisma';

import { AppAbility } from './casl/casl.factory';
import { ConfigService } from './config';
import { JwtService } from './jwt';
import { AuthSession } from './models/auth-session';

@Injectable()
export class AppService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly caslFactory: CaslFactory
  ) {}

  public getUserByUsername(username: string, prisma: PrismaClient) {
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
      jti: crypto.randomUUID(),
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

  getUserByEmail(email: string, prisma: PrismaClient) {
    return prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: email,
        },
      },
    });
  }

  createAbility(user: RequestUser): Promise<AppAbility> {
    return this.caslFactory.createAbility(user);
  }

  hashPassword(password: string) {
    return bcrypt({
      costFactor: this.config.bcryptCost,
      password,
      salt: crypto.getRandomValues(new Uint8Array(16)),
    });
  }
}
