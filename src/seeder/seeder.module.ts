import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../modules/character/character.entity';
import { Location } from '../modules/location/location.entity';
import { Episode } from '../modules/episode/episode.entity';
import { SeederService } from './seeder.service';
import { CharacterSeederService } from './character-seeder.service';
import { LocationSeederService } from './location-seeder.service';
import { EpisodeSeederService } from './episode-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Location, Episode])],
  providers: [
    SeederService,
    CharacterSeederService,
    LocationSeederService,
    EpisodeSeederService,
  ],
  exports: [SeederService],
})
export class SeederModule {}
