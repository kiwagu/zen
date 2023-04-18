import { Test, TestingModule } from '@nestjs/testing';
import MailMessage from 'nodemailer/lib/mailer/mail-message';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { AppController } from './app.controller';
import { ConfigModule } from './config';
import { MailModule } from './mail';

describe('AppController', () => {
  let app: TestingModule;

  function spyOnSmtpSend(onMail: (mail: MailMessage) => void) {
    return jest
      .spyOn(SMTPTransport.prototype, 'send')
      .mockImplementation(function (
        mail: MailMessage,
        callback: (err: Error | null, info: SMTPTransport.SentMessageInfo) => void
      ): void {
        onMail(mail);

        callback(null, {
          envelope: {
            from: mail.data.from as string,
            to: [mail.data.to as string],
          },
          messageId: 'ABCD',
          accepted: [],
          rejected: [],
          pending: [],
          response: 'ok',
        });
      });
  }

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [ConfigModule, MailModule],
      controllers: [AppController],
    }).compile();
  });

  describe('getData', () => {
    it('should send registered email', async () => {
      const send = spyOnSmtpSend(() => null);
      const email = 'some@email.com';
      const appController = app.get<AppController>(AppController);
      const {
        envelope: {
          to: [receiver],
        },
        messageId,
      } = await appController.authRegistered({ email, username: 'some' });

      expect(send).toBeDefined();

      expect(receiver).toBe(email);
      expect(messageId).toBe('ABCD');
    });
  });
});
