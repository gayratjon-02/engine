import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';

export interface OrderResponse {
	id: string;
	shopifyOrderId: number;
	orderNumber: string;
	customerEmail: string | null;
	totalPrice: number;
	subtotalPrice: number;
	totalDiscounts: number;
	totalShipping: number;
	financialStatus: string;
	fulfillmentStatus: string | null;
	utmSource: string | null;
	utmMedium: string | null;
	utmCampaign: string | null;
	isNewCustomer: boolean;
	hasDiscount: boolean;
	discountCodes: string | null;
	orderDate: Date;
}

export interface OrdersSummary {
	totalRevenue: number;
	totalOrders: number;
	avgOrderValue: number;
	newCustomers: number;
	returningCustomers: number;
}

export interface PaginatedOrdersResponse {
	orders: OrderResponse[];
	summary: OrdersSummary;
	pagination: PaginationMeta;
}
