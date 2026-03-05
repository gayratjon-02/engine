import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetStatsQueryDto {
	@IsOptional()
	@IsString()
	startDate?: string;

	@IsOptional()
	@IsString()
	endDate?: string;

	@IsOptional()
	@IsIn(['day', 'campaign', 'adset', 'ad'])
	groupBy?: string;

	@IsOptional()
	@IsString()
	campaignId?: string;

	@IsOptional()
	@IsString()
	adSetId?: string;
}
