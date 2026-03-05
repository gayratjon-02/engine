import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { GoogleAdsCampaign } from 'src/libs/entity/google-ads-campaign.entity';
import { GoogleAdsAdGroup } from 'src/libs/entity/google-ads-ad-group.entity';
import { GoogleAdsAd } from 'src/libs/entity/google-ads-ad.entity';
import { GoogleAdsDailyStats } from 'src/libs/entity/google-ads-daily-stats.entity';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';
import { GoogleAdsService } from './google-ads.service';
import { GoogleAdsController } from './google-ads.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			GoogleAdsCampaign,
			GoogleAdsAdGroup,
			GoogleAdsAd,
			GoogleAdsDailyStats,
			PlatformConnection,
			Brand,
		]),
		BrandModule,
		HttpModule,
	],
	controllers: [GoogleAdsController],
	providers: [GoogleAdsService],
	exports: [GoogleAdsService],
})
export class GoogleAdsModule {}
