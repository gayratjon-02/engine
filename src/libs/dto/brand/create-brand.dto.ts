import { IsNotEmpty, IsOptional, IsString, IsTimeZone, IsUrl, Length, Matches, MaxLength } from 'class-validator';

export class CreateBrandDto {
	@IsString()
	@IsNotEmpty()
	@Length(2, 100)
	name: string;

	@IsUrl()
	@IsOptional()
	logoUrl?: string;

	@Matches(/^[a-zA-Z0-9-]+\.myshopify\.com$/, { message: 'Invalid Shopify domain format' })
	@IsOptional()
	shopifyDomain?: string;

	@IsUrl()
	@IsOptional()
	website?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	industry?: string;

	@IsTimeZone()
	@IsOptional()
	timezone?: string;

	@IsString()
	@IsOptional()
	@MaxLength(3)
	currency?: string;
}
