import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
	@IsString()
	@IsOptional()
	@MinLength(1)
	@MaxLength(50)
	name?: string;

	@IsUrl()
	@IsOptional()
	avatarUrl?: string;
}
