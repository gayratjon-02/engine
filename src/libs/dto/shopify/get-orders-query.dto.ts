import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetOrdersQueryDto {
	@IsOptional()
	@IsString()
	startDate?: string; // '2026-03-01'

	@IsOptional()
	@IsString()
	endDate?: string; // '2026-03-03'

	@IsOptional()
	@IsString()
	financialStatus?: string;

	@IsOptional()
	@IsBooleanString()
	isNewCustomer?: string; // 'true' or 'false'

	@IsOptional()
	@IsString()
	search?: string;

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
	@IsIn(['orderDate', 'totalPrice', 'orderNumber'])
	sortBy?: string;

	@IsOptional()
	@IsIn(['ASC', 'DESC'])
	sortOrder?: string;
}
