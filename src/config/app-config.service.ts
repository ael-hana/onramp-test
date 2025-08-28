import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get stripePrivateKey(): string {
    const key = this.configService.get<string>('STRIPE_PRIVATE_KEY');
    if (!key) {
      throw new Error('STRIPE_PRIVATE_KEY is required');
    }
    return key;
  }

  get stripePublicKey(): string {
    const key = this.configService.get<string>('STRIPE_PUBLIC_KEY');
    if (!key) {
      throw new Error('STRIPE_PUBLIC_KEY is required');
    }
    return key;
  }

  // Bridge Configuration
  get bridgeApiKey(): string {
    const key = this.configService.get<string>('BRIDGE_API_KEY');
    if (!key) {
      throw new Error('BRIDGE_API_KEY is required');
    }
    return key;
  }

  get bridgeBaseUrl(): string {
    const url = this.configService.get<string>('BRIDGE_BASE_URL');
    if (!url) {
      throw new Error('BRIDGE_BASE_URL is required');
    }
    return url;
  }

  // Wallet Configuration
  get walletAddress(): string {
    const address = this.configService.get<string>('WALLET_ADDRESS');
    if (!address) {
      throw new Error('WALLET_ADDRESS is required');
    }
    return address;
  }
}
