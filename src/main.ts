import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: Local geliştirme için açık, production'da Nginx de header ekler
  // Belirli origin listesi kullanılır — çift header sorununu önler
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3001',
      'https://haberfoni.com',
      'https://www.haberfoni.com',
      'https://admin.haberfoni.com',
      'https://haberfoni.kaprofis.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();

