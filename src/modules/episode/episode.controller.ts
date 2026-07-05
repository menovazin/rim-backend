import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EpisodeService } from './episode.service';

@Controller('api/episode')
export class EpisodeController {
  constructor(private readonly service: EpisodeService) {}

  @Get()
  async findAll(@Query('page') page?: number) {
    return this.service.findAll(page ?? 1);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
