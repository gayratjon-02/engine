import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import type { DashboardOverviewResponse } from 'src/libs/dto/type/dashboard/overview.type';

@Injectable()
export class DashboardService {
	private readonly logger = new Logger(DashboardService.name);

	constructor(
		@InjectRepository(ShopifyOrder)
		private readonly orderRepo: Repository<ShopifyOrder>,
		private readonly brandService: BrandService,
	) {}

	async getOverview(brandId: string, userId: string, query: DashboardQueryDto): Promise<DashboardOverviewResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Date range hisoblash
		let startDate: string;
		let endDate: string;

		if (query.startDate && query.endDate) {
			startDate = query.startDate;
			endDate = query.endDate;
		} else {
			const preset = query.datePreset || '30d';
			const days = parseInt(preset.replace('d', ''));
			endDate = new Date().toISOString().split('T')[0];
			startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
		}

		const endDateFull = `${endDate}T23:59:59.999Z`;

		// 3. Asosiy metrikalar — refunded TUSHIB QOLADI
		const metricsRaw = await this.orderRepo
			.createQueryBuilder('o')
			.select('SUM(o.totalPrice)', 'totalRevenue')
			.addSelect('COUNT(*)', 'totalOrders')
			.addSelect('SUM(o.totalDiscounts)', 'totalDiscounts')
			.addSelect('COUNT(CASE WHEN o.isNewCustomer = true THEN 1 END)', 'newCustomers')
			.addSelect('COUNT(CASE WHEN o.isNewCustomer = false THEN 1 END)', 'returningCustomers')
			.addSelect('SUM(CASE WHEN o.isNewCustomer = true THEN o.totalPrice ELSE 0 END)', 'newCustomerRevenue')
			.where('o.brandId = :brandId', { brandId })
			.andWhere('o.orderDate >= :startDate', { startDate })
			.andWhere('o.orderDate <= :endDateFull', { endDateFull })
			.andWhere("o.financialStatus != 'refunded'")
			.getRawOne();

		// Refund summasi alohida
		const refundRaw = await this.orderRepo
			.createQueryBuilder('o')
			.select('COUNT(*)', 'refundedOrders')
			.addSelect('SUM(o.totalPrice)', 'totalRefunds')
			.where('o.brandId = :brandId', { brandId })
			.andWhere('o.orderDate >= :startDate', { startDate })
			.andWhere('o.orderDate <= :endDateFull', { endDateFull })
			.andWhere("o.financialStatus = 'refunded'")
			.getRawOne();

		const totalRevenue = parseFloat(metricsRaw.totalRevenue) || 0;
		const totalOrders = parseInt(metricsRaw.totalOrders) || 0;
		const newCustomers = parseInt(metricsRaw.newCustomers) || 0;
		const returningCustomers = parseInt(metricsRaw.returningCustomers) || 0;
		const newCustomerRevenue = parseFloat(metricsRaw.newCustomerRevenue) || 0;
		const totalDiscounts = parseFloat(metricsRaw.totalDiscounts) || 0;
		const totalRefunds = parseFloat(refundRaw.totalRefunds) || 0;
		const refundedOrders = parseInt(refundRaw.refundedOrders) || 0;
		const allOrders = totalOrders + refundedOrders;

		// Ad spend (hozircha 0)
		const totalAdSpend = 0;

		const metrics = {
			totalRevenue: Math.round(totalRevenue * 100) / 100,
			totalOrders,
			avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
			newCustomers,
			returningCustomers,
			totalAdSpend,
			mer: totalAdSpend > 0 ? Math.round((totalRevenue / totalAdSpend) * 100) / 100 : null,
			blendedCpa: totalAdSpend > 0 && totalOrders > 0 ? Math.round((totalAdSpend / totalOrders) * 100) / 100 : null,
			ncac: totalAdSpend > 0 && newCustomers > 0 ? Math.round((totalAdSpend / newCustomers) * 100) / 100 : null,
			newCustomerRevenue: Math.round(newCustomerRevenue * 100) / 100,
			newCustomerRoas: totalAdSpend > 0 ? Math.round((newCustomerRevenue / totalAdSpend) * 100) / 100 : null,
			totalRefunds: Math.round(totalRefunds * 100) / 100,
			refundRate: allOrders > 0 ? Math.round((refundedOrders / allOrders) * 10000) / 100 : 0,
			totalDiscounts: Math.round(totalDiscounts * 100) / 100,
			conversionRate: null as number | null, // Sessions data keyinroq
		};

		// 4. Revenue by Channel (UTM attribution)
		const channelRaw = await this.orderRepo
			.createQueryBuilder('o')
			.select(
				`CASE
					WHEN o.utmMedium IN ('cpc', 'paid_social', 'ppc') AND o.utmSource = 'facebook' THEN 'Paid (Facebook)'
					WHEN o.utmMedium IN ('cpc', 'paid_social', 'ppc') AND o.utmSource = 'google' THEN 'Paid (Google)'
					WHEN o.utmMedium IN ('cpc', 'paid_social', 'ppc') AND o.utmSource = 'tiktok' THEN 'Paid (TikTok)'
					WHEN o.utmMedium = 'email' THEN 'Email'
					WHEN o.utmMedium = 'organic' THEN 'Organic'
					WHEN o.utmSource IS NULL AND o.utmMedium IS NULL THEN 'Direct / Unattributed'
					ELSE 'Other'
				END`,
				'channel',
			)
			.addSelect('SUM(o.totalPrice)', 'revenue')
			.addSelect('COUNT(*)', 'orders')
			.where('o.brandId = :brandId', { brandId })
			.andWhere('o.orderDate >= :startDate', { startDate })
			.andWhere('o.orderDate <= :endDateFull', { endDateFull })
			.andWhere("o.financialStatus != 'refunded'")
			.groupBy('channel')
			.orderBy('revenue', 'DESC')
			.getRawMany();

		const revenueByChannel = channelRaw.map((row) => ({
			channel: row.channel,
			revenue: Math.round(parseFloat(row.revenue) * 100) / 100,
			percentage: totalRevenue > 0 ? Math.round((parseFloat(row.revenue) / totalRevenue) * 10000) / 100 : 0,
			orders: parseInt(row.orders),
		}));

		// 5. Sparklines — kunlik data (chart uchun)
		const sparklineRaw = await this.orderRepo
			.createQueryBuilder('o')
			.select("TO_CHAR(o.orderDate, 'YYYY-MM-DD')", 'date')
			.addSelect('SUM(o.totalPrice)', 'revenue')
			.addSelect('COUNT(*)', 'orders')
			.where('o.brandId = :brandId', { brandId })
			.andWhere('o.orderDate >= :startDate', { startDate })
			.andWhere('o.orderDate <= :endDateFull', { endDateFull })
			.andWhere("o.financialStatus != 'refunded'")
			.groupBy("TO_CHAR(o.orderDate, 'YYYY-MM-DD')")
			.orderBy('date', 'ASC')
			.getRawMany();

		// Date range ichidagi har bir kun uchun data (bo'sh kunlar 0)
		const sparklineMap = new Map<string, { revenue: number; orders: number }>();
		sparklineRaw.forEach((row) => {
			sparklineMap.set(row.date, {
				revenue: parseFloat(row.revenue) || 0,
				orders: parseInt(row.orders) || 0,
			});
		});

		const revenueSparkline: { date: string; value: number }[] = [];
		const ordersSparkline: { date: string; value: number }[] = [];
		const adSpendSparkline: { date: string; value: number }[] = [];

		const current = new Date(startDate);
		const end = new Date(endDate);
		while (current <= end) {
			const dateStr = current.toISOString().split('T')[0];
			const dayData = sparklineMap.get(dateStr) || { revenue: 0, orders: 0 };

			revenueSparkline.push({ date: dateStr, value: Math.round(dayData.revenue * 100) / 100 });
			ordersSparkline.push({ date: dateStr, value: dayData.orders });
			adSpendSparkline.push({ date: dateStr, value: 0 }); // hozircha 0

			current.setDate(current.getDate() + 1);
		}

		return {
			period: { startDate, endDate },
			metrics,
			revenueByChannel,
			sparklines: {
				revenue: revenueSparkline,
				orders: ordersSparkline,
				adSpend: adSpendSparkline,
			},
		};
	}
}
