import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../modules/character/character.entity';
import { Location } from '../modules/location/location.entity';
import { CharacterSeederService } from './character-seeder.service';
import { LocationSeederService } from './location-seeder.service';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    private readonly characterSeeder: CharacterSeederService,
    private readonly locationSeeder: LocationSeederService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const characterCount = await this.characterRepo.count();
    if (characterCount === 0) {
      this.logger.log('Starting seeder...');
      await this.characterSeeder.seed();
    } else {
      this.logger.log(`Skipping character seed: ${characterCount} characters already in DB`);
    }

    const locationCount = await this.locationRepo.count();
    if (locationCount === 0) {
      await this.locationSeeder.seed();
    } else {
      this.logger.log(`Skipping location seed: ${locationCount} locations already in DB`);
    }

    this.logger.log('Seeder finished');
  }
}
