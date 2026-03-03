import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PLATFORM } from 'src/libs/dto/enum/platform.enum';

export class ConnectPlatformDto {
	@IsEnum(PLATFORM)
	@IsNotEmpty()
	platform: PLATFORM;

	@IsString()
	@IsNotEmpty()
	accessToken: string;

	@IsString()
	@IsOptional()
	refreshToken?: string;

	@IsString()
	@IsOptional()
	shopDomain?: string; // Shopify: mystore.myshopify.com

	@IsString()
	@IsOptional()
	adAccountId?: string; // Meta/Google/TikTok

	@IsString()
	@IsOptional()
	externalAccountName?: string; // Tashqi account nomi
}
