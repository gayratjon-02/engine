import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCreativesQueryDto {
	@IsOptional()
	@IsString()
	campaignId?: string;

	@IsOptional()
	@IsString()
	adSetId?: string;

	@IsOptional()
	@IsIn(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'DISAPPROVED', 'PENDING_REVIEW', 'WITH_ISSUES'])
	status?: string;

	@IsOptional()
	@IsIn(['image', 'video', 'carousel'])
	format?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsIn(['true', 'false'])
	hasAiScore?: string;

	@IsOptional()
	@IsIn(['name', 'status', 'format', 'spend', 'roas', 'aiScore', 'createdAt'])
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
