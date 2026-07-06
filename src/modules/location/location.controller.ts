import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('api/location')
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Get()
  async findAll(@Query('page') page?: string | number) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (page ?? 1);
    const pageParam = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    return this.service.findAll(pageParam);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
