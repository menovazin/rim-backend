import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get('api')
  getApiInfo(@Req() req: Request) {
    const protocol = req.protocol || 'https';
    const host = req.get('host') || 'localhost:3000';

    return {
      characters: {
        url: `${protocol}://${host}/api/character`,
      },
      locations: {
        url: `${protocol}://${host}/api/location`,
      },
      episodes: {
        url: `${protocol}://${host}/api/episode`,
      },
    };
  }
}
