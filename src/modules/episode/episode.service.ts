import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from './episode.entity';

const PAGE_SIZE = 20;

export interface PaginationInfo {
  count: number;
  pages: number;
  next: string | null;
  prev: string | null;
}

export interface EpisodeResponse {
  id: number;
  name: string;
  air_date: string;
  episode: string;
  characters: string[];
  url: string;
  created: string;
}

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode)
    private readonly repo: Repository<Episode>,
  ) {}

  async findAll(page = 1): Promise<{ info: PaginationInfo; results: EpisodeResponse[] }> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    const pages = Math.ceil(total / PAGE_SIZE);

    const info: PaginationInfo = {
      count: total,
      pages,
      next: page < pages ? `/api/episode?page=${page + 1}` : null,
      prev: page > 1 ? `/api/episode?page=${page - 1}` : null,
    };

    const results = items.map((e) => this.toResponse(e));

    return { info, results };
  }

  async findOne(id: number): Promise<EpisodeResponse> {
    const episode = await this.repo.findOne({ where: { id } });
    if (!episode) {
      throw new NotFoundException(`Episode #${id} not found`);
    }
    return this.toResponse(episode);
  }

  private toResponse(e: Episode): EpisodeResponse {
    return {
      id: e.id,
      name: e.name,
      air_date: e.air_date,
      episode: e.episode,
      characters: e.characterUrls.map((u) => u.replace(/https?:\/\/[^\/]+/, '')),
      url: e.url,
      created: e.created,
    };
  }
}
