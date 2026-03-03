import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';
import { PLATFORM, CONNECTION_STATUS } from 'src/libs/dto/enum/platform.enum';
import { Message } from 'src/libs/dto/enum/common.enum';
import { BrandService } from 'src/components/brand/brand.service';
import { ConnectPlatformDto } from 'src/libs/dto/integration/connect-platform.dto';
import { DisconnectPlatformDto } from 'src/libs/dto/integration/disconnect-platform.dto';
import type { AllIntegrationsResponse, IntegrationStatusResponse } from 'src/libs/dto/type/integration/integration-status.type';

@Injectable()
export class IntegrationsService {
	private readonly logger = new Logger(IntegrationsService.name);

	constructor(
		@InjectRepository(PlatformConnection)
		private readonly connectionRepo: Repository<PlatformConnection>,
		@InjectRepository(Brand)
		private readonly brandRepo: Repository<Brand>,
		private readonly brandService: BrandService,
	) {}

	async getIntegrationStatus(brandId: string, userId: string): Promise<AllIntegrationsResponse> {
		await this.brandService.getBrand(userId, brandId);

		const connections = await this.connectionRepo.find({
			where: { brandId },
			order: { createdAt: 'ASC' },
		});

		const integrations = this.toSafeResponse(connections);

		const connectedCount = connections.filter(
			(conn) => conn.status === CONNECTION_STATUS.ACTIVE,
		).length;

		return { connectedCount, integrations };
	}

	async connectPlatform(brandId: string, userId: string, input: ConnectPlatformDto): Promise<IntegrationStatusResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Platform-specific validation
		if (input.platform === PLATFORM.SHOPIFY && !input.shopDomain) {
			throw new BadRequestException(Message.SHOPIFY_DOMAIN_REQUIRED);
		}

		if (input.platform !== PLATFORM.SHOPIFY && !input.adAccountId) {
			throw new BadRequestException(Message.AD_ACCOUNT_ID_REQUIRED);
		}

		// 3. Mavjud connection tekshirish
		const existing = await this.connectionRepo.findOne({
			where: { brandId, platform: input.platform },
		});

		let connection: PlatformConnection;

		if (existing) {
			if (existing.status === CONNECTION_STATUS.ACTIVE) {
				throw new ConflictException(Message.PLATFORM_ALREADY_CONNECTED);
			}

			// Reconnect: disconnected/expired/error → active
			Object.assign(existing, {
				accessToken: input.accessToken,
				refreshToken: input.refreshToken || null,
				shopDomain: input.shopDomain || null,
				adAccountId: input.adAccountId || null,
				externalAccountName: input.externalAccountName || null,
				status: CONNECTION_STATUS.ACTIVE,
				lastSyncedAt: null,
				lastSyncError: null,
			});

			connection = await this.connectionRepo.save(existing);
			this.logger.log(`Platform reconnected: ${input.platform} for brand: ${brandId}`);
		} else {
			// Yangi connection yaratish
			connection = this.connectionRepo.create({
				brandId,
				platform: input.platform,
				accessToken: input.accessToken,
				refreshToken: input.refreshToken || null,
				shopDomain: input.shopDomain || null,
				adAccountId: input.adAccountId || null,
				externalAccountName: input.externalAccountName || null,
				status: CONNECTION_STATUS.ACTIVE,
			} as Partial<PlatformConnection>);

			connection = await this.connectionRepo.save(connection);
			this.logger.log(`Platform connected: ${input.platform} for brand: ${brandId}`);
		}

		// 4. Shopify ulanganida brand.shopifyDomain yangilash
		if (input.platform === PLATFORM.SHOPIFY && input.shopDomain) {
			await this.brandRepo.update(brandId, { shopifyDomain: input.shopDomain });
		}

		return this.toSafeResponseSingle(connection);
	}

	async disconnectPlatform(brandId: string, userId: string, input: DisconnectPlatformDto): Promise<IntegrationStatusResponse> {
		// 1. Brand egasini tekshirish
		await this.brandService.getBrand(userId, brandId);

		// 2. Connection topish
		const connection = await this.connectionRepo.findOne({
			where: { brandId, platform: input.platform },
		});

		if (!connection) {
			throw new NotFoundException(Message.PLATFORM_NOT_CONNECTED);
		}

		if (connection.status === CONNECTION_STATUS.DISCONNECTED) {
			throw new BadRequestException(Message.PLATFORM_ALREADY_DISCONNECTED);
		}

		// 3. Disconnect: status o'zgartirish, tokenlarni tozalash
		Object.assign(connection, {
			status: CONNECTION_STATUS.DISCONNECTED,
			accessToken: '',
			refreshToken: null,
		});

		const saved = await this.connectionRepo.save(connection);
		this.logger.log(`Platform disconnected: ${input.platform} for brand: ${brandId}`);

		return this.toSafeResponseSingle(saved);
	}

	private toSafeResponse(connections: PlatformConnection[]): IntegrationStatusResponse[] {
		return connections.map((conn) => this.toSafeResponseSingle(conn));
	}

	private toSafeResponseSingle(conn: PlatformConnection): IntegrationStatusResponse {
		return {
			platform: conn.platform,
			status: conn.status,
			externalAccountName: conn.externalAccountName || null,
			shopDomain: conn.shopDomain || null,
			adAccountId: conn.adAccountId || null,
			lastSyncedAt: conn.lastSyncedAt || null,
			lastSyncError: conn.lastSyncError || null,
			connectedAt: conn.createdAt,
		};
	}
}
