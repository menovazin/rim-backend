import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Character } from '../src/modules/character/character.entity';
import { Location } from '../src/modules/location/location.entity';
import { Episode } from '../src/modules/episode/episode.entity';
import { SeederService } from '../src/seeder/seeder.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let characterRepo: Repository<Character>;
  let locationRepo: Repository<Location>;
  let episodeRepo: Repository<Episode>;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string, defaultValue?: unknown) => {
          if (key === 'DB_PATH') return ':memory:';
          return defaultValue;
        },
      })
      .overrideProvider(SeederService)
      .useValue({ onApplicationBootstrap: () => Promise.resolve() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({ origin: '*' });
    await app.init();

    characterRepo = moduleFixture.get<Repository<Character>>(
      getRepositoryToken(Character),
    );
    locationRepo = moduleFixture.get<Repository<Location>>(
      getRepositoryToken(Location),
    );
    episodeRepo = moduleFixture.get<Repository<Episode>>(
      getRepositoryToken(Episode),
    );

    await seedFixtures();

    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedFixtures() {
    const characters: Character[] = [];
    for (let i = 1; i <= 25; i++) {
      const character = characterRepo.create({
        name: `Character ${i}`,
        status: 'Alive',
        species: 'Human',
        type: '',
        gender: 'Male',
        originName: 'Earth',
        originUrl: 'https://rickandmortyapi.com/api/location/1',
        locationName: 'Earth',
        locationUrl: 'https://rickandmortyapi.com/api/location/1',
        imageFile: '',
        episodeUrls: ['https://rickandmortyapi.com/api/episode/1'],
        url: `https://rickandmortyapi.com/api/character/${i}`,
        created: new Date().toISOString(),
      });
      characters.push(character);
    }
    await characterRepo.save(characters);

    const locations: Location[] = [];
    for (let i = 1; i <= 25; i++) {
      const location = locationRepo.create({
        name: `Location ${i}`,
        type: 'Planet',
        dimension: 'Dimension C-137',
        residentUrls: ['https://rickandmortyapi.com/api/character/1'],
        url: `https://rickandmortyapi.com/api/location/${i}`,
        created: new Date().toISOString(),
      });
      locations.push(location);
    }
    await locationRepo.save(locations);

    const episodes: Episode[] = [];
    for (let i = 1; i <= 25; i++) {
      const episode = episodeRepo.create({
        name: `Episode ${i}`,
        air_date: 'January 1, 2013',
        episode: `S01E${i.toString().padStart(2, '0')}`,
        characterUrls: ['https://rickandmortyapi.com/api/character/1'],
        url: `https://rickandmortyapi.com/api/episode/${i}`,
        created: new Date().toISOString(),
      });
      episodes.push(episode);
    }
    await episodeRepo.save(episodes);
  }

  describe('GET /api', () => {
    it('returns status 200 with discoverable resource links', async () => {
      const response = await request(httpServer)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('characters');
      expect(response.body).toHaveProperty('locations');
      expect(response.body).toHaveProperty('episodes');

      expect(response.body.characters).toHaveProperty('url');
      expect(response.body.locations).toHaveProperty('url');
      expect(response.body.episodes).toHaveProperty('url');

      expect(response.body.characters.url).toMatch(/\/api\/character$/);
      expect(response.body.locations.url).toMatch(/\/api\/location$/);
      expect(response.body.episodes.url).toMatch(/\/api\/episode$/);
    });
  });

  describe('Paginated list endpoints', () => {
    it('returns info and results for character, location, and episode first pages', async () => {
      const endpoints = ['/api/character?page=1', '/api/location?page=1', '/api/episode?page=1'];

      for (const endpoint of endpoints) {
        const response = await request(httpServer)
          .get(endpoint)
          .expect(200);

        expect(response.body).toHaveProperty('info');
        expect(response.body).toHaveProperty('results');
        expect(response.body.info).toHaveProperty('count');
        expect(response.body.info).toHaveProperty('pages');
        expect(response.body.info).toHaveProperty('next');
        expect(response.body.info).toHaveProperty('prev');
      }
    });

    it('first page prev is null and next points to page 2', async () => {
      const endpoints = ['/api/character?page=1', '/api/location?page=1', '/api/episode?page=1'];

      for (const endpoint of endpoints) {
        const response = await request(httpServer)
          .get(endpoint)
          .expect(200);

        expect(response.body.info.prev).toBeNull();
        expect(response.body.info.next).toContain('page=2');
      }
    });

    it('final page next is null and prev points to previous page', async () => {
      const endpoints = [
        { url: '/api/character?page=2', prevPage: 'page=1' },
        { url: '/api/location?page=2', prevPage: 'page=1' },
        { url: '/api/episode?page=2', prevPage: 'page=1' },
      ];

      for (const { url, prevPage } of endpoints) {
        const response = await request(httpServer)
          .get(url)
          .expect(200);

        expect(response.body.info.next).toBeNull();
        expect(response.body.info.prev).toContain(prevPage);
      }
    });
  });

  describe('Detail endpoints', () => {
    it('returns 200 for existing resources', async () => {
      const endpoints = ['/api/character/1', '/api/location/1', '/api/episode/1'];

      for (const endpoint of endpoints) {
        const response = await request(httpServer)
          .get(endpoint)
          .expect(200);

        expect(response.body).toHaveProperty('id', 1);
      }
    });

    it('returns 404 for non-existent resources', async () => {
      const endpoints = ['/api/character/999999', '/api/location/999999', '/api/episode/999999'];

      for (const endpoint of endpoints) {
        await request(httpServer)
          .get(endpoint)
          .expect(404);
      }
    });
  });

  describe('CORS', () => {
    it('includes Access-Control-Allow-Origin: * on GET responses', async () => {
      const response = await request(httpServer)
        .get('/api/character')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('handles OPTIONS preflight requests with CORS headers', async () => {
      const response = await request(httpServer)
        .options('/api/character')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });
});
