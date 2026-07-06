import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from './episode.entity';
import { PaginationService, PaginationInfo } from '../../common';

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
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    page = 1,
    host: string = 'localhost:3000',
    protocol: string = 'https',
  ): Promise<{ info: PaginationInfo; results: EpisodeResponse[] }> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * this.paginationService.PAGE_SIZE,
      take: this.paginationService.PAGE_SIZE,
    });

    const info = this.paginationService.calculatePagination(
      page,
      total,
      `${host}/api/episode`,
      protocol,
    );

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

