import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../modules/character/character.entity';
import { Location } from '../modules/location/location.entity';
import { Episode } from '../modules/episode/episode.entity';
import { CharacterSeederService } from './character-seeder.service';
import { LocationSeederService } from './location-seeder.service';
import { EpisodeSeederService } from './episode-seeder.service';
import { SeedVersion } from './seed-version.entity';
import { SEED_VERSION } from './seed-version';

export enum SeederStrategy {
  FULL_SEED = 'full_seed',
  UPSERT = 'upsert',
  SKIP = 'skip',
}

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(SeedVersion)
    private readonly seedVersionRepo: Repository<SeedVersion>,
    private readonly characterSeeder: CharacterSeederService,
    private readonly locationSeeder: LocationSeederService,
    private readonly episodeSeeder: EpisodeSeederService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const characterCount = await this.characterRepo.count();
      const locationCount = await this.locationRepo.count();
      const episodeCount = await this.episodeRepo.count();

      this.logger.log(
        `Character: ${characterCount} rows, Location: ${locationCount} rows, Episode: ${episodeCount} rows`,
      );

      const seedVersion = await this.seedVersionRepo.findOne({
        where: {},
        order: { id: 'ASC' },
      });
      const persistedVersion = seedVersion?.version ?? null;
      this.logger.log(
        `Seed version: ${persistedVersion ?? 'none'}`,
      );

      const allTablesPopulated =
        characterCount > 0 && locationCount > 0 && episodeCount > 0;
      const shouldSkip =
        persistedVersion === SEED_VERSION && allTablesPopulated;

      const strategy = shouldSkip ? SeederStrategy.SKIP : SeederStrategy.FULL_SEED;
      this.logger.log(`Strategy: ${strategy}`);

      if (shouldSkip) {
        this.logger.log(
          `Seeding skipped: data already present at version ${SEED_VERSION}`,
        );
        return;
      }

      this.logger.log('Starting character seeder...');
      await this.characterSeeder.seed();
      const finalCharacterCount = await this.characterRepo.count();
      this.logger.log(
        `Character seeding complete: ${finalCharacterCount} records in database`,
      );

      this.logger.log('Starting location seeder...');
      await this.locationSeeder.seed();
      const finalLocationCount = await this.locationRepo.count();
      this.logger.log(
        `Location seeding complete: ${finalLocationCount} records in database`,
      );

      this.logger.log('Starting episode seeder...');
      await this.episodeSeeder.seed();
      const finalEpisodeCount = await this.episodeRepo.count();
      this.logger.log(
        `Episode seeding complete: ${finalEpisodeCount} records in database`,
      );

      await this.saveSeedVersion(SEED_VERSION);

      this.logger.log('Seeder finished');
    } catch (err: any) {
      this.logger.error(`Seeder failed: ${err.message}`, err.stack);
      throw err;
    }
  }

  private async saveSeedVersion(version: string): Promise<void> {
    const existing = await this.seedVersionRepo.findOne({
      where: {},
      order: { id: 'ASC' },
    });

    if (existing) {
      existing.version = version;
      await this.seedVersionRepo.save(existing);
    } else {
      await this.seedVersionRepo.save({ version });
    }
  }
}
