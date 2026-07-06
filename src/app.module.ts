import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CharacterModule } from './modules/character/character.module';
import { LocationModule } from './modules/location/location.module';
import { EpisodeModule } from './modules/episode/episode.module';
import { SeederModule } from './seeder/seeder.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', 'data/db.sqlite'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/api/character/avatar',
      rootPath: join(__dirname, '..', 'static', 'avatars'),
    }),
    CharacterModule,
    LocationModule,
    EpisodeModule,
    SeederModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
