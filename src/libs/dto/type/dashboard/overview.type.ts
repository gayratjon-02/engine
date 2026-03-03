export interface DashboardPeriod {
	startDate: string;
	endDate: string;
}

export interface DashboardMetrics {
	totalRevenue: number;
	totalOrders: number;
	avgOrderValue: number;
	newCustomers: number;
	returningCustomers: number;
	totalAdSpend: number;
	mer: number | null;
	blendedCpa: number | null;
	ncac: number | null;
	newCustomerRevenue: number;
	newCustomerRoas: number | null;
	totalRefunds: number;
	refundRate: number;
	totalDiscounts: number;
	conversionRate: number | null;
}

export interface ChannelRevenue {
	channel: string;
	revenue: number;
	percentage: number;
	orders: number;
}

export interface SparklinePoint {
	date: string;
	value: number;
}

export interface DashboardSparklines {
	revenue: SparklinePoint[];
	orders: SparklinePoint[];
	adSpend: SparklinePoint[];
}

export interface DashboardOverviewResponse {
	period: DashboardPeriod;
	metrics: DashboardMetrics;
	revenueByChannel: ChannelRevenue[];
	sparklines: DashboardSparklines;
}
