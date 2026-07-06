import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from './character.entity';
import {
  PaginationService,
  PaginationInfo,
  normalizeUpstreamUrl,
} from '../../common';

export interface CharacterResponse {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: { name: string; url: string };
  location: { name: string; url: string };
  image: string;
  episode: string[];
  url: string;
  created: string;
}

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private readonly repo: Repository<Character>,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    page = 1,
  ): Promise<{ info: PaginationInfo; results: CharacterResponse[] }> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * this.paginationService.PAGE_SIZE,
      take: this.paginationService.PAGE_SIZE,
    });

    const info = this.paginationService.calculatePagination(
      page,
      total,
      '/character',
    );

    const results = items.map((c) => this.toResponse(c));

    return { info, results };
  }

  async findOne(id: number): Promise<CharacterResponse> {
    const character = await this.repo.findOne({ where: { id } });
    if (!character) {
      throw new NotFoundException(`Character #${id} not found`);
    }
    return this.toResponse(character);
  }

  private toResponse(c: Character): CharacterResponse {
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      species: c.species,
      type: c.type,
      gender: c.gender,
      origin: { name: c.originName, url: normalizeUpstreamUrl(c.originUrl) },
      location: {
        name: c.locationName,
        url: normalizeUpstreamUrl(c.locationUrl),
      },
      image: `/character/avatar/${c.id}.jpeg`,
      episode: c.episodeUrls.map((u) => normalizeUpstreamUrl(u)),
      url: normalizeUpstreamUrl(c.url),
      created: c.created,
    };
  }
}
