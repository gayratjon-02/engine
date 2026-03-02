import type { DATE_PRESET } from 'src/libs/dto/enum/preference.enum';

export interface PreferenceResponse {
	id: string;
	userId: string;
	brandId: string;
	pinnedMetrics: string[];
	datePreset: DATE_PRESET;
	createdAt: Date;
	updatedAt: Date;
}
