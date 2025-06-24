import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'pv3-backend',
      version: process.env.npm_package_version || '1.0.0'
    };
  }
}