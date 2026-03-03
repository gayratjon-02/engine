import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCheckoutsQueryDto {
	@IsOptional()
	@IsString()
	startDate?: string; // '2026-03-01'

	@IsOptional()
	@IsString()
	endDate?: string; // '2026-03-03'

	@IsOptional()
	@IsIn(['abandoned', 'complete', 'open'])
	status?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number;
}
