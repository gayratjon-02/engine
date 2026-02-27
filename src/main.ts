import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  //Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serialization — @Exclude() larni ishlashi uchun
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global Prefix
  app.setGlobalPrefix('api');

  //start the server
  const port = process.env.PORT || 4001;
  await app.listen(port, () => {
    console.log(`Server is running on Port ${port}`);
  });
}
bootstrap();
