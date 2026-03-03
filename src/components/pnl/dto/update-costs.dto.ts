import { IsArray, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductCostItemDto {
	@IsNumber()
	@IsNotEmpty()
	shopifyProductId: number;

	@IsNumber()
	@Min(0)
	@IsNotEmpty()
	cogs: number;

	@IsNumber()
	@Min(0)
	@IsOptional()
	shippingCost?: number;
}

export class UpdateCostsDto {
	@IsArray()
	@IsNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => ProductCostItemDto)
	costs: ProductCostItemDto[];
}
