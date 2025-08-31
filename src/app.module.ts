import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigService } from './config/app-config.service';
import { StripePaymentService } from './services/stripe-payment.service';
import { BridgeService } from './services/bridge.service';
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
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
  ],
  controllers: [AppController, PaymentController, OnRampController],
  providers: [
    AppService,
    AppConfigService,
    StripePaymentService,
    BridgeService, // Service de conversion crypto
    OnRampService, // Orchestrateur OnRamp
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
