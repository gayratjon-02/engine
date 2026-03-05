import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';
import type { CampaignStats } from 'src/libs/dto/type/meta/campaign.type';

export interface AdSetResponse {
	id: string;
	metaAdSetId: string;
	metaCampaignId: string;
	campaignName: string | null;
	name: string;
	status: string;
	dailyBudget: number | null;
	lifetimeBudget: number | null;
	optimizationGoal: string | null;
	bidStrategy: string | null;
	targeting: any | null;
	startTime: Date | null;
	stopTime: Date | null;
	createdAt: Date;
	stats?: CampaignStats;
}

export interface PaginatedAdSetsResponse {
	data: AdSetResponse[];
	meta: PaginationMeta;
}
