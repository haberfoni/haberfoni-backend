import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.setGlobalPrefix('servis'); // Nginx handles prefixing, so we keep backend root clean

  // CORS: Local geliştirme için açık, production'da Nginx de header ekler
  // Belirli origin listesi kullanılır — çift header sorununu önler
  app.enableCors({
    origin: [
      'https://haberfonik.com',
      'https://www.haberfonik.com',
      'https://admin.haberfonik.com',
      'https://api.haberfonik.com',
      'https://haberfoni.kaprofis.com',
      'http://haberfoni.kaprofis.com',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Accept', 
      'Origin',
      'Access-Control-Allow-Origin'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();

