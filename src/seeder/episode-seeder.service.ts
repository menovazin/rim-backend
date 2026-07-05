import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../modules/episode/episode.entity';
import { fetchWithRetry } from '../common/fetch-with-retry';

const UPSTREAM_API = 'https://rickandmortyapi.com/api/episode';

@Injectable()
export class EpisodeSeederService {
  private readonly logger = new Logger(EpisodeSeederService.name);

  constructor(
    @InjectRepository(Episode)
    private readonly repo: Repository<Episode>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting episode seed...');

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
      const episodes: any[] = body.results;

      if (!episodes || episodes.length === 0) break;

      for (const ep of episodes) {
        await this.repo.upsert(
          {
            id: ep.id,
            name: ep.name || '',
            air_date: ep.air_date || '',
            episode: ep.episode || '',
            characterUrls: ep.characters || [],
            url: ep.url || '',
            created: ep.created || '',
          },
          ['id'],
        );

        totalSeeded++;
      }

      this.logger.log(`Seeded page ${page} (${episodes.length} episodes)`);

      if (!body.info?.next) break;
      page++;
    }

    this.logger.log(`Episode seed complete: ${totalSeeded} episodes processed`);
  }
}
