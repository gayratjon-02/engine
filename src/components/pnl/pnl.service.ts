import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyOrderItem } from 'src/libs/entity/shopify-order-item.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { Message } from 'src/libs/dto/enum/common.enum';
import { UpdateCostsDto } from './dto/update-costs.dto';
import { GetReportQueryDto } from './dto/get-report-query.dto';
import type { PnlReportResponse } from 'src/libs/dto/type/pnl/report.type';

@Injectable()
export class PnlService {
	private readonly logger = new Logger(PnlService.name);

	constructor(
		@InjectRepository(ProductCost)
		private readonly costRepo: Repository<ProductCost>,
		@InjectRepository(ShopifyProduct)
		private readonly productRepo: Repository<ShopifyProduct>,
		@InjectRepository(ShopifyOrder)
		private readonly orderRepo: Repository<ShopifyOrder>,
		@InjectRepository(ShopifyOrderItem)
		private readonly orderItemRepo: Repository<ShopifyOrderItem>,
		private readonly brandService: BrandService,
	) {}

	async updateCosts(brandId: string, userId: string, dto: UpdateCostsDto) {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Bo'sh array tekshiruv
		if (!dto.costs.length) {
			throw new BadRequestException(Message.COSTS_ARRAY_EMPTY);
		}

		const results: ProductCost[] = [];

		for (const item of dto.costs) {
			// 3. Product shu brand'ga tegishlimi tekshirish
			const product = await this.productRepo.findOne({
				where: { brandId, shopifyProductId: item.shopifyProductId },
			});

			if (!product) {
				throw new BadRequestException(
					`${Message.PRODUCT_NOT_FOUND_FOR_BRAND}: shopifyProductId ${item.shopifyProductId}`,
				);
			}

			// 4. Upsert — mavjud bo'lsa update, yo'q bo'lsa create
			let cost = await this.costRepo.findOne({
				where: { brandId, shopifyProductId: item.shopifyProductId },
			});

			if (cost) {
				cost.cogs = item.cogs;
				cost.shippingCost = item.shippingCost || 0;
				cost = await this.costRepo.save(cost);
			} else {
				cost = this.costRepo.create({
					brandId,
					shopifyProductId: item.shopifyProductId,
					sku: product.sku,
					cogs: item.cogs,
					shippingCost: item.shippingCost || 0,
				} as Partial<ProductCost>);
				cost = await this.costRepo.save(cost);
			}

			results.push(cost);
		}

		this.logger.log(`Costs updated: ${results.length} products for brand: ${brandId}`);

		return {
			updated: results.length,
			costs: results,
		};
	}

	async getReport(brandId: string, userId: string, query: GetReportQueryDto): Promise<PnlReportResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Date range (default: oxirgi 30 kun)
		const endDate = query.endDate || new Date().toISOString().split('T')[0];
		const startDate = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
		const endDateFull = `${endDate}T23:59:59.999Z`;

		// 3. Revenue hisoblash (shopify_orders dan)
		const revenueRaw = await this.orderRepo
			.createQueryBuilder('o')
			.select('SUM(o.totalPrice)', 'grossRevenue')
			.addSelect('SUM(o.totalDiscounts)', 'totalDiscounts')
			.addSelect(`SUM(CASE WHEN o.financialStatus = 'refunded' THEN o.totalPrice ELSE 0 END)`, 'totalRefunds')
			.where('o.brandId = :brandId', { brandId })
			.andWhere('o.orderDate >= :startDate', { startDate })
			.andWhere('o.orderDate <= :endDateFull', { endDateFull })
			.getRawOne();

		const grossRevenue = parseFloat(revenueRaw.grossRevenue) || 0;
		const totalDiscounts = parseFloat(revenueRaw.totalDiscounts) || 0;
		const totalRefunds = parseFloat(revenueRaw.totalRefunds) || 0;
		const netRevenue = grossRevenue - totalRefunds;

		// 4. Product breakdown (order_items + product_costs JOIN)
		// Refunded orderlar hisobga OLINMAYDI
		const productBreakdownRaw = await this.orderItemRepo
			.createQueryBuilder('oi')
			.select('oi.shopifyProductId', 'shopifyProductId')
			.addSelect('oi.productTitle', 'title')
			.addSelect('oi.sku', 'sku')
			.addSelect('SUM(oi.quantity)', 'unitsSold')
			.addSelect('SUM(oi.quantity * oi.price)', 'revenue')
			.addSelect('pc.cogs', 'unitCogs')
			.addSelect('pc.shippingCost', 'unitShippingCost')
			.addSelect('sp.imageUrl', 'imageUrl')
			.innerJoin(ShopifyOrder, 'o', 'o.id = oi.orderId')
			.leftJoin(ProductCost, 'pc', 'pc.brandId = oi.brandId AND pc.shopifyProductId = oi.shopifyProductId')
			.leftJoin(ShopifyProduct, 'sp', 'sp.brandId = oi.brandId AND sp.shopifyProductId = oi.shopifyProductId')
			.where('oi.brandId = :brandId', { brandId })
			.andWhere('o.orderDate >= :startDate', { startDate })
			.andWhere('o.orderDate <= :endDateFull', { endDateFull })
			.andWhere("o.financialStatus != 'refunded'")
			.groupBy('oi.shopifyProductId')
			.addGroupBy('oi.productTitle')
			.addGroupBy('oi.sku')
			.addGroupBy('pc.cogs')
			.addGroupBy('pc.shippingCost')
			.addGroupBy('sp.imageUrl')
			.orderBy('SUM(oi.quantity * oi.price)', 'DESC')
			.getRawMany();

		let totalCogs = 0;
		let totalShippingCosts = 0;

		const productBreakdown = productBreakdownRaw.map((row) => {
			const unitsSold = parseInt(row.unitsSold);
			const revenue = parseFloat(row.revenue);
			const unitCogs = row.unitCogs ? parseFloat(row.unitCogs) : null;
			const unitShipping = row.unitShippingCost ? parseFloat(row.unitShippingCost) : null;

			const cogs = unitCogs !== null ? unitsSold * unitCogs : null;
			const shippingCost = unitShipping !== null ? unitsSold * unitShipping : null;

			if (cogs !== null) totalCogs += cogs;
			if (shippingCost !== null) totalShippingCosts += shippingCost;

			const profit = cogs !== null && shippingCost !== null ? revenue - cogs - shippingCost : null;
			const margin = profit !== null ? Math.round((profit / revenue) * 10000) / 100 : null;

			return {
				shopifyProductId: parseInt(row.shopifyProductId),
				title: row.title,
				imageUrl: row.imageUrl || null,
				sku: row.sku || null,
				unitsSold,
				revenue: Math.round(revenue * 100) / 100,
				cogs: cogs !== null ? Math.round(cogs * 100) / 100 : null,
				shippingCost: shippingCost !== null ? Math.round(shippingCost * 100) / 100 : null,
				profit: profit !== null ? Math.round(profit * 100) / 100 : null,
				margin,
			};
		});

		// 5. Ad spend (hozircha 0 — keyinroq meta/google/tiktok daily stats dan)
		const metaSpend = 0;
		const googleSpend = 0;
		const tiktokSpend = 0;
		const totalAdSpend = metaSpend + googleSpend + tiktokSpend;

		// 6. Final calculations
		totalCogs = Math.round(totalCogs * 100) / 100;
		totalShippingCosts = Math.round(totalShippingCosts * 100) / 100;
		const totalCosts = totalCogs + totalShippingCosts + totalAdSpend;
		const netProfit = Math.round((netRevenue - totalCosts) * 100) / 100;
		const profitMargin = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 10000) / 100 : 0;
		const mer = totalAdSpend > 0 ? Math.round((netRevenue / totalAdSpend) * 100) / 100 : null;

		return {
			period: { startDate, endDate },
			revenue: {
				grossRevenue: Math.round(grossRevenue * 100) / 100,
				totalDiscounts: Math.round(totalDiscounts * 100) / 100,
				totalRefunds: Math.round(totalRefunds * 100) / 100,
				netRevenue: Math.round(netRevenue * 100) / 100,
			},
			costs: {
				totalCogs,
				totalShippingCosts,
				totalAdSpend,
				metaSpend,
				googleSpend,
				tiktokSpend,
				totalCosts: Math.round(totalCosts * 100) / 100,
			},
			profit: {
				netProfit,
				profitMargin,
				mer,
			},
			productBreakdown,
		};
	}
}
