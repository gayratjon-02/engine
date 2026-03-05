import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { ShopifyOrder } from 'src/libs/entity/shopify-order.entity';
import { ShopifyOrderItem } from 'src/libs/entity/shopify-order-item.entity';
import { ShopifyCustomer } from 'src/libs/entity/shopify-customer.entity';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { PLATFORM, CONNECTION_STATUS } from 'src/libs/dto/enum/platform.enum';

const SHOPIFY_API_VERSION = '2026-01';

@Injectable()
export class ShopifySyncService {
	private readonly logger = new Logger(ShopifySyncService.name);

	constructor(
		@InjectRepository(ShopifyProduct)
		private readonly productRepo: Repository<ShopifyProduct>,
		@InjectRepository(ShopifyOrder)
		private readonly orderRepo: Repository<ShopifyOrder>,
		@InjectRepository(ShopifyOrderItem)
		private readonly orderItemRepo: Repository<ShopifyOrderItem>,
		@InjectRepository(ShopifyCustomer)
		private readonly customerRepo: Repository<ShopifyCustomer>,
		@InjectRepository(PlatformConnection)
		private readonly connectionRepo: Repository<PlatformConnection>,
		private readonly brandService: BrandService,
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
	) {}

	// ==================== MAIN SYNC ====================

	async syncAll(brandId: string, userId: string, resources?: string[]) {
		const startTime = Date.now();

		// 1. Brand tekshiruvi
		await this.brandService.getBrand(userId, brandId);

		// 2. Shopify connection va token olish
		const connection = await this.connectionRepo.findOne({
			where: { brandId, platform: PLATFORM.SHOPIFY, status: CONNECTION_STATUS.ACTIVE },
		});

		if (!connection) {
			throw new BadRequestException('Shopify is not connected. Please connect first.');
		}

		const shopDomain = connection.shopDomain;
		// DEV: SHOPIFY_DEV_ACCESS_TOKEN mavjud bo'lsa uni ishlatish, bo'lmasa connection'dan olish
		const devToken = this.configService.get('SHOPIFY_DEV_ACCESS_TOKEN');
		const accessToken = devToken || connection.accessToken;

		if (!accessToken || !shopDomain) {
			throw new BadRequestException('Invalid Shopify connection. Please reconnect.');
		}

		// DEBUG: Token va domain tekshirish
		console.log('Shop domain:', shopDomain);
		console.log('Access token (first 10 chars):', accessToken?.substring(0, 10));
		console.log('Access token length:', accessToken?.length);

		// 3. Qaysi resource'larni sync qilish
		const syncResources = resources || ['products', 'orders', 'customers'];
		const results: Record<string, any> = {};

		// 4. Sync boshlash — lastSyncError tozalash
		await this.connectionRepo.update(connection.id, {
			lastSyncError: null as any,
		});

		try {
			// 5. Ketma-ket sync (rate limit uchun)
			if (syncResources.includes('products')) {
				this.logger.log(`Syncing products for brand: ${brandId}`);
				results.products = await this.syncProducts(brandId, shopDomain, accessToken);
			}

			if (syncResources.includes('orders')) {
				this.logger.log(`Syncing orders for brand: ${brandId}`);
				results.orders = await this.syncOrders(brandId, shopDomain, accessToken);
			}

			if (syncResources.includes('customers')) {
				this.logger.log(`Syncing customers for brand: ${brandId}`);
				results.customers = await this.syncCustomers(brandId, shopDomain, accessToken);
			}

			// 6. Success — lastSyncedAt yangilash
			const syncedAt = new Date();
			await this.connectionRepo.update(connection.id, {
				lastSyncedAt: syncedAt,
				lastSyncError: null as any,
			});

			const duration = ((Date.now() - startTime) / 1000).toFixed(1);
			this.logger.log(`Sync completed for brand: ${brandId} in ${duration}s`);

			return {
				status: 'completed',
				syncedAt,
				results,
				duration: `${duration}s`,
			};
		} catch (error: any) {
			// 7. Error — xatoni saqlash
			console.error('Shopify sync error:', error.response?.status, error.response?.data);
			await this.connectionRepo.update(connection.id, {
				lastSyncError: error.message || 'Unknown sync error',
			});

			throw new InternalServerErrorException(`Sync failed: ${error.message}`);
		}
	}

	// ==================== SHOPIFY API HELPERS ====================

	private async shopifyGetAll<T>(
		shopDomain: string,
		accessToken: string,
		resource: string,
		dataKey: string,
		params?: Record<string, any>,
	): Promise<T[]> {
		let url: string | null = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/${resource}.json`;
		let allItems: T[] = [];
		const limit = 250;

		let currentParams: Record<string, any> | undefined = { ...params, limit };

		console.log(`[shopifyGetAll] URL: ${url}`);
		console.log(`[shopifyGetAll] Token (first 10): ${accessToken?.substring(0, 10)}`);
		console.log(`[shopifyGetAll] dataKey: ${dataKey}, params:`, currentParams);

		while (url) {
			try {
				const response = await this.httpService.axiosRef.get(url, {
					headers: {
						'X-Shopify-Access-Token': accessToken,
						'Content-Type': 'application/json',
					},
					params: currentParams,
				});

				console.log(`[shopifyGetAll] Response status: ${response.status}`);
				console.log(`[shopifyGetAll] Response keys:`, Object.keys(response.data));
				console.log(`[shopifyGetAll] Items in "${dataKey}": ${response.data[dataKey]?.length ?? 'KEY NOT FOUND'}`);

				const items = response.data[dataKey] || [];
				allItems = [...allItems, ...items];

				// Pagination — Link header'dan next URL olish
				const linkHeader = response.headers['link'] || '';
				const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);

				if (nextMatch) {
					url = nextMatch[1];
					currentParams = undefined; // URL'da params allaqachon bor
				} else {
					url = null;
				}
			} catch (error: any) {
				console.error('Shopify API error:', error.response?.status, error.response?.data);
				if (error.response?.status === 401) {
					throw new UnauthorizedException('Shopify access token expired. Please reconnect.');
				}
				if (error.response?.status === 429) {
					throw new Error('Shopify rate limit exceeded. Please try again in a minute.');
				}
				throw error;
			}
		}

		return allItems;
	}

	// ==================== SYNC PRODUCTS ====================

	private async syncProducts(brandId: string, shopDomain: string, accessToken: string) {
		let created = 0,
			updated = 0,
			errors = 0;

		const products = await this.shopifyGetAll<any>(shopDomain, accessToken, 'products', 'products', {});
		console.log('Products from Shopify:', products.length);

		for (const product of products) {
			try {
				const existing = await this.productRepo.findOne({
					where: { brandId, shopifyProductId: product.id },
				});

				const productData = {
					brandId,
					shopifyProductId: product.id,
					title: product.title,
					vendor: product.vendor || undefined,
					productType: product.product_type || undefined,
					status: product.status || 'active',
					imageUrl: product.image?.src || product.images?.[0]?.src || undefined,
					price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) : undefined,
					sku: product.variants?.[0]?.sku || undefined,
				};

				if (existing) {
					await this.productRepo.update(existing.id, productData);
					updated++;
				} else {
					await this.productRepo.save(this.productRepo.create(productData));
					created++;
				}
			} catch (error: any) {
				this.logger.error(`Product sync error [${product.id}]: ${error.message}`);
				errors++;
			}
		}

		return { synced: products.length, created, updated, errors };
	}

	// ==================== SYNC ORDERS ====================

	private async syncOrders(brandId: string, shopDomain: string, accessToken: string) {
		let created = 0,
			updated = 0,
			errors = 0;

		const orders = await this.shopifyGetAll<any>(shopDomain, accessToken, 'orders', 'orders', {});
		console.log('Orders from Shopify:', orders.length);

		for (const order of orders) {
			try {
				const existing = await this.orderRepo.findOne({
					where: { brandId, shopifyOrderId: order.id },
				});

				// UTM attribution — landing_site dan
				let utmSource: string | null = null;
				let utmMedium: string | null = null;
				let utmCampaign: string | null = null;

				if (order.landing_site) {
					try {
						const url = new URL('https://example.com' + order.landing_site);
						utmSource = url.searchParams.get('utm_source');
						utmMedium = url.searchParams.get('utm_medium');
						utmCampaign = url.searchParams.get('utm_campaign');
					} catch {
						/* ignore parse errors */
					}
				}

				// Note attributes fallback
				if (!utmSource && order.note_attributes) {
					for (const attr of order.note_attributes) {
						if (attr.name === 'utm_source') utmSource = attr.value;
						if (attr.name === 'utm_medium') utmMedium = attr.value;
						if (attr.name === 'utm_campaign') utmCampaign = attr.value;
					}
				}

				// New customer check
				const customerOrderCount = order.customer?.orders_count || 1;
				const isNewCustomer = customerOrderCount <= 1;

				// Discount codes
				const discountCodes = order.discount_codes?.map((d: any) => d.code).join(',') || undefined;

				const orderData = {
					brandId,
					shopifyOrderId: order.id,
					orderNumber: order.name || `#${order.order_number}`,
					customerId: order.customer?.id || undefined,
					customerEmail: order.email || order.customer?.email || undefined,
					totalPrice: parseFloat(order.total_price) || 0,
					subtotalPrice: parseFloat(order.subtotal_price) || 0,
					totalDiscounts: parseFloat(order.total_discounts) || 0,
					totalTax: parseFloat(order.total_tax) || 0,
					totalShipping: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
					financialStatus: order.financial_status || 'pending',
					fulfillmentStatus: order.fulfillment_status || undefined,
					sourceName: order.source_name || undefined,
					referringSite: order.referring_site || undefined,
					landingSite: order.landing_site || undefined,
					utmSource: utmSource || undefined,
					utmMedium: utmMedium || undefined,
					utmCampaign: utmCampaign || undefined,
					isNewCustomer,
					hasDiscount: !!order.discount_codes?.length,
					discountCodes,
					orderDate: new Date(order.created_at),
					syncedAt: new Date(),
				};

				if (existing) {
					await this.orderRepo.update(existing.id, orderData);
					updated++;
				} else {
					const savedOrder = await this.orderRepo.save(this.orderRepo.create(orderData));

					// Order Items — faqat yangi order'lar uchun
					if (order.line_items?.length) {
						for (const item of order.line_items) {
							const orderItem = this.orderItemRepo.create({
								brandId,
								orderId: savedOrder.id,
								shopifyProductId: item.product_id ? Number(item.product_id) : 0,
								shopifyVariantId: item.variant_id ? Number(item.variant_id) : undefined,
								productTitle: item.title || item.name,
								variantTitle: item.variant_title || undefined,
								sku: item.sku || undefined,
								quantity: item.quantity,
								price: parseFloat(item.price) || 0,
								totalDiscount: parseFloat(item.total_discount) || 0,
							});
							await this.orderItemRepo.save(orderItem);
						}
					}

					created++;
				}
			} catch (error: any) {
				this.logger.error(`Order sync error [${order.id}]: ${error.message}`);
				errors++;
			}
		}

		return { synced: orders.length, created, updated, errors };
	}

	// ==================== SYNC CUSTOMERS ====================

	private async syncCustomers(brandId: string, shopDomain: string, accessToken: string) {
		let created = 0,
			updated = 0,
			errors = 0;

		const customers = await this.shopifyGetAll<any>(shopDomain, accessToken, 'customers', 'customers', {});
		console.log('Customers from Shopify:', customers.length);

		for (const customer of customers) {
			try {
				const existing = await this.customerRepo.findOne({
					where: { brandId, shopifyCustomerId: customer.id },
				});

				const customerData = {
					brandId,
					shopifyCustomerId: customer.id,
					email: customer.email || undefined,
					firstName: customer.first_name || undefined,
					lastName: customer.last_name || undefined,
					totalOrders: customer.orders_count || 0,
					totalSpent: parseFloat(customer.total_spent) || 0,
					firstOrderDate: customer.created_at ? new Date(customer.created_at) : new Date(),
					lastOrderDate: customer.updated_at ? new Date(customer.updated_at) : undefined,
				};

				if (existing) {
					await this.customerRepo.update(existing.id, customerData);
					updated++;
				} else {
					await this.customerRepo.save(this.customerRepo.create(customerData));
					created++;
				}
			} catch (error: any) {
				this.logger.error(`Customer sync error [${customer.id}]: ${error.message}`);
				errors++;
			}
		}

		return { synced: customers.length, created, updated, errors };
	}
}
