import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors(); // Disabled: Nginx handles CORS on production. 
  // Enabling this here causes "multiple values" error in some browsers (e.g. Chrome Incognito) 
  // when Nginx also adds the Access-Control-Allow-Origin header.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
