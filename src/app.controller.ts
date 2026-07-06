import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('api')
  getApiInfo() {
    return {
      characters: {
        url: '/character',
      },
      locations: {
        url: '/location',
      },
      episodes: {
        url: '/episode',
      },
    };
  }
}
