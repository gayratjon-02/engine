export interface PnlPeriod {
	startDate: string;
	endDate: string;
}

export interface PnlRevenue {
	grossRevenue: number;
	totalDiscounts: number;
	totalRefunds: number;
	netRevenue: number;
}

export interface PnlCosts {
	totalCogs: number;
	totalShippingCosts: number;
	totalAdSpend: number;
	metaSpend: number;
	googleSpend: number;
	tiktokSpend: number;
	totalCosts: number;
}

export interface PnlProfit {
	netProfit: number;
	profitMargin: number;
	mer: number | null;
}

export interface ProductBreakdownItem {
	shopifyProductId: number;
	title: string;
	imageUrl: string | null;
	sku: string | null;
	unitsSold: number;
	revenue: number;
	cogs: number | null;
	shippingCost: number | null;
	profit: number | null;
	margin: number | null;
}

export interface PnlReportResponse {
	period: PnlPeriod;
	revenue: PnlRevenue;
	costs: PnlCosts;
	profit: PnlProfit;
	productBreakdown: ProductBreakdownItem[];
}
