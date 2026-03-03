import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyCustomer } from 'src/libs/entity/shopify-customer.entity';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { GetProductsQueryDto } from 'src/libs/dto/shopify/get-products-query.dto';
import { GetOrdersQueryDto } from 'src/libs/dto/shopify/get-orders-query.dto';
import { GetCustomersQueryDto } from 'src/libs/dto/shopify/get-customers-query.dto';
import type { PaginatedProductsResponse, ProductResponse } from 'src/libs/dto/type/shopify/product.type';
import type { PaginatedOrdersResponse, OrderResponse } from 'src/libs/dto/type/shopify/order.type';
import type { PaginatedCustomersResponse, CustomerResponse } from 'src/libs/dto/type/shopify/customer.type';

@Injectable()
export class ShopifyService {
	private readonly logger = new Logger(ShopifyService.name);

	constructor(
		@InjectRepository(ShopifyProduct)
		private readonly productRepo: Repository<ShopifyProduct>,
		@InjectRepository(ShopifyOrder)
		private readonly orderRepo: Repository<ShopifyOrder>,
		@InjectRepository(ShopifyCustomer)
		private readonly customerRepo: Repository<ShopifyCustomer>,
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

	async getOrders(brandId: string, userId: string, query: GetOrdersQueryDto): Promise<PaginatedOrdersResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Query builder
		const qb = this.orderRepo
			.createQueryBuilder('o')
			.where('o.brandId = :brandId', { brandId });

		// 3. Date filter
		if (query.startDate) {
			qb.andWhere('o.orderDate >= :startDate', { startDate: query.startDate });
		}
		if (query.endDate) {
			qb.andWhere('o.orderDate <= :endDate', { endDate: `${query.endDate}T23:59:59.999Z` });
		}

		// 4. Financial status filter
		if (query.financialStatus) {
			qb.andWhere('o.financialStatus = :financialStatus', { financialStatus: query.financialStatus });
		}

		// 5. New customer filter
		if (query.isNewCustomer !== undefined) {
			qb.andWhere('o.isNewCustomer = :isNewCustomer', { isNewCustomer: query.isNewCustomer === 'true' });
		}

		// 6. Search (orderNumber yoki email)
		if (query.search) {
			qb.andWhere('(o.orderNumber ILIKE :search OR o.customerEmail ILIKE :search)', {
				search: `%${query.search}%`,
			});
		}

		// 7. Summary hisoblash (pagination dan oldin, filterlar bilan)
		const summaryRaw = await qb
			.clone()
			.select('SUM(o.totalPrice)', 'totalRevenue')
			.addSelect('COUNT(*)', 'totalOrders')
			.addSelect('COUNT(CASE WHEN o.isNewCustomer = true THEN 1 END)', 'newCustomers')
			.addSelect('COUNT(CASE WHEN o.isNewCustomer = false THEN 1 END)', 'returningCustomers')
			.getRawOne();

		const totalRevenue = parseFloat(summaryRaw.totalRevenue) || 0;
		const totalOrders = parseInt(summaryRaw.totalOrders) || 0;

		const summary = {
			totalRevenue,
			totalOrders,
			avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
			newCustomers: parseInt(summaryRaw.newCustomers) || 0,
			returningCustomers: parseInt(summaryRaw.returningCustomers) || 0,
		};

		// 8. Sorting
		const sortBy = query.sortBy || 'orderDate';
		const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
		qb.orderBy(`o.${sortBy}`, sortOrder);

		// 9. Pagination
		const page = query.page || 1;
		const limit = query.limit || 50;
		const total = await qb.getCount();

		const orders = await qb
			.skip((page - 1) * limit)
			.take(limit)
			.getMany();

		return {
			orders: orders.map((o) => this.toOrderResponse(o)),
			summary,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getCustomers(brandId: string, userId: string, query: GetCustomersQueryDto): Promise<PaginatedCustomersResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Query builder
		const qb = this.customerRepo
			.createQueryBuilder('c')
			.where('c.brandId = :brandId', { brandId });

		// 3. Search filter
		if (query.search) {
			qb.andWhere('(c.email ILIKE :search OR c.firstName ILIKE :search OR c.lastName ILIKE :search)', {
				search: `%${query.search}%`,
			});
		}

		// 4. Min orders filter (returning = minOrders=2)
		if (query.minOrders) {
			qb.andWhere('c.totalOrders >= :minOrders', { minOrders: query.minOrders });
		}

		// 5. Summary hisoblash (pagination dan oldin, filterlar bilan)
		const summaryRaw = await qb
			.clone()
			.select('COUNT(*)', 'totalCustomers')
			.addSelect('COUNT(CASE WHEN c.totalOrders = 1 THEN 1 END)', 'newCustomers')
			.addSelect('COUNT(CASE WHEN c.totalOrders > 1 THEN 1 END)', 'returningCustomers')
			.addSelect('AVG(c.totalSpent)', 'avgLtv')
			.getRawOne();

		const summary = {
			totalCustomers: parseInt(summaryRaw.totalCustomers) || 0,
			newCustomers: parseInt(summaryRaw.newCustomers) || 0,
			returningCustomers: parseInt(summaryRaw.returningCustomers) || 0,
			avgLtv: Math.round((parseFloat(summaryRaw.avgLtv) || 0) * 100) / 100,
		};

		// 6. Sorting
		const sortBy = query.sortBy || 'lastOrderDate';
		const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
		qb.orderBy(`c.${sortBy}`, sortOrder);

		// 7. Pagination
		const page = query.page || 1;
		const limit = query.limit || 50;
		const total = await qb.getCount();

		const customers = await qb
			.skip((page - 1) * limit)
			.take(limit)
			.getMany();

		return {
			customers: customers.map((c) => this.toCustomerResponse(c)),
			summary,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	private toCustomerResponse(customer: ShopifyCustomer): CustomerResponse {
		return {
			id: customer.id,
			shopifyCustomerId: customer.shopifyCustomerId,
			email: customer.email || null,
			firstName: customer.firstName || null,
			lastName: customer.lastName || null,
			firstOrderDate: customer.firstOrderDate,
			firstProductId: customer.firstProductId || null,
			totalOrders: customer.totalOrders,
			totalSpent: customer.totalSpent,
			lastOrderDate: customer.lastOrderDate || null,
		};
	}

	private toOrderResponse(order: ShopifyOrder): OrderResponse {
		return {
			id: order.id,
			shopifyOrderId: order.shopifyOrderId,
			orderNumber: order.orderNumber,
			customerEmail: order.customerEmail || null,
			totalPrice: order.totalPrice,
			subtotalPrice: order.subtotalPrice,
			totalDiscounts: order.totalDiscounts,
			totalShipping: order.totalShipping,
			financialStatus: order.financialStatus,
			fulfillmentStatus: order.fulfillmentStatus || null,
			utmSource: order.utmSource || null,
			utmMedium: order.utmMedium || null,
			utmCampaign: order.utmCampaign || null,
			isNewCustomer: order.isNewCustomer,
			hasDiscount: order.hasDiscount,
			discountCodes: order.discountCodes || null,
			orderDate: order.orderDate,
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
