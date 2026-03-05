import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';

export interface CampaignStats {
	totalSpend: number;
	totalImpressions: number;
	totalClicks: number;
	totalLinkClicks: number;
	totalPurchases: number;
	totalPurchaseValue: number;
	cpc: number;
	cpm: number;
	ctr: number;
	roas: number;
	costPerPurchase: number;
}

export interface CampaignResponse {
	id: string;
	metaCampaignId: string;
	name: string;
	status: string;
	objective: string | null;
	dailyBudget: number | null;
	lifetimeBudget: number | null;
	buyingType: string | null;
	startTime: Date | null;
	stopTime: Date | null;
	createdAt: Date;
	stats?: CampaignStats;
}

export interface PaginatedCampaignsResponse {
	data: CampaignResponse[];
	meta: PaginationMeta;
}
