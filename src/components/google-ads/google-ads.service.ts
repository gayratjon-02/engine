import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { GoogleAdsCampaign } from 'src/libs/entity/google-ads-campaign.entity';
import { GoogleAdsAdGroup } from 'src/libs/entity/google-ads-ad-group.entity';
import { GoogleAdsAd } from 'src/libs/entity/google-ads-ad.entity';
import { GoogleAdsDailyStats } from 'src/libs/entity/google-ads-daily-stats.entity';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';

@Injectable()
export class GoogleAdsService {
	constructor(
		@InjectRepository(GoogleAdsCampaign)
		private readonly campaignRepo: Repository<GoogleAdsCampaign>,
		@InjectRepository(GoogleAdsAdGroup)
		private readonly adGroupRepo: Repository<GoogleAdsAdGroup>,
		@InjectRepository(GoogleAdsAd)
		private readonly adRepo: Repository<GoogleAdsAd>,
		@InjectRepository(GoogleAdsDailyStats)
		private readonly dailyStatsRepo: Repository<GoogleAdsDailyStats>,
		@InjectRepository(PlatformConnection)
		private readonly connectionRepo: Repository<PlatformConnection>,
		@InjectRepository(Brand)
		private readonly brandRepo: Repository<Brand>,
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
	) {}
}
