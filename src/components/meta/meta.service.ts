import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';
import { MetaCampaign } from 'src/libs/entity/meta-campaign.entity';
import { MetaAdSet } from 'src/libs/entity/meta-adset.entity';
import { MetaAdCreative } from 'src/libs/entity/meta-ad-creative.entity';
import { MetaAdDailyStats } from 'src/libs/entity/meta-ad-daily-stats.entity';
import { BrandService } from 'src/components/brand/brand.service';
import { PLATFORM, CONNECTION_STATUS } from 'src/libs/dto/enum/platform.enum';
import { GetCampaignsQueryDto } from 'src/libs/dto/meta/get-campaigns-query.dto';
import { GetAdSetsQueryDto } from 'src/libs/dto/meta/get-adsets-query.dto';
import { GetCreativesQueryDto } from 'src/libs/dto/meta/get-creatives-query.dto';
import type { CampaignResponse, CampaignStats, PaginatedCampaignsResponse } from 'src/libs/dto/type/meta/campaign.type';
import type { AdSetResponse, PaginatedAdSetsResponse } from 'src/libs/dto/type/meta/adset.type';
import type { CreativeResponse, PaginatedCreativesResponse } from 'src/libs/dto/type/meta/creative.type';

@Injectable()
export class MetaService {
	private readonly logger = new Logger(MetaService.name);

	constructor(
		@InjectRepository(PlatformConnection)
		private readonly connectionRepo: Repository<PlatformConnection>,
		@InjectRepository(Brand)
		private readonly brandRepo: Repository<Brand>,
		@InjectRepository(MetaCampaign)
		private readonly campaignRepo: Repository<MetaCampaign>,
		@InjectRepository(MetaAdSet)
		private readonly adSetRepo: Repository<MetaAdSet>,
		@InjectRepository(MetaAdCreative)
		private readonly creativeRepo: Repository<MetaAdCreative>,
		@InjectRepository(MetaAdDailyStats)
		private readonly dailyStatsRepo: Repository<MetaAdDailyStats>,
		private readonly brandService: BrandService,
		private readonly configService: ConfigService,
		private readonly httpService: HttpService,
	) {}

	// ==================== META OAUTH ====================

	async getAuthUrl(brandId: string, userId: string) {
		await this.brandService.getBrand(userId, brandId);

		const nonce = crypto.randomBytes(16).toString('hex');
		const state = `${brandId}:${nonce}`;

		const brand = await this.brandRepo.findOne({ where: { id: brandId } });
		if (!brand) throw new BadRequestException('Brand not found');

		await this.brandRepo.update(brandId, {
			metadata: { ...(brand.metadata || {}), metaNonce: nonce } as any,
		});

		const appId = this.configService.get('META_APP_ID');
		const redirectUri = this.configService.get('META_REDIRECT_URI');
		const scopes = this.configService.get('META_SCOPES');

		const authUrl =
			`https://www.facebook.com/v21.0/dialog/oauth` +
			`?client_id=${appId}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&scope=${scopes}` +
			`&state=${state}`;

		this.logger.log(`Meta OAuth started for brand: ${brandId}`);

		return { url: authUrl, statusCode: 302 };
	}

	async handleCallback(query: Record<string, string>) {
		const { code, state, error: queryError } = query;

		const [brandId, nonce] = (state || '').split(':');

		if (queryError) {
			const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
			return `${frontendUrl}/settings?meta=cancelled&brand=${brandId}`;
		}

		if (!brandId || !nonce || !code) {
			throw new BadRequestException('Invalid callback parameters');
		}

		const brand = await this.brandRepo.findOne({ where: { id: brandId } });
		if (!brand) {
			throw new BadRequestException('Brand not found');
		}

		if (brand.metadata?.metaNonce !== nonce) {
			throw new BadRequestException('Invalid nonce — possible CSRF attack');
		}

		const appId = this.configService.get('META_APP_ID');
		const appSecret = this.configService.get('META_APP_SECRET');
		const redirectUri = this.configService.get('META_REDIRECT_URI');

		let shortLivedToken: string;
		try {
			const tokenUrl =
				`https://graph.facebook.com/v21.0/oauth/access_token` +
				`?client_id=${appId}` +
				`&client_secret=${appSecret}` +
				`&code=${code}` +
				`&redirect_uri=${encodeURIComponent(redirectUri)}`;

			const tokenResponse = await this.httpService.axiosRef.get(tokenUrl);
			shortLivedToken = tokenResponse.data.access_token;
		} catch (error: any) {
			const fbError = error.response?.data?.error;
			throw new BadRequestException(
				fbError ? `Meta auth failed: ${fbError.message}` : 'Failed to exchange code for token',
			);
		}

		if (!shortLivedToken) {
			throw new BadRequestException('Failed to get access token from Meta');
		}

		let longLivedToken: string;
		let expiresIn: number;
		try {
			const longLivedUrl =
				`https://graph.facebook.com/v21.0/oauth/access_token` +
				`?grant_type=fb_exchange_token` +
				`&client_id=${appId}` +
				`&client_secret=${appSecret}` +
				`&fb_exchange_token=${shortLivedToken}`;

			const longLivedResponse = await this.httpService.axiosRef.get(longLivedUrl);
			longLivedToken = longLivedResponse.data.access_token;
			expiresIn = longLivedResponse.data.expires_in || 5184000;
		} catch (error: any) {
			this.logger.warn(`Long-lived token exchange failed, using short-lived token: ${error.message}`);
			longLivedToken = shortLivedToken;
			expiresIn = 3600;
		}

		let activeAccount: any = null;
		let allAdAccounts: any[] = [];
		try {
			const adAccountsUrl =
				`https://graph.facebook.com/v21.0/me/adaccounts` +
				`?fields=id,name,account_id,account_status,currency,timezone_name` +
				`&access_token=${longLivedToken}`;

			const adAccountsResponse = await this.httpService.axiosRef.get(adAccountsUrl);
			allAdAccounts = adAccountsResponse.data.data || [];

			activeAccount = allAdAccounts.find((acc: any) => acc.account_status === 1) || allAdAccounts[0];
		} catch (error: any) {
			this.logger.error(`Failed to fetch ad accounts: ${error.message}`);
		}

		if (!activeAccount) {
			throw new BadRequestException('No ad accounts found. Please create a Meta ad account first.');
		}

		const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

		let connection = await this.connectionRepo.findOne({
			where: { brandId, platform: PLATFORM.META },
		});

		const connectionData = {
			accessToken: longLivedToken,
			adAccountId: activeAccount.id,
			externalAccountName: activeAccount.name,
			tokenExpiresAt,
			status: CONNECTION_STATUS.ACTIVE,
			lastSyncError: null as any,
			metadata: {
				adAccountName: activeAccount.name,
				currency: activeAccount.currency,
				timezone: activeAccount.timezone_name,
				tokenExpiresAt: tokenExpiresAt.toISOString(),
				allAdAccounts: allAdAccounts.map((acc: any) => ({
					id: acc.id,
					name: acc.name,
					status: acc.account_status,
				})),
			},
		};

		if (connection) {
			Object.assign(connection, connectionData);
			await this.connectionRepo.save(connection);
		} else {
			connection = this.connectionRepo.create({
				brandId,
				platform: PLATFORM.META,
				...connectionData,
			});
			await this.connectionRepo.save(connection);
		}

		await this.brandRepo.update(brandId, {
			metadata: { ...(brand.metadata || {}), metaNonce: null } as any,
		});

		this.logger.log(`Meta OAuth completed for brand: ${brandId}, ad account: ${activeAccount.id}`);

		const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
		return `${frontendUrl}/settings?meta=connected&brand=${brandId}`;
	}

	// ==================== CAMPAIGNS ====================

	async getCampaigns(
		brandId: string,
		userId: string,
		query: GetCampaignsQueryDto,
	): Promise<PaginatedCampaignsResponse> {
		await this.brandService.getBrand(userId, brandId);

		const qb = this.campaignRepo
			.createQueryBuilder('campaign')
			.where('campaign.brandId = :brandId', { brandId });

		if (query.status) {
			qb.andWhere('campaign.status = :status', { status: query.status });
		}

		if (query.search) {
			qb.andWhere('campaign.name ILIKE :search', { search: `%${query.search}%` });
		}

		const total = await qb.getCount();

		const sortBy = query.sortBy || 'name';
		const sortOrder = (query.sortOrder || 'ASC') as 'ASC' | 'DESC';

		if (sortBy !== 'spend') {
			const sortColumn = ['name', 'status', 'createdAt'].includes(sortBy)
				? `campaign.${sortBy}`
				: 'campaign.name';
			qb.orderBy(sortColumn, sortOrder);
		}

		const page = query.page || 1;
		const limit = Math.min(query.limit || 20, 100);
		qb.skip((page - 1) * limit).take(limit);

		const campaigns = await qb.getMany();

		const includeStats = query.includeStats !== 'false';
		let data: CampaignResponse[];

		if (includeStats && campaigns.length > 0) {
			const campaignIds = campaigns.map((c) => c.metaCampaignId);

			const statsQb = this.dailyStatsRepo
				.createQueryBuilder('stats')
				.select('stats.metaCampaignId', 'campaignId')
				.addSelect('SUM(stats.spend)', 'totalSpend')
				.addSelect('SUM(stats.impressions)', 'totalImpressions')
				.addSelect('SUM(stats.clicks)', 'totalClicks')
				.addSelect('SUM(stats.linkClicks)', 'totalLinkClicks')
				.addSelect('SUM(stats.purchases)', 'totalPurchases')
				.addSelect('SUM(stats.purchaseValue)', 'totalPurchaseValue')
				.where('stats.brandId = :brandId', { brandId })
				.andWhere('stats.metaCampaignId IN (:...campaignIds)', { campaignIds })
				.groupBy('stats.metaCampaignId');

			if (query.startDate) {
				statsQb.andWhere('stats.date >= :startDate', { startDate: query.startDate });
			}
			if (query.endDate) {
				statsQb.andWhere('stats.date <= :endDate', { endDate: query.endDate });
			}

			const statsRaw = await statsQb.getRawMany();

			const statsMap = new Map<string, CampaignStats>();
			for (const row of statsRaw) {
				const spend = parseFloat(row.totalSpend) || 0;
				const impressions = parseInt(row.totalImpressions) || 0;
				const clicks = parseInt(row.totalClicks) || 0;
				const linkClicks = parseInt(row.totalLinkClicks) || 0;
				const purchases = parseInt(row.totalPurchases) || 0;
				const purchaseValue = parseFloat(row.totalPurchaseValue) || 0;

				statsMap.set(row.campaignId, {
					totalSpend: parseFloat(spend.toFixed(2)),
					totalImpressions: impressions,
					totalClicks: clicks,
					totalLinkClicks: linkClicks,
					totalPurchases: purchases,
					totalPurchaseValue: parseFloat(purchaseValue.toFixed(2)),
					cpc: clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0,
					cpm: impressions > 0 ? parseFloat(((spend / impressions) * 1000).toFixed(2)) : 0,
					ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
					roas: spend > 0 ? parseFloat((purchaseValue / spend).toFixed(2)) : 0,
					costPerPurchase: purchases > 0 ? parseFloat((spend / purchases).toFixed(2)) : 0,
				});
			}

			const defaultStats: CampaignStats = {
				totalSpend: 0,
				totalImpressions: 0,
				totalClicks: 0,
				totalLinkClicks: 0,
				totalPurchases: 0,
				totalPurchaseValue: 0,
				cpc: 0,
				cpm: 0,
				ctr: 0,
				roas: 0,
				costPerPurchase: 0,
			};

			data = campaigns.map((c) => ({
				...this.toCampaignResponse(c),
				stats: statsMap.get(c.metaCampaignId) || defaultStats,
			}));

			if (sortBy === 'spend') {
				data.sort((a, b) => {
					const diff = (a.stats?.totalSpend || 0) - (b.stats?.totalSpend || 0);
					return sortOrder === 'DESC' ? -diff : diff;
				});
			}
		} else {
			data = campaigns.map((c) => this.toCampaignResponse(c));
		}

		return {
			data,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	private toCampaignResponse(campaign: MetaCampaign): CampaignResponse {
		return {
			id: campaign.id,
			metaCampaignId: campaign.metaCampaignId,
			name: campaign.name,
			status: campaign.status,
			objective: campaign.objective || null,
			dailyBudget: campaign.dailyBudget || null,
			lifetimeBudget: campaign.lifetimeBudget || null,
			buyingType: campaign.buyingType || null,
			startTime: campaign.startTime || null,
			stopTime: campaign.stopTime || null,
			createdAt: campaign.createdAt,
		};
	}

	// ==================== AD SETS ====================

	async getAdSets(
		brandId: string,
		userId: string,
		query: GetAdSetsQueryDto,
	): Promise<PaginatedAdSetsResponse> {
		await this.brandService.getBrand(userId, brandId);

		const qb = this.adSetRepo
			.createQueryBuilder('adset')
			.where('adset.brandId = :brandId', { brandId });

		if (query.campaignId) {
			qb.andWhere('adset.metaCampaignId = :campaignId', { campaignId: query.campaignId });
		}

		if (query.status) {
			qb.andWhere('adset.status = :status', { status: query.status });
		}

		if (query.search) {
			qb.andWhere('adset.name ILIKE :search', { search: `%${query.search}%` });
		}

		const total = await qb.getCount();

		const sortBy = query.sortBy || 'name';
		const sortOrder = (query.sortOrder || 'ASC') as 'ASC' | 'DESC';

		if (sortBy !== 'spend') {
			const sortColumn = ['name', 'status', 'createdAt'].includes(sortBy)
				? `adset.${sortBy}`
				: 'adset.name';
			qb.orderBy(sortColumn, sortOrder);
		}

		const page = query.page || 1;
		const limit = Math.min(query.limit || 20, 100);
		qb.skip((page - 1) * limit).take(limit);

		const adSets = await qb.getMany();

		// Campaign nomlarini olish
		const campaignNameMap = new Map<string, string>();
		if (adSets.length > 0) {
			const campaignIds = [...new Set(adSets.map((a) => a.metaCampaignId))];
			const campaigns = await this.campaignRepo
				.createQueryBuilder('c')
				.select(['c.metaCampaignId', 'c.name'])
				.where('c.brandId = :brandId', { brandId })
				.andWhere('c.metaCampaignId IN (:...campaignIds)', { campaignIds })
				.getMany();

			for (const c of campaigns) {
				campaignNameMap.set(c.metaCampaignId, c.name);
			}
		}

		const includeStats = query.includeStats !== 'false';
		let data: AdSetResponse[];

		if (includeStats && adSets.length > 0) {
			const adSetIds = adSets.map((a) => a.metaAdSetId);

			const statsQb = this.dailyStatsRepo
				.createQueryBuilder('stats')
				.select('stats.metaAdSetId', 'adSetId')
				.addSelect('SUM(stats.spend)', 'totalSpend')
				.addSelect('SUM(stats.impressions)', 'totalImpressions')
				.addSelect('SUM(stats.clicks)', 'totalClicks')
				.addSelect('SUM(stats.linkClicks)', 'totalLinkClicks')
				.addSelect('SUM(stats.purchases)', 'totalPurchases')
				.addSelect('SUM(stats.purchaseValue)', 'totalPurchaseValue')
				.where('stats.brandId = :brandId', { brandId })
				.andWhere('stats.metaAdSetId IN (:...adSetIds)', { adSetIds })
				.groupBy('stats.metaAdSetId');

			if (query.startDate) {
				statsQb.andWhere('stats.date >= :startDate', { startDate: query.startDate });
			}
			if (query.endDate) {
				statsQb.andWhere('stats.date <= :endDate', { endDate: query.endDate });
			}

			const statsRaw = await statsQb.getRawMany();

			const statsMap = new Map<string, CampaignStats>();
			for (const row of statsRaw) {
				const spend = parseFloat(row.totalSpend) || 0;
				const impressions = parseInt(row.totalImpressions) || 0;
				const clicks = parseInt(row.totalClicks) || 0;
				const linkClicks = parseInt(row.totalLinkClicks) || 0;
				const purchases = parseInt(row.totalPurchases) || 0;
				const purchaseValue = parseFloat(row.totalPurchaseValue) || 0;

				statsMap.set(row.adSetId, {
					totalSpend: parseFloat(spend.toFixed(2)),
					totalImpressions: impressions,
					totalClicks: clicks,
					totalLinkClicks: linkClicks,
					totalPurchases: purchases,
					totalPurchaseValue: parseFloat(purchaseValue.toFixed(2)),
					cpc: clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0,
					cpm: impressions > 0 ? parseFloat(((spend / impressions) * 1000).toFixed(2)) : 0,
					ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
					roas: spend > 0 ? parseFloat((purchaseValue / spend).toFixed(2)) : 0,
					costPerPurchase: purchases > 0 ? parseFloat((spend / purchases).toFixed(2)) : 0,
				});
			}

			const defaultStats: CampaignStats = {
				totalSpend: 0,
				totalImpressions: 0,
				totalClicks: 0,
				totalLinkClicks: 0,
				totalPurchases: 0,
				totalPurchaseValue: 0,
				cpc: 0,
				cpm: 0,
				ctr: 0,
				roas: 0,
				costPerPurchase: 0,
			};

			data = adSets.map((a) => ({
				...this.toAdSetResponse(a, campaignNameMap),
				stats: statsMap.get(a.metaAdSetId) || defaultStats,
			}));

			if (sortBy === 'spend') {
				data.sort((a, b) => {
					const diff = (a.stats?.totalSpend || 0) - (b.stats?.totalSpend || 0);
					return sortOrder === 'DESC' ? -diff : diff;
				});
			}
		} else {
			data = adSets.map((a) => this.toAdSetResponse(a, campaignNameMap));
		}

		return {
			data,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	private toAdSetResponse(adSet: MetaAdSet, campaignNameMap: Map<string, string>): AdSetResponse {
		return {
			id: adSet.id,
			metaAdSetId: adSet.metaAdSetId,
			metaCampaignId: adSet.metaCampaignId,
			campaignName: campaignNameMap.get(adSet.metaCampaignId) || null,
			name: adSet.name,
			status: adSet.status,
			dailyBudget: adSet.dailyBudget || null,
			lifetimeBudget: adSet.lifetimeBudget || null,
			optimizationGoal: adSet.optimizationGoal || null,
			bidStrategy: adSet.bidStrategy || null,
			targeting: adSet.targeting || null,
			startTime: adSet.startTime || null,
			stopTime: adSet.stopTime || null,
			createdAt: adSet.createdAt,
		};
	}

	// ==================== CREATIVES ====================

	async getCreatives(
		brandId: string,
		userId: string,
		query: GetCreativesQueryDto,
	): Promise<PaginatedCreativesResponse> {
		await this.brandService.getBrand(userId, brandId);

		const qb = this.creativeRepo
			.createQueryBuilder('creative')
			.where('creative.brandId = :brandId', { brandId });

		if (query.campaignId) {
			qb.andWhere('creative.metaCampaignId = :campaignId', { campaignId: query.campaignId });
		}

		if (query.adSetId) {
			qb.andWhere('creative.metaAdSetId = :adSetId', { adSetId: query.adSetId });
		}

		if (query.status) {
			qb.andWhere('creative.status = :status', { status: query.status });
		}

		if (query.format) {
			qb.andWhere('creative.format = :format', { format: query.format });
		}

		if (query.search) {
			qb.andWhere('(creative.name ILIKE :search OR creative.headline ILIKE :search)', {
				search: `%${query.search}%`,
			});
		}

		if (query.hasAiScore === 'true') {
			qb.andWhere('creative.aiScore IS NOT NULL');
		} else if (query.hasAiScore === 'false') {
			qb.andWhere('creative.aiScore IS NULL');
		}

		const total = await qb.getCount();

		const sortBy = query.sortBy || 'name';
		const sortOrder = (query.sortOrder || 'ASC') as 'ASC' | 'DESC';
		const inMemorySortFields = ['spend', 'roas'];

		if (!inMemorySortFields.includes(sortBy)) {
			const validColumns: Record<string, string> = {
				name: 'creative.name',
				status: 'creative.status',
				format: 'creative.format',
				aiScore: 'creative.aiScore',
				createdAt: 'creative.createdAt',
			};
			const sortColumn = validColumns[sortBy] || 'creative.name';
			if (sortBy === 'aiScore') {
				qb.orderBy(sortColumn, sortOrder, 'NULLS LAST');
			} else {
				qb.orderBy(sortColumn, sortOrder);
			}
		}

		const page = query.page || 1;
		const limit = Math.min(query.limit || 20, 100);
		qb.skip((page - 1) * limit).take(limit);

		const creatives = await qb.getMany();

		// Campaign va AdSet nomlarini batch olish
		const campaignNameMap = new Map<string, string>();
		const adSetNameMap = new Map<string, string>();

		if (creatives.length > 0) {
			const campaignIds = [...new Set(creatives.map((c) => c.metaCampaignId))];
			const adSetIds = [...new Set(creatives.map((c) => c.metaAdSetId))];

			const [campaigns, adSets] = await Promise.all([
				this.campaignRepo
					.createQueryBuilder('c')
					.select(['c.metaCampaignId', 'c.name'])
					.where('c.brandId = :brandId', { brandId })
					.andWhere('c.metaCampaignId IN (:...campaignIds)', { campaignIds })
					.getMany(),
				this.adSetRepo
					.createQueryBuilder('a')
					.select(['a.metaAdSetId', 'a.name'])
					.where('a.brandId = :brandId', { brandId })
					.andWhere('a.metaAdSetId IN (:...adSetIds)', { adSetIds })
					.getMany(),
			]);

			for (const c of campaigns) campaignNameMap.set(c.metaCampaignId, c.name);
			for (const a of adSets) adSetNameMap.set(a.metaAdSetId, a.name);
		}

		const includeStats = query.includeStats !== 'false';
		let data: CreativeResponse[];

		if (includeStats && creatives.length > 0) {
			const adIds = creatives.map((c) => c.metaAdId);

			const statsQb = this.dailyStatsRepo
				.createQueryBuilder('stats')
				.select('stats.metaAdId', 'adId')
				.addSelect('SUM(stats.spend)', 'totalSpend')
				.addSelect('SUM(stats.impressions)', 'totalImpressions')
				.addSelect('SUM(stats.clicks)', 'totalClicks')
				.addSelect('SUM(stats.linkClicks)', 'totalLinkClicks')
				.addSelect('SUM(stats.purchases)', 'totalPurchases')
				.addSelect('SUM(stats.purchaseValue)', 'totalPurchaseValue')
				.where('stats.brandId = :brandId', { brandId })
				.andWhere('stats.metaAdId IN (:...adIds)', { adIds })
				.groupBy('stats.metaAdId');

			if (query.startDate) {
				statsQb.andWhere('stats.date >= :startDate', { startDate: query.startDate });
			}
			if (query.endDate) {
				statsQb.andWhere('stats.date <= :endDate', { endDate: query.endDate });
			}

			const statsRaw = await statsQb.getRawMany();

			const statsMap = new Map<string, CampaignStats>();
			for (const row of statsRaw) {
				const spend = parseFloat(row.totalSpend) || 0;
				const impressions = parseInt(row.totalImpressions) || 0;
				const clicks = parseInt(row.totalClicks) || 0;
				const linkClicks = parseInt(row.totalLinkClicks) || 0;
				const purchases = parseInt(row.totalPurchases) || 0;
				const purchaseValue = parseFloat(row.totalPurchaseValue) || 0;

				statsMap.set(row.adId, {
					totalSpend: parseFloat(spend.toFixed(2)),
					totalImpressions: impressions,
					totalClicks: clicks,
					totalLinkClicks: linkClicks,
					totalPurchases: purchases,
					totalPurchaseValue: parseFloat(purchaseValue.toFixed(2)),
					cpc: clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0,
					cpm: impressions > 0 ? parseFloat(((spend / impressions) * 1000).toFixed(2)) : 0,
					ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
					roas: spend > 0 ? parseFloat((purchaseValue / spend).toFixed(2)) : 0,
					costPerPurchase: purchases > 0 ? parseFloat((spend / purchases).toFixed(2)) : 0,
				});
			}

			const defaultStats: CampaignStats = {
				totalSpend: 0,
				totalImpressions: 0,
				totalClicks: 0,
				totalLinkClicks: 0,
				totalPurchases: 0,
				totalPurchaseValue: 0,
				cpc: 0,
				cpm: 0,
				ctr: 0,
				roas: 0,
				costPerPurchase: 0,
			};

			data = creatives.map((c) => ({
				...this.toCreativeResponse(c, campaignNameMap, adSetNameMap),
				stats: statsMap.get(c.metaAdId) || defaultStats,
			}));

			if (sortBy === 'spend') {
				data.sort((a, b) => {
					const diff = (a.stats?.totalSpend || 0) - (b.stats?.totalSpend || 0);
					return sortOrder === 'DESC' ? -diff : diff;
				});
			} else if (sortBy === 'roas') {
				data.sort((a, b) => {
					const diff = (a.stats?.roas || 0) - (b.stats?.roas || 0);
					return sortOrder === 'DESC' ? -diff : diff;
				});
			}
		} else {
			data = creatives.map((c) => this.toCreativeResponse(c, campaignNameMap, adSetNameMap));
		}

		return {
			data,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	private toCreativeResponse(
		creative: MetaAdCreative,
		campaignNameMap: Map<string, string>,
		adSetNameMap: Map<string, string>,
	): CreativeResponse {
		return {
			id: creative.id,
			metaAdId: creative.metaAdId,
			metaCreativeId: creative.metaCreativeId || null,
			metaCampaignId: creative.metaCampaignId,
			metaAdSetId: creative.metaAdSetId,
			campaignName: campaignNameMap.get(creative.metaCampaignId) || null,
			adSetName: adSetNameMap.get(creative.metaAdSetId) || null,
			name: creative.name,
			status: creative.status,
			headline: creative.headline || null,
			body: creative.body || null,
			description: creative.description || null,
			imageUrl: creative.imageUrl || null,
			videoUrl: creative.videoUrl || null,
			videoId: creative.videoId || null,
			callToAction: creative.callToAction || null,
			destinationUrl: creative.destinationUrl || null,
			format: creative.format || null,
			aiScore: creative.aiScore || null,
			aiInsight: creative.aiInsight || null,
			aiScoredAt: creative.aiScoredAt || null,
			staticEngineGenerationId: creative.staticEngineGenerationId || null,
			createdAt: creative.createdAt,
		};
	}

	// ==================== META SYNC ====================

	async syncMetaData(brandId: string, userId: string) {
		await this.brandService.getBrand(userId, brandId);

		const connection = await this.connectionRepo.findOne({
			where: { brandId, platform: PLATFORM.META, status: CONNECTION_STATUS.ACTIVE },
		});

		if (!connection) {
			throw new BadRequestException('Meta is not connected. Please connect Meta first.');
		}

		const accessToken = connection.accessToken;
		const adAccountId = connection.adAccountId;

		if (!adAccountId) {
			throw new BadRequestException('No ad account found. Please reconnect Meta.');
		}

		const results: any = {
			campaigns: null,
			adSets: null,
			creatives: null,
			dailyStats: null,
		};
		const startTime = Date.now();

		try {
			results.campaigns = await this.syncCampaigns(brandId, adAccountId, accessToken);
			results.adSets = await this.syncAdSets(brandId, adAccountId, accessToken);
			results.creatives = await this.syncCreatives(brandId, adAccountId, accessToken);
			results.dailyStats = await this.syncDailyStats(brandId, adAccountId, accessToken);

			await this.connectionRepo.update(connection.id, {
				lastSyncedAt: new Date(),
				lastSyncError: null as any,
			});

			this.logger.log(`Meta sync completed for brand: ${brandId}`);

			return {
				status: 'completed',
				syncedAt: new Date().toISOString(),
				results,
				duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
			};
		} catch (error: any) {
			await this.connectionRepo.update(connection.id, {
				lastSyncedAt: new Date(),
				lastSyncError: error.message,
			});

			this.logger.error(`Meta sync failed for brand ${brandId}: ${error.message}`);

			return {
				status: 'partial',
				syncedAt: new Date().toISOString(),
				results,
				error: error.message,
				duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
			};
		}
	}

	// ==================== SYNC CAMPAIGNS ====================

	private async syncCampaigns(brandId: string, adAccountId: string, accessToken: string) {
		const stats = { synced: 0, created: 0, updated: 0, errors: 0 };

		const campaigns = await this.metaGetAll(
			`https://graph.facebook.com/v21.0/${adAccountId}/campaigns`,
			{
				fields: 'id,name,status,objective,daily_budget,lifetime_budget,buying_type,start_time,stop_time',
				limit: 100,
			},
			accessToken,
		);

		this.logger.log(`Campaigns fetched: ${campaigns.length}`);

		for (const campaign of campaigns) {
			try {
				const existing = await this.campaignRepo.findOne({
					where: { brandId, metaCampaignId: campaign.id },
				});

				const data = {
					brandId,
					metaCampaignId: campaign.id,
					name: campaign.name,
					status: campaign.status,
					objective: campaign.objective || undefined,
					dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : undefined,
					lifetimeBudget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : undefined,
					buyingType: campaign.buying_type || undefined,
					startTime: campaign.start_time ? new Date(campaign.start_time) : undefined,
					stopTime: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
				};

				if (existing) {
					await this.campaignRepo.update(existing.id, data);
					stats.updated++;
				} else {
					await this.campaignRepo.save(this.campaignRepo.create(data));
					stats.created++;
				}
				stats.synced++;
			} catch (error: any) {
				this.logger.error(`Campaign sync error (${campaign.id}): ${error.message}`);
				stats.errors++;
			}
		}

		return stats;
	}

	// ==================== SYNC AD SETS ====================

	private async syncAdSets(brandId: string, adAccountId: string, accessToken: string) {
		const stats = { synced: 0, created: 0, updated: 0, errors: 0 };

		const adSets = await this.metaGetAll(
			`https://graph.facebook.com/v21.0/${adAccountId}/adsets`,
			{
				fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,optimization_goal,bid_strategy,targeting,start_time,stop_time',
				limit: 100,
			},
			accessToken,
		);

		this.logger.log(`Ad sets fetched: ${adSets.length}`);

		for (const adSet of adSets) {
			try {
				const existing = await this.adSetRepo.findOne({
					where: { brandId, metaAdSetId: adSet.id },
				});

				const data = {
					brandId,
					metaAdSetId: adSet.id,
					metaCampaignId: adSet.campaign_id,
					name: adSet.name,
					status: adSet.status,
					dailyBudget: adSet.daily_budget ? parseFloat(adSet.daily_budget) / 100 : undefined,
					lifetimeBudget: adSet.lifetime_budget ? parseFloat(adSet.lifetime_budget) / 100 : undefined,
					optimizationGoal: adSet.optimization_goal || undefined,
					bidStrategy: adSet.bid_strategy || undefined,
					targeting: adSet.targeting || undefined,
					startTime: adSet.start_time ? new Date(adSet.start_time) : undefined,
					stopTime: adSet.stop_time ? new Date(adSet.stop_time) : undefined,
				};

				if (existing) {
					await this.adSetRepo.update(existing.id, data);
					stats.updated++;
				} else {
					await this.adSetRepo.save(this.adSetRepo.create(data));
					stats.created++;
				}
				stats.synced++;
			} catch (error: any) {
				this.logger.error(`AdSet sync error (${adSet.id}): ${error.message}`);
				stats.errors++;
			}
		}

		return stats;
	}

	// ==================== SYNC CREATIVES ====================

	private async syncCreatives(brandId: string, adAccountId: string, accessToken: string) {
		const stats = { synced: 0, created: 0, updated: 0, errors: 0 };

		const ads = await this.metaGetAll(
			`https://graph.facebook.com/v21.0/${adAccountId}/ads`,
			{
				fields: 'id,name,campaign_id,adset_id,status,creative{id,name,title,body,image_url,thumbnail_url,video_id,call_to_action_type,object_story_spec,link_url}',
				limit: 100,
			},
			accessToken,
		);

		this.logger.log(`Ads (creatives) fetched: ${ads.length}`);

		for (const ad of ads) {
			try {
				const existing = await this.creativeRepo.findOne({
					where: { brandId, metaAdId: ad.id },
				});

				const creative = ad.creative || {};
				const storySpec = creative.object_story_spec || {};
				const linkData = storySpec.link_data || {};

				let format = 'image';
				if (creative.video_id) {
					format = 'video';
				} else if (linkData.child_attachments?.length > 0) {
					format = 'carousel';
				}

				const data = {
					brandId,
					metaAdId: ad.id,
					metaCreativeId: creative.id || undefined,
					metaCampaignId: ad.campaign_id,
					metaAdSetId: ad.adset_id,
					name: ad.name,
					status: ad.status,
					headline: creative.title || linkData.name || undefined,
					body: creative.body || linkData.message || undefined,
					description: linkData.description || undefined,
					imageUrl: creative.image_url || creative.thumbnail_url || undefined,
					videoUrl: undefined,
					videoId: creative.video_id || undefined,
					callToAction: creative.call_to_action_type || linkData.call_to_action?.type || undefined,
					destinationUrl: creative.link_url || linkData.link || undefined,
					format,
				};

				if (existing) {
					await this.creativeRepo.update(existing.id, data);
					stats.updated++;
				} else {
					await this.creativeRepo.save(this.creativeRepo.create(data));
					stats.created++;
				}
				stats.synced++;
			} catch (error: any) {
				this.logger.error(`Creative sync error (${ad.id}): ${error.message}`);
				stats.errors++;
			}
		}

		return stats;
	}

	// ==================== SYNC DAILY STATS ====================

	private async syncDailyStats(brandId: string, adAccountId: string, accessToken: string) {
		const stats = { synced: 0, created: 0, updated: 0, errors: 0 };

		const insights = await this.metaGetAll(
			`https://graph.facebook.com/v21.0/${adAccountId}/insights`,
			{
				fields: 'campaign_id,adset_id,ad_id,spend,impressions,clicks,reach,frequency,cpc,cpm,ctr,actions,action_values,date_start',
				time_increment: 1,
				level: 'ad',
				date_preset: 'last_30d',
				limit: 500,
			},
			accessToken,
		);

		this.logger.log(`Daily stats (insights) fetched: ${insights.length}`);

		for (const insight of insights) {
			try {
				const actions = insight.actions || [];
				const actionValues = insight.action_values || [];

				const purchases = this.extractActionValue(actions, 'purchase');
				const purchaseValue = this.extractActionValue(actionValues, 'purchase');
				const addToCart = this.extractActionValue(actions, 'add_to_cart');
				const initiateCheckout = this.extractActionValue(actions, 'initiate_checkout');
				const linkClicks = this.extractActionValue(actions, 'link_click');

				const spend = parseFloat(insight.spend) || 0;
				const roas = spend > 0 ? purchaseValue / spend : 0;
				const costPerPurchase = purchases > 0 ? spend / purchases : 0;

				const existing = await this.dailyStatsRepo.findOne({
					where: {
						brandId,
						metaAdId: insight.ad_id,
						date: insight.date_start,
					},
				});

				const data = {
					brandId,
					metaCampaignId: insight.campaign_id,
					metaAdSetId: insight.adset_id,
					metaAdId: insight.ad_id,
					date: insight.date_start,
					spend,
					impressions: parseInt(insight.impressions) || 0,
					clicks: parseInt(insight.clicks) || 0,
					linkClicks,
					reach: parseInt(insight.reach) || 0,
					frequency: parseFloat(insight.frequency) || 0,
					cpc: parseFloat(insight.cpc) || 0,
					cpm: parseFloat(insight.cpm) || 0,
					ctr: parseFloat(insight.ctr) || 0,
					purchases,
					purchaseValue,
					addToCart,
					initiateCheckout,
					roas,
					costPerPurchase,
				};

				if (existing) {
					await this.dailyStatsRepo.update(existing.id, data);
					stats.updated++;
				} else {
					await this.dailyStatsRepo.save(this.dailyStatsRepo.create(data));
					stats.created++;
				}
				stats.synced++;
			} catch (error: any) {
				this.logger.error(`DailyStats sync error: ${error.message}`);
				stats.errors++;
			}
		}

		return stats;
	}

	// ==================== HELPERS ====================

	/**
	 * Meta actions array'dan specific action_type qiymatini olish
	 * Meta format: actions: [{ action_type: "purchase", value: "3" }, ...]
	 */
	private extractActionValue(actions: any[], actionType: string): number {
		if (!actions || !Array.isArray(actions)) return 0;
		const action = actions.find((a: any) => a.action_type === actionType);
		return action ? parseFloat(action.value) || 0 : 0;
	}

	/**
	 * Meta Graph API cursor-based pagination
	 * Barcha sahifalarni yig'ib bitta array qaytaradi
	 */
	private async metaGetAll(
		baseUrl: string,
		params: Record<string, any>,
		accessToken: string,
	): Promise<any[]> {
		const allData: any[] = [];
		let nextUrl: string | null = baseUrl;
		let isFirstRequest = true;

		while (nextUrl) {
			try {
				let response;

				if (isFirstRequest) {
					response = await this.httpService.axiosRef.get(nextUrl, {
						params: { ...params, access_token: accessToken },
						timeout: 30000,
					});
					isFirstRequest = false;
				} else {
					response = await this.httpService.axiosRef.get(nextUrl, {
						timeout: 30000,
					});
				}

				const data = response.data.data || [];
				allData.push(...data);

				nextUrl = response.data.paging?.next || null;

				if (nextUrl) {
					await new Promise((resolve) => setTimeout(resolve, 200));
				}
			} catch (error: any) {
				if (error.response?.status === 401 || error.response?.data?.error?.code === 190) {
					throw new UnauthorizedException(
						'Meta access token expired or invalid. Please reconnect Meta from Settings.',
					);
				}

				if (
					error.response?.status === 429 ||
					error.response?.data?.error?.code === 17 ||
					error.response?.data?.error?.code === 32
				) {
					this.logger.warn('Meta API rate limit hit. Waiting 60 seconds...');
					await new Promise((resolve) => setTimeout(resolve, 60000));
					continue;
				}

				const metaError = error.response?.data?.error;
				if (metaError) {
					throw new Error(
						`Meta API error: ${metaError.message} (code: ${metaError.code}, type: ${metaError.type})`,
					);
				}

				throw error;
			}
		}

		return allData;
	}
}
