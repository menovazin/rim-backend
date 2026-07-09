import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Устанавливаем Content-Type: application/json для всех ответов
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  app.enableCors({ origin: '*' });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
}
bootstrap();
