import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../modules/location/location.entity';
import { fetchWithRetry } from '../common/fetch-with-retry';

const UPSTREAM_API = 'https://rickandmortyapi.com/api/location';

@Injectable()
export class LocationSeederService {
  private readonly logger = new Logger(LocationSeederService.name);

  constructor(
    @InjectRepository(Location)
    private readonly repo: Repository<Location>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting location seed...');

    let page = 1;
    let totalSeeded = 0;

    while (true) {
      const url = `${UPSTREAM_API}?page=${page}`;
      let response: any;

      try {
        response = await fetchWithRetry(url);
      } catch (err: any) {
        this.logger.error(`Failed to fetch page ${page}: ${err.message}`);
        break;
      }

      const body = response.data;
      const locations: any[] = body.results;

      if (!locations || locations.length === 0) break;

      for (const loc of locations) {
        await this.repo.upsert(
          {
            id: loc.id,
            name: loc.name || '',
            type: loc.type || 'unknown',
            dimension: loc.dimension || 'unknown',
            residentUrls: loc.residents || [],
            url: loc.url || '',
            created: loc.created || '',
          },
          ['id'],
        );

        totalSeeded++;
      }

      this.logger.log(`Seeded page ${page} (${locations.length} locations)`);

      if (!body.info?.next) break;
      page++;
    }

    this.logger.log(`Location seed complete: ${totalSeeded} locations processed`);
  }
}
