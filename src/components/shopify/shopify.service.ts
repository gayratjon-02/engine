import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyCustomer } from 'src/libs/entity/shopify-customer.entity';
import { ShopifyRefund } from 'src/libs/entity/shopify-refund.entity';
import { ShopifyCheckout } from 'src/libs/entity/shopify-checkout.entity';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { GetProductsQueryDto } from 'src/libs/dto/shopify/get-products-query.dto';
import { GetOrdersQueryDto } from 'src/libs/dto/shopify/get-orders-query.dto';
import { GetCustomersQueryDto } from 'src/libs/dto/shopify/get-customers-query.dto';
import { GetRefundsQueryDto } from 'src/libs/dto/shopify/get-refunds-query.dto';
import { GetCheckoutsQueryDto } from 'src/libs/dto/shopify/get-checkouts-query.dto';
import type { PaginatedProductsResponse, ProductResponse } from 'src/libs/dto/type/shopify/product.type';
import type { PaginatedOrdersResponse, OrderResponse } from 'src/libs/dto/type/shopify/order.type';
import type { PaginatedCustomersResponse, CustomerResponse } from 'src/libs/dto/type/shopify/customer.type';
import type { PaginatedRefundsResponse, RefundResponse } from 'src/libs/dto/type/shopify/refund.type';
import type { PaginatedCheckoutsResponse, CheckoutResponse } from 'src/libs/dto/type/shopify/checkout.type';

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
		@InjectRepository(ShopifyRefund)
		private readonly refundRepo: Repository<ShopifyRefund>,
		@InjectRepository(ShopifyCheckout)
		private readonly checkoutRepo: Repository<ShopifyCheckout>,
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
			.leftJoinAndMapOne(
				'p.cost',
				ProductCost,
				'c',
				'c.shopifyProductId = p.shopifyProductId AND c.brandId = p.brandId',
			)
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
		const qb = this.orderRepo.createQueryBuilder('o').where('o.brandId = :brandId', { brandId });

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

	async getCustomers(
		brandId: string,
		userId: string,
		query: GetCustomersQueryDto,
	): Promise<PaginatedCustomersResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Query builder
		const qb = this.customerRepo.createQueryBuilder('c').where('c.brandId = :brandId', { brandId });

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

	async getRefunds(brandId: string, userId: string, query: GetRefundsQueryDto): Promise<PaginatedRefundsResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Query builder — LEFT JOIN order for orderNumber & customerEmail
		const qb = this.refundRepo
			.createQueryBuilder('r')
			.leftJoinAndSelect('r.order', 'o')
			.where('r.brandId = :brandId', { brandId });

		// 3. Date filter
		if (query.startDate) {
			qb.andWhere('r.refundDate >= :startDate', { startDate: query.startDate });
		}
		if (query.endDate) {
			qb.andWhere('r.refundDate <= :endDate', { endDate: `${query.endDate}T23:59:59.999Z` });
		}

		// 4. Reason filter
		if (query.reason) {
			qb.andWhere('r.reason = :reason', { reason: query.reason });
		}

		// 5. Summary hisoblash (pagination dan oldin, filterlar bilan)
		const summaryRaw = await this.refundRepo
			.createQueryBuilder('r')
			.select('SUM(r.amount)', 'totalRefunds')
			.addSelect('COUNT(*)', 'refundCount')
			.addSelect('AVG(r.amount)', 'avgRefundAmount')
			.where('r.brandId = :brandId', { brandId })
			.andWhere(query.startDate ? 'r.refundDate >= :startDate' : '1=1', { startDate: query.startDate })
			.andWhere(query.endDate ? 'r.refundDate <= :endDate' : '1=1', {
				endDate: query.endDate ? `${query.endDate}T23:59:59.999Z` : undefined,
			})
			.andWhere(query.reason ? 'r.reason = :reason' : '1=1', { reason: query.reason })
			.getRawOne();

		const summary = {
			totalRefunds: Math.round((parseFloat(summaryRaw.totalRefunds) || 0) * 100) / 100,
			refundCount: parseInt(summaryRaw.refundCount) || 0,
			avgRefundAmount: Math.round((parseFloat(summaryRaw.avgRefundAmount) || 0) * 100) / 100,
		};

		// 6. Default sort: refundDate DESC
		qb.orderBy('r.refundDate', 'DESC');

		// 7. Pagination
		const page = query.page || 1;
		const limit = query.limit || 50;
		const total = await qb.getCount();

		const refunds = await qb
			.skip((page - 1) * limit)
			.take(limit)
			.getMany();

		return {
			refunds: refunds.map((r) => this.toRefundResponse(r)),
			summary,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getCheckouts(
		brandId: string,
		userId: string,
		query: GetCheckoutsQueryDto,
	): Promise<PaginatedCheckoutsResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Query builder
		const qb = this.checkoutRepo.createQueryBuilder('c').where('c.brandId = :brandId', { brandId });

		// 3. Date filter
		if (query.startDate) {
			qb.andWhere('c.checkoutDate >= :startDate', { startDate: query.startDate });
		}
		if (query.endDate) {
			qb.andWhere('c.checkoutDate <= :endDate', { endDate: `${query.endDate}T23:59:59.999Z` });
		}

		// 4. Status filter
		if (query.status) {
			qb.andWhere('c.status = :status', { status: query.status });
		}

		// 5. Summary — status filtersiz, faqat date filter bilan (umumiy ko'rinish)
		const summaryQb = this.checkoutRepo.createQueryBuilder('c').where('c.brandId = :brandId', { brandId });

		if (query.startDate) {
			summaryQb.andWhere('c.checkoutDate >= :startDate', { startDate: query.startDate });
		}
		if (query.endDate) {
			summaryQb.andWhere('c.checkoutDate <= :endDate', { endDate: `${query.endDate}T23:59:59.999Z` });
		}

		const summaryRaw = await summaryQb
			.select('COUNT(*)', 'totalCheckouts')
			.addSelect("COUNT(CASE WHEN c.status = 'complete' THEN 1 END)", 'completedCheckouts')
			.addSelect("COUNT(CASE WHEN c.status = 'abandoned' THEN 1 END)", 'abandonedCheckouts')
			.addSelect("SUM(CASE WHEN c.status = 'abandoned' THEN c.totalPrice ELSE 0 END)", 'abandonedRevenue')
			.getRawOne();

		const totalCheckouts = parseInt(summaryRaw.totalCheckouts) || 0;
		const completedCheckouts = parseInt(summaryRaw.completedCheckouts) || 0;
		const abandonedCheckouts = parseInt(summaryRaw.abandonedCheckouts) || 0;
		const abandonedRevenue = parseFloat(summaryRaw.abandonedRevenue) || 0;

		const summary = {
			totalCheckouts,
			completedCheckouts,
			abandonedCheckouts,
			abandonmentRate: totalCheckouts > 0 ? Math.round((1 - completedCheckouts / totalCheckouts) * 100 * 100) / 100 : 0,
			abandonedRevenue: Math.round(abandonedRevenue * 100) / 100,
		};

		// 6. Default sort: checkoutDate DESC
		qb.orderBy('c.checkoutDate', 'DESC');

		// 7. Pagination
		const page = query.page || 1;
		const limit = query.limit || 50;
		const total = await qb.getCount();

		const checkouts = await qb
			.skip((page - 1) * limit)
			.take(limit)
			.getMany();

		return {
			checkouts: checkouts.map((c) => this.toCheckoutResponse(c)),
			summary,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	private toCheckoutResponse(checkout: ShopifyCheckout): CheckoutResponse {
		return {
			id: checkout.id,
			shopifyCheckoutId: checkout.shopifyCheckoutId,
			customerEmail: checkout.customerEmail || null,
			totalPrice: checkout.totalPrice,
			status: checkout.status,
			checkoutDate: checkout.checkoutDate,
			completedAt: checkout.completedAt || null,
		};
	}

	private toRefundResponse(refund: ShopifyRefund): RefundResponse {
		return {
			id: refund.id,
			shopifyRefundId: refund.shopifyRefundId,
			orderNumber: refund.order?.orderNumber || null,
			customerEmail: refund.order?.customerEmail || null,
			amount: refund.amount,
			reason: refund.reason || null,
			note: refund.note || null,
			refundDate: refund.refundDate,
			refundLineItems: refund.refundLineItems || null,
			createdAt: refund.createdAt,
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
