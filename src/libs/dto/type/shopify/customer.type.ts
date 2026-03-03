import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';

export interface CustomerResponse {
	id: string;
	shopifyCustomerId: number;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	firstOrderDate: Date;
	firstProductId: number | null;
	totalOrders: number;
	totalSpent: number;
	lastOrderDate: Date | null;
}

export interface CustomersSummary {
	totalCustomers: number;
	newCustomers: number;
	returningCustomers: number;
	avgLtv: number;
}

export interface PaginatedCustomersResponse {
	customers: CustomerResponse[];
	summary: CustomersSummary;
	pagination: PaginationMeta;
}
