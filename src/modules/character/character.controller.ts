import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CharacterService } from './character.service';

@Controller('api/character')
export class CharacterController {
  constructor(private readonly service: CharacterService) {}

  @Get()
  async findAll(@Query('page') page?: number) {
    return this.service.findAll(page ?? 1);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
