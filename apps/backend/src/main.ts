import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dotenv from "dotenv"
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'path';
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // serve static files
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
