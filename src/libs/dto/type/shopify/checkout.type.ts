import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';

export interface CheckoutResponse {
	id: string;
	shopifyCheckoutId: number;
	customerEmail: string | null;
	totalPrice: number;
	status: string;
	checkoutDate: Date;
	completedAt: Date | null;
}

export interface CheckoutsSummary {
	totalCheckouts: number;
	completedCheckouts: number;
	abandonedCheckouts: number;
	abandonmentRate: number;
	abandonedRevenue: number;
}

export interface PaginatedCheckoutsResponse {
	checkouts: CheckoutResponse[];
	summary: CheckoutsSummary;
	pagination: PaginationMeta;
}
