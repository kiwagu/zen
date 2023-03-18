import { Controller, Get, Logger } from '@nestjs/common';
import {  MessagePattern } from '@nestjs/microservices';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern({ cmd: 'hi' })
  hi() {
    Logger.log('Hi called');

    return 'Hi';
  }
}
