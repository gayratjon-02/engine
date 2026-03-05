import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCampaignsQueryDto {
	@IsOptional()
	@IsIn(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'])
	status?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsIn(['name', 'status', 'spend', 'createdAt'])
	sortBy?: string;

	@IsOptional()
	@IsIn(['ASC', 'DESC'])
	sortOrder?: string;

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

	@IsOptional()
	@IsString()
	startDate?: string;

	@IsOptional()
	@IsString()
	endDate?: string;

	@IsOptional()
	@IsString()
	includeStats?: string;
}
