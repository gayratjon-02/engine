import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';

export interface RefundResponse {
	id: string;
	shopifyRefundId: number;
	orderNumber: string | null;
	customerEmail: string | null;
	amount: number;
	reason: string | null;
	note: string | null;
	refundDate: Date;
	refundLineItems: any[] | null;
	createdAt: Date;
}

export interface RefundsSummary {
	totalRefunds: number;
	refundCount: number;
	avgRefundAmount: number;
}

export interface PaginatedRefundsResponse {
	refunds: RefundResponse[];
	summary: RefundsSummary;
	pagination: PaginationMeta;
}
