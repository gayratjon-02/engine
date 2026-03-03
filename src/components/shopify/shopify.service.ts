import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { GetProductsQueryDto } from 'src/libs/dto/shopify/get-products-query.dto';
import type { PaginatedProductsResponse, ProductResponse } from 'src/libs/dto/type/shopify/product.type';

@Injectable()
export class ShopifyService {
	private readonly logger = new Logger(ShopifyService.name);

	constructor(
		@InjectRepository(ShopifyProduct)
		private readonly productRepo: Repository<ShopifyProduct>,
		@InjectRepository(ProductCost)
		private readonly costRepo: Repository<ProductCost>,
		private readonly brandService: BrandService,
	) {}

	async getProducts(brandId: string, userId: string, query: GetProductsQueryDto): Promise<PaginatedProductsResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Query builder — LEFT JOIN product_costs for COGS
		const qb = this.productRepo
			.createQueryBuilder('p')
			.leftJoinAndMapOne('p.cost', ProductCost, 'c', 'c.shopifyProductId = p.shopifyProductId AND c.brandId = p.brandId')
			.where('p.brandId = :brandId', { brandId });

		// 3. Optional filters
		if (query.status) {
			qb.andWhere('p.status = :status', { status: query.status });
		}

		if (query.search) {
			qb.andWhere('(p.title ILIKE :search OR p.sku ILIKE :search)', { search: `%${query.search}%` });
		}

		// 4. Pagination
		const page = query.page || 1;
		const limit = query.limit || 50;
		const total = await qb.getCount();

		const products = await qb
			.orderBy('p.title', 'ASC')
			.skip((page - 1) * limit)
			.take(limit)
			.getMany();

		// 5. Safe response
		return {
			products: products.map((p) => this.toProductResponse(p)),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	private toProductResponse(product: ShopifyProduct & { cost?: ProductCost }): ProductResponse {
		return {
			id: product.id,
			shopifyProductId: product.shopifyProductId,
			title: product.title,
			productType: product.productType || null,
			vendor: product.vendor || null,
			imageUrl: product.imageUrl || null,
			price: product.price || null,
			sku: product.sku || null,
			status: product.status,
			cogs: product.cost?.cogs || null,
			shippingCost: product.cost?.shippingCost || null,
			createdAt: product.createdAt,
		};
	}
}
