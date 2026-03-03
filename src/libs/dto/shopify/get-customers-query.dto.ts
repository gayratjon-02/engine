import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCustomersQueryDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	minOrders?: number;

	@IsOptional()
	@IsIn(['totalSpent', 'totalOrders', 'firstOrderDate', 'lastOrderDate'])
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
}
