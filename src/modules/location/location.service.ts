import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';

const PAGE_SIZE = 20;

export interface PaginationInfo {
  count: number;
  pages: number;
  next: string | null;
  prev: string | null;
}

export interface LocationResponse {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents: string[];
  url: string;
  created: string;
}

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly repo: Repository<Location>,
  ) {}

  async findAll(page = 1): Promise<{ info: PaginationInfo; results: LocationResponse[] }> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    const pages = Math.ceil(total / PAGE_SIZE);

    const info: PaginationInfo = {
      count: total,
      pages,
      next: page < pages ? `/api/location?page=${page + 1}` : null,
      prev: page > 1 ? `/api/location?page=${page - 1}` : null,
    };

    const results = items.map((l) => this.toResponse(l));

    return { info, results };
  }

  async findOne(id: number): Promise<LocationResponse> {
    const location = await this.repo.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location #${id} not found`);
    }
    return this.toResponse(location);
  }

  private toResponse(l: Location): LocationResponse {
    return {
      id: l.id,
      name: l.name,
      type: l.type,
      dimension: l.dimension,
      residents: l.residentUrls.map((u) => u.replace(/https?:\/\/[^\/]+/, '')),
      url: l.url,
      created: l.created,
    };
  }
}
