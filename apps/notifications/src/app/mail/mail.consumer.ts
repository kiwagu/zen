import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

import { OnQueueActive, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { MAIL_QUEUE, MailOptions } from './mail.constant';

@Processor(MAIL_QUEUE.NAME)
export class MailConsumer {
  private logger = new Logger(MailConsumer.name);

  constructor(private mailer: MailerService) {}

  //--------------------------------------------------------------------------
  send(options: MailOptions) {
    Logger.log(`Sent ${options.template} email to ${options.to}`);

    try {
      return this.mailer.sendMail(options);
    } catch (e) {
      return Logger.error(e, options);
    }
  }

  @OnQueueFailed()
  onQueueFailed(job: Job, error: Error) {
    this.logger.error({ error, job }, 'jobs fired a exception');
  }

  @OnQueueActive()
  onQueueActive(job: Job) {
    this.logger.debug({ job }, 'active jobs');
  }

  @Process(MAIL_QUEUE.GENERAL)
  welcomeEmail(job: Job<MailOptions>) {
    return this.send(job.data);
  }

  @Process(MAIL_QUEUE.RESET_PASSWORD)
  resetPasswordEmail(job: Job<MailOptions>) {
    return this.send(job.data);
  }
}
