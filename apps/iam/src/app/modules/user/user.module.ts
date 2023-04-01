import { Module } from '@nestjs/common';

import { PrismaModule } from '@zen/nest-api/prisma';

import { UserController } from './user.controller';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [],
})
export class UserModule {}
