import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { CONNECTION_STATUS } from 'src/libs/dto/enum/platform.enum';
import { Message } from 'src/libs/dto/enum/common.enum';
import { BrandService } from 'src/components/brand/brand.service';
import type { AllIntegrationsResponse, IntegrationStatusResponse } from 'src/libs/dto/type/integration/integration-status.type';

@Injectable()
export class IntegrationsService {
	private readonly logger = new Logger(IntegrationsService.name);

	constructor(
		@InjectRepository(PlatformConnection)
		private readonly connectionRepo: Repository<PlatformConnection>,
		private readonly brandService: BrandService,
	) {}

	async getIntegrationStatus(brandId: string, userId: string): Promise<AllIntegrationsResponse> {
		// 1. Brand egasini tekshirish (getBrand ichida 404 ham handle bo'ladi)
		await this.brandService.getBrand(userId, brandId);

		// 2. Barcha connectionlarni topish
		const connections = await this.connectionRepo.find({
			where: { brandId },
			order: { createdAt: 'ASC' },
		});

		// 3. Xavfsiz formatga o'tkazish (tokenlar yo'q)
		const integrations: IntegrationStatusResponse[] = connections.map((conn) => ({
			platform: conn.platform,
			status: conn.status,
			externalAccountName: conn.externalAccountName || null,
			shopDomain: conn.shopDomain || null,
			adAccountId: conn.adAccountId || null,
			lastSyncedAt: conn.lastSyncedAt || null,
			lastSyncError: conn.lastSyncError || null,
			connectedAt: conn.createdAt,
		}));

		// 4. Faqat active connectionlar soni
		const connectedCount = connections.filter(
			(conn) => conn.status === CONNECTION_STATUS.ACTIVE,
		).length;

		return { connectedCount, integrations };
	}
}
