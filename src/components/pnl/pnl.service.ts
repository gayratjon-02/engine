import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCost } from 'src/libs/entity/product-cost.entity';
import { ShopifyProduct } from 'src/libs/entity/shopify-product.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { Message } from 'src/libs/dto/enum/common.enum';
import { UpdateCostsDto } from './dto/update-costs.dto';

@Injectable()
export class PnlService {
	private readonly logger = new Logger(PnlService.name);

	constructor(
		@InjectRepository(ProductCost)
		private readonly costRepo: Repository<ProductCost>,
		@InjectRepository(ShopifyProduct)
		private readonly productRepo: Repository<ShopifyProduct>,
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
}
