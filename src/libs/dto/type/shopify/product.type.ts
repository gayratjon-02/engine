import type { PaginationMeta } from 'src/libs/dto/type/common/pagination.type';

export interface ProductResponse {
	id: string;
	shopifyProductId: number;
	title: string;
	productType: string | null;
	vendor: string | null;
	imageUrl: string | null;
	price: number | null;
	sku: string | null;
	status: string;
	cogs: number | null;
	shippingCost: number | null;
	createdAt: Date;
}

export interface PaginatedProductsResponse {
	products: ProductResponse[];
	pagination: PaginationMeta;
}
