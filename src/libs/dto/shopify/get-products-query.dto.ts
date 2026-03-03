import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PRODUCT_STATUS } from 'src/libs/dto/enum/shopify.enum';

export class GetProductsQueryDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsEnum(PRODUCT_STATUS)
	status?: PRODUCT_STATUS;

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
