import { IsIn, IsOptional, IsString } from 'class-validator';

export class DashboardQueryDto {
	@IsOptional()
	@IsString()
	startDate?: string; // '2026-03-01'

	@IsOptional()
	@IsString()
	endDate?: string; // '2026-03-03'

	@IsOptional()
	@IsIn(['7d', '14d', '30d', '90d'])
	datePreset?: string; // startDate/endDate o'rniga
}
