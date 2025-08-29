import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigService } from './config/app-config.service';
import { StripePaymentService } from './services/stripe-payment.service';
import { OnRampService } from './services/onramp.service';
import { PaymentController } from './controllers/payment.controller';
import { OnRampController } from './controllers/onramp.controller';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController, PaymentController, OnRampController],
  providers: [
    AppService,
    AppConfigService,
    StripePaymentService,
    OnRampService, // Orchestrateur OnRamp
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
