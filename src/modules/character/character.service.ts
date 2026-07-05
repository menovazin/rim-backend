import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from './character.entity';

const PAGE_SIZE = 20;

export interface PaginationInfo {
  count: number;
  pages: number;
  next: string | null;
  prev: string | null;
}

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
  ) {}

  async findAll(page = 1): Promise<{ info: PaginationInfo; results: CharacterResponse[] }> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    const pages = Math.ceil(total / PAGE_SIZE);

    const info: PaginationInfo = {
      count: total,
      pages,
      next: page < pages ? `/api/character?page=${page + 1}` : null,
      prev: page > 1 ? `/api/character?page=${page - 1}` : null,
    };

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
      origin: { name: c.originName, url: c.originUrl },
      location: { name: c.locationName, url: c.locationUrl },
      image: `/api/character/avatar/${c.id}.jpeg`,
      episode: c.episodeUrls.map((u) => u.replace(/https?:\/\/[^\/]+/, '')),
      url: c.url,
      created: c.created,
    };
  }
}
