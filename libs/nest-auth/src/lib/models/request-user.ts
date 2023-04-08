import { Prisma } from '@zen/nest-api/prisma';

export class RequestUser<Role = string> {
  id: string; // Change type to number if using integer ids
  roles: Role[];
  rules?: Prisma.JsonValue[];
}
