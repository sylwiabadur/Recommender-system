import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // @Header('Content-Type', 'text/html')
  getHello(): string {
    return 'Hello App!';
  }
}

//decorators with class and method

//controller handles requests

//filtering requests
