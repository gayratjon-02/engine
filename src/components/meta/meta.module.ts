import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MetaCampaign } from 'src/libs/entity/meta-campaign.entity';
import { MetaAdSet } from 'src/libs/entity/meta-adset.entity';
import { MetaAdCreative } from 'src/libs/entity/meta-ad-creative.entity';
import { MetaAdDailyStats } from 'src/libs/entity/meta-ad-daily-stats.entity';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';
import { MetaService } from './meta.service';
import { MetaController } from './meta.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			MetaCampaign,
			MetaAdSet,
			MetaAdCreative,
			MetaAdDailyStats,
			PlatformConnection,
			Brand,
		]),
		BrandModule,
		HttpModule,
	],
	controllers: [MetaController],
	providers: [MetaService],
	exports: [MetaService],
})
export class MetaModule {}
