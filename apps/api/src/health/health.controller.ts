import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
