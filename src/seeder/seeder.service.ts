import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../modules/character/character.entity';
import { CharacterSeederService } from './character-seeder.service';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    private readonly characterSeeder: CharacterSeederService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.characterRepo.count();
    if (count > 0) {
      this.logger.log(`Skipping seed: ${count} characters already in DB`);
      return;
    }

    this.logger.log('Starting seeder...');
    await this.characterSeeder.seed();
    this.logger.log('Seeder finished');
  }
}
