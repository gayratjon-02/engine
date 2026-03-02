import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateBrandDto {
	@IsString()
	@IsNotEmpty()
	@Length(2, 100)
	name: string;

	@IsString()
	@IsOptional()
	logoUrl?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	shopifyDomain?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	timezone?: string;

	@IsString()
	@IsOptional()
	@MaxLength(3)
	currency?: string;
}
