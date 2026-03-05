export interface DateRange {
	startDate: string;
	endDate: string;
	days: number;
}

export interface StatsSummary {
	totalSpend: number;
	totalImpressions: number;
	totalClicks: number;
	totalLinkClicks: number;
	totalReach: number;
	totalPurchases: number;
	totalPurchaseValue: number;
	totalAddToCart: number;
	totalInitiateCheckout: number;
}

export interface CalculatedMetrics {
	cpc: number;
	cpm: number;
	ctr: number;
	metaRoas: number;
	costPerPurchase: number;
	conversionRate: number;
	addToCartRate: number;
	checkoutRate: number;
}

export interface StatsSummaryResponse {
	summary: StatsSummary;
	calculated: CalculatedMetrics;
	dateRange: DateRange;
}

export interface DailyStatsRow {
	date: string;
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
}

export interface GroupedStatsRow {
	totalSpend: number;
	totalImpressions: number;
	totalClicks: number;
	totalPurchases: number;
	totalPurchaseValue: number;
	cpc: number;
	cpm: number;
	ctr: number;
	roas: number;
}

export interface CampaignStatsRow extends GroupedStatsRow {
	metaCampaignId: string;
	campaignName: string;
}

export interface AdSetStatsRow extends GroupedStatsRow {
	metaAdSetId: string;
	metaCampaignId: string;
	adSetName: string;
	campaignName: string;
}

export interface AdStatsRow extends GroupedStatsRow {
	metaAdId: string;
	adName: string;
}

export interface GroupedStatsResponse {
	data: DailyStatsRow[] | CampaignStatsRow[] | AdSetStatsRow[] | AdStatsRow[];
	dateRange: DateRange;
}
