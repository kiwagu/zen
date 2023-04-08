import { Module } from '@nestjs/common';

import { PrismaModule } from '@zen/nest-api/prisma';

import { UserController } from './user.controller';
import { AppCaslFactory } from '../../casl/casl.factory';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [AppCaslFactory],
})
export class UserModule {}
