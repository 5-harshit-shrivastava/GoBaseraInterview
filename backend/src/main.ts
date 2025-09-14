import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove properties that are not in the DTO
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    transform: true, // Transform payload to DTO instance
    disableErrorMessages: false, // Keep error messages for debugging
  }));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS for both development and production
  app.enableCors({
    origin: [
      'http://localhost:5173', // Development
      'http://localhost:5174', // Development (alternate port)
      'https://your-frontend-app.vercel.app', // Production frontend - Update after frontend deployment
      /\.vercel\.app$/, // Allow all Vercel subdomains
      /\.render\.com$/ // Allow all Render subdomains
    ],
    credentials: true
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Render
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
