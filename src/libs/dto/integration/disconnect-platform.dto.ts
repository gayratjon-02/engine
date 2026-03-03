import { IsEnum, IsNotEmpty } from 'class-validator';
import { PLATFORM } from 'src/libs/dto/enum/platform.enum';

export class DisconnectPlatformDto {
	@IsEnum(PLATFORM)
	@IsNotEmpty()
	platform: PLATFORM;
}
