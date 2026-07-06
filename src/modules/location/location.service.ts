import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { PaginationService, PaginationInfo } from '../../common';

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
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    page = 1,
    host: string = 'localhost:3000',
    protocol: string = 'https',
  ): Promise<{ info: PaginationInfo; results: LocationResponse[] }> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * this.paginationService.PAGE_SIZE,
      take: this.paginationService.PAGE_SIZE,
    });

    const info = this.paginationService.calculatePagination(
      page,
      total,
      `${host}/api/location`,
      protocol,
    );

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

