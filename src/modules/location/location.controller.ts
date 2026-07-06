import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { LocationService } from './location.service';

@Controller('api/location')
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Get()
  async findAll(@Query('page') page?: string | number, @Req() req?: Request) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (page ?? 1);
    const pageParam = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const protocol = req?.protocol || 'https';
    const host = req?.get('host') || 'localhost:3000';
    return this.service.findAll(pageParam, host, protocol);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
