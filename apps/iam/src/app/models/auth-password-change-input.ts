import { ApiConstants } from '@zen/common';
import { IsUUID, Length } from 'class-validator';

export class AuthPasswordChangeInput {
  @IsUUID()
  readonly userId: string;

  @Length(1, ApiConstants.PASSWORD_MAX_LENGTH)
  readonly oldPassword: string;

  @Length(ApiConstants.PASSWORD_MIN_LENGTH, ApiConstants.PASSWORD_MAX_LENGTH)
  readonly newPassword: string;
}
