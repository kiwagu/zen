import { ISendMailOptions } from '@nestjs-modules/mailer';

export const MAIL_QUEUE = {
  NAME: 'bull-mail-queue',
  GENERAL: 'bull-general-mail',
  RESET_PASSWORD: 'bull-reset-password-mail',
};

export type MailOptions = ISendMailOptions & { template?: string };
