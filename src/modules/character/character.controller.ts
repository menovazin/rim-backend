import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CharacterService } from './character.service';

@Controller('api/character')
export class CharacterController {
  constructor(private readonly service: CharacterService) {}

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
