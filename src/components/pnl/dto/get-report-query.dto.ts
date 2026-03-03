import { IsOptional, IsString } from 'class-validator';

export class GetReportQueryDto {
	@IsOptional()
	@IsString()
	startDate?: string; // '2026-03-01'

	@IsOptional()
	@IsString()
	endDate?: string; // '2026-03-03'
}
