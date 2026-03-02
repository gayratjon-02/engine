import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from 'src/libs/entity/brand.entity';
import { BRAND_STATUS } from 'src/libs/dto/enum/brand.enum';
import { SUBSCRIPTION_PLAN } from 'src/libs/dto/enum/sub.plan';
import { Message } from 'src/libs/dto/enum/common.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateBrandDto } from 'src/libs/dto/brand/create-brand.dto';

@Injectable()
export class BrandService {
	private readonly logger = new Logger(BrandService.name);

	constructor(
		@InjectRepository(Brand)
		private readonly brandRepo: Repository<Brand>,
		private readonly subscriptionService: SubscriptionService,
	) {}

	async createBrand(userId: string, input: CreateBrandDto): Promise<Brand> {
		// 1. Plan limit tekshiruv — faqat Agency ko'p brand yarata oladi
		const subscription = await this.subscriptionService.getCurrentPlan(userId);

		if (subscription.plan !== SUBSCRIPTION_PLAN.AGENCY) {
			const existingCount = await this.brandRepo.count({
				where: { userId, status: BRAND_STATUS.ACTIVE },
			});

			if (existingCount >= 1) {
				throw new BadRequestException(
					'Free and Pro plans allow only 1 brand. Upgrade to Agency for multiple brands.',
				);
			}
		}

		// 2. Nom dublikat tekshiruv (bir user ichida)
		const exists = await this.brandRepo.findOne({
			where: { userId, name: input.name, status: BRAND_STATUS.ACTIVE },
		});

		if (exists) {
			throw new BadRequestException(Message.BRAND_ALREADY_EXISTS);
		}

		// 3. Brand yaratish
		const brand = this.brandRepo.create({
			userId,
			name: input.name,
			logoUrl: input.logoUrl || null,
			shopifyDomain: input.shopifyDomain || null,
			timezone: input.timezone || 'UTC',
			currency: input.currency || 'USD',
			status: BRAND_STATUS.ACTIVE,
		} as Partial<Brand>);

		const saved = await this.brandRepo.save(brand);
		this.logger.log(`Brand created: ${saved.id} by user: ${userId}`);

		return saved;
	}

	async getUserBrands(userId: string): Promise<Brand[]> {
		return await this.brandRepo.find({
			where: { userId, status: BRAND_STATUS.ACTIVE },
			order: { createdAt: 'DESC' },
		});
	}
}
