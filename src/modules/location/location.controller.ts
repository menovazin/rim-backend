import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('api/location')
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Get()
  async findAll(@Query('page') page?: number) {
    return this.service.findAll(page ?? 1);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
