import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AbstractLoader, ExpressLoader } from '@nestjs/serve-static';
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
      // TestingModule resolves AbstractLoader before HttpAdapter exists → NoopLoader;
      // force Express so ServeStaticModule actually mounts avatars in e2e.
      .overrideProvider(AbstractLoader)
      .useClass(ExpressLoader)
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
    it('returns status 200 with discoverable relative resource links', async () => {
      const response = await request(httpServer).get('/api').expect(200);

      expect(response.body).toHaveProperty('characters');
      expect(response.body).toHaveProperty('locations');
      expect(response.body).toHaveProperty('episodes');

      expect(response.body.characters).toHaveProperty('url');
      expect(response.body.locations).toHaveProperty('url');
      expect(response.body.episodes).toHaveProperty('url');

      expect(response.body.characters.url).toBe('/character');
      expect(response.body.locations.url).toBe('/location');
      expect(response.body.episodes.url).toBe('/episode');

      for (const key of ['characters', 'locations', 'episodes']) {
        expect(response.body[key].url).not.toContain('http');
        expect(response.body[key].url).not.toContain('://');
      }
    });
  });

  describe('Paginated list endpoints', () => {
    it('returns info and results for character, location, and episode first pages', async () => {
      const endpoints = [
        '/api/character?page=1',
        '/api/location?page=1',
        '/api/episode?page=1',
      ];

      for (const endpoint of endpoints) {
        const response = await request(httpServer).get(endpoint).expect(200);

        expect(response.body).toHaveProperty('info');
        expect(response.body).toHaveProperty('results');
        expect(response.body.info).toHaveProperty('count');
        expect(response.body.info).toHaveProperty('pages');
        expect(response.body.info).toHaveProperty('next');
        expect(response.body.info).toHaveProperty('prev');
      }
    });

    it('first page prev is null and next is a relative path to page 2', async () => {
      const endpoints = [
        '/api/character?page=1',
        '/api/location?page=1',
        '/api/episode?page=1',
      ];

      for (const endpoint of endpoints) {
        const response = await request(httpServer).get(endpoint).expect(200);

        expect(response.body.info.prev).toBeNull();
        expect(response.body.info.next).toContain('page=2');
        expect(response.body.info.next).toMatch(/^\/[^?]+\?page=2$/);
        expect(response.body.info.next).not.toContain('http');
        expect(response.body.info.next).not.toContain('://');
      }
    });

    it('final page next is null and prev is a relative path to the previous page', async () => {
      const endpoints = [
        { url: '/api/character?page=2', prevPage: 'page=1' },
        { url: '/api/location?page=2', prevPage: 'page=1' },
        { url: '/api/episode?page=2', prevPage: 'page=1' },
      ];

      for (const { url, prevPage } of endpoints) {
        const response = await request(httpServer).get(url).expect(200);

        expect(response.body.info.next).toBeNull();
        expect(response.body.info.prev).toContain(prevPage);
        expect(response.body.info.prev).toMatch(/^\/[^?]+\?page=1$/);
        expect(response.body.info.prev).not.toContain('http');
        expect(response.body.info.prev).not.toContain('://');
      }
    });
  });

  describe('Detail endpoints', () => {
    it('returns 200 for existing resources', async () => {
      const endpoints = [
        '/api/character/1',
        '/api/location/1',
        '/api/episode/1',
      ];

      for (const endpoint of endpoints) {
        const response = await request(httpServer).get(endpoint).expect(200);

        expect(response.body).toHaveProperty('id', 1);
      }
    });

    it('returns 404 for non-existent resources', async () => {
      const endpoints = [
        '/api/character/999999',
        '/api/location/999999',
        '/api/episode/999999',
      ];

      for (const endpoint of endpoints) {
        await request(httpServer).get(endpoint).expect(404);
      }
    });
  });

  describe('GET /api/character/avatar/:filename', () => {
    it('serves avatar JPEG with image/jpeg Content-Type', async () => {
      const response = await request(httpServer)
        .get('/api/character/avatar/1.jpeg')
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/^image\/jpeg/);
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body[0]).toBe(0xff);
      expect(response.body[1]).toBe(0xd8);
    });
  });

  describe('URL normalization', () => {
    it('strips upstream domain and /api from character detail URLs', async () => {
      const response = await request(httpServer)
        .get('/api/character/1')
        .expect(200);

      expect(response.body.url).toBe('/character/1');
      expect(response.body.origin.url).toBe('/location/1');
      expect(response.body.location.url).toBe('/location/1');
      expect(response.body.image).toBe('/character/avatar/1.jpeg');
      expect(response.body.episode).toEqual(['/episode/1']);

      const allUrls = [
        response.body.url,
        response.body.origin.url,
        response.body.location.url,
        ...response.body.episode,
      ];
      for (const url of allUrls) {
        expect(url).not.toContain('rickandmortyapi.com');
      }
    });

    it('strips upstream domain and /api from character list URLs', async () => {
      const response = await request(httpServer)
        .get('/api/character?page=1')
        .expect(200);

      for (const result of response.body.results) {
        expect(result.url).toMatch(/^\/character\/\d+$/);
        expect(result.origin.url).toMatch(/^\/location\/\d+$/);
        expect(result.location.url).toMatch(/^\/location\/\d+$/);
        for (const episodeUrl of result.episode) {
          expect(episodeUrl).toMatch(/^\/episode\/\d+$/);
        }
        expect(result.url).not.toContain('rickandmortyapi.com');
        expect(result.url).not.toContain('/api/character/');
      }
    });

    it('strips upstream domain and /api from location detail URLs', async () => {
      const response = await request(httpServer)
        .get('/api/location/1')
        .expect(200);

      expect(response.body.url).toBe('/location/1');
      expect(response.body.residents).toEqual(['/character/1']);

      const allUrls = [response.body.url, ...response.body.residents];
      for (const url of allUrls) {
        expect(url).not.toContain('rickandmortyapi.com');
      }
    });

    it('strips upstream domain and /api from location list URLs', async () => {
      const response = await request(httpServer)
        .get('/api/location?page=1')
        .expect(200);

      for (const result of response.body.results) {
        expect(result.url).toMatch(/^\/location\/\d+$/);
        for (const residentUrl of result.residents) {
          expect(residentUrl).toMatch(/^\/character\/\d+$/);
        }
        expect(result.url).not.toContain('rickandmortyapi.com');
        expect(result.url).not.toContain('/api/location/');
      }
    });

    it('strips upstream domain and /api from episode detail URLs', async () => {
      const response = await request(httpServer)
        .get('/api/episode/1')
        .expect(200);

      expect(response.body.url).toBe('/episode/1');
      expect(response.body.characters).toEqual(['/character/1']);

      const allUrls = [response.body.url, ...response.body.characters];
      for (const url of allUrls) {
        expect(url).not.toContain('rickandmortyapi.com');
      }
    });

    it('strips upstream domain and /api from episode list URLs', async () => {
      const response = await request(httpServer)
        .get('/api/episode?page=1')
        .expect(200);

      for (const result of response.body.results) {
        expect(result.url).toMatch(/^\/episode\/\d+$/);
        for (const characterUrl of result.characters) {
          expect(characterUrl).toMatch(/^\/character\/\d+$/);
        }
        expect(result.url).not.toContain('rickandmortyapi.com');
        expect(result.url).not.toContain('/api/episode/');
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
