import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../modules/character/character.entity';
import { Location } from '../modules/location/location.entity';
import { Episode } from '../modules/episode/episode.entity';
import { CharacterSeederService } from './character-seeder.service';
import { LocationSeederService } from './location-seeder.service';
import { EpisodeSeederService } from './episode-seeder.service';

export enum SeederStrategy {
  FULL_SEED = 'full_seed',
  UPSERT = 'upsert',
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
    private readonly characterSeeder: CharacterSeederService,
    private readonly locationSeeder: LocationSeederService,
    private readonly episodeSeeder: EpisodeSeederService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      // Task 5.1: Check row counts in all 3 tables
      const characterCount = await this.characterRepo.count();
      const locationCount = await this.locationRepo.count();
      const episodeCount = await this.episodeRepo.count();

      // Log row counts
      this.logger.log(
        `Character: ${characterCount} rows, Location: ${locationCount} rows, Episode: ${episodeCount} rows`,
      );

      // Determine strategy: if any table is empty -> full seed, else -> upsert
      const strategy =
        characterCount === 0 || locationCount === 0 || episodeCount === 0
          ? SeederStrategy.FULL_SEED
          : SeederStrategy.UPSERT;

      this.logger.log(`Strategy: ${strategy}`);

      // Task 5.3: Call seeders in order: character -> location -> episode
      this.logger.log('Starting character seeder...');
      await this.characterSeeder.seed();
      const finalCharacterCount = await this.characterRepo.count();
      this.logger.log(`Character seeding complete: ${finalCharacterCount} records in database`);

      this.logger.log('Starting location seeder...');
      await this.locationSeeder.seed();
      const finalLocationCount = await this.locationRepo.count();
      this.logger.log(`Location seeding complete: ${finalLocationCount} records in database`);

      this.logger.log('Starting episode seeder...');
      await this.episodeSeeder.seed();
      const finalEpisodeCount = await this.episodeRepo.count();
      this.logger.log(`Episode seeding complete: ${finalEpisodeCount} records in database`);

      this.logger.log('Seeder finished');
    } catch (err: any) {
      this.logger.error(`Seeder failed: ${err.message}`, err.stack);
      throw err;
    }
  }
}
