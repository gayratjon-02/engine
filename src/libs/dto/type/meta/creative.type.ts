import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';
import type { CampaignStats } from 'src/libs/dto/type/meta/campaign.type';

export interface CreativeResponse {
	id: string;
	metaAdId: string;
	metaCreativeId: string | null;
	metaCampaignId: string;
	metaAdSetId: string;
	campaignName: string | null;
	adSetName: string | null;
	name: string;
	status: string;
	headline: string | null;
	body: string | null;
	description: string | null;
	imageUrl: string | null;
	videoUrl: string | null;
	videoId: string | null;
	callToAction: string | null;
	destinationUrl: string | null;
	format: string | null;
	aiScore: number | null;
	aiInsight: string | null;
	aiScoredAt: Date | null;
	staticEngineGenerationId: string | null;
	createdAt: Date;
	stats?: CampaignStats;
}

export interface PaginatedCreativesResponse {
	data: CreativeResponse[];
	meta: PaginationMeta;
}
