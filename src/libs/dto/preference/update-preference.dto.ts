import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { DATE_PRESET } from 'src/libs/dto/enum/preference.enum';

export class UpdatePreferenceDto {
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	pinnedMetrics?: string[];

	@IsEnum(DATE_PRESET)
	@IsOptional()
	datePreset?: DATE_PRESET;
}
