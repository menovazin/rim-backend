import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../modules/character/character.entity';
import { fetchWithRetry } from '../common/fetch-with-retry';
import * as fs from 'fs';
import * as path from 'fs/promises';

const UPSTREAM_API = 'https://rickandmortyapi.com/api/character';
const AVATAR_DIR = 'static/avatars';

@Injectable()
export class CharacterSeederService {
  private readonly logger = new Logger(CharacterSeederService.name);

  constructor(
    @InjectRepository(Character)
    private readonly repo: Repository<Character>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting character seed...');

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
      const characters: any[] = body.results;

      if (!characters || characters.length === 0) break;

      for (const c of characters) {
        await this.repo.upsert(
          {
            id: c.id,
            name: c.name,
            status: c.status || 'unknown',
            species: c.species || 'unknown',
            type: c.type || '',
            gender: c.gender || 'unknown',
            originName: c.origin?.name || '',
            originUrl: c.origin?.url || '',
            locationName: c.location?.name || '',
            locationUrl: c.location?.url || '',
            imageFile: `${c.id}.jpeg`,
            episodeUrls: c.episode || [],
            url: c.url || '',
            created: c.created || '',
          },
          ['id'],
        );

        await this.downloadAvatar(c.id, c.image);
        totalSeeded++;
      }

      this.logger.log(`Seeded page ${page} (${characters.length} characters)`);

      if (!body.info?.next) break;
      page++;
    }

    this.logger.log(
      `Character seed complete: ${totalSeeded} characters processed`,
    );
  }

  private async downloadAvatar(id: number, imageUrl: string): Promise<void> {
    const filePath = `${AVATAR_DIR}/${id}.jpeg`;

    if (fs.existsSync(filePath)) return;

    try {
      const response = await fetchWithRetry(
        imageUrl,
        { responseType: 'arraybuffer' },
        2,
        500,
        2000,
      );
      const buffer = Buffer.from(response.data);

      await path.mkdir(AVATAR_DIR, { recursive: true });
      await path.writeFile(filePath, buffer);

      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      this.logger.warn(
        `Failed to download avatar for character ${id}: ${err.message}`,
      );
    }
  }
}
