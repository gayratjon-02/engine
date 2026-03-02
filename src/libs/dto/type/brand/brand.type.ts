import type { BRAND_STATUS } from 'src/libs/dto/enum/brand.enum';

export interface BrandResponse {
	id: string;
	userId: string;
	name: string;
	logoUrl: string | null;
	shopifyDomain: string | null;
	timezone: string;
	currency: string;
	status: BRAND_STATUS;
	createdAt: Date;
	updatedAt: Date;
}
