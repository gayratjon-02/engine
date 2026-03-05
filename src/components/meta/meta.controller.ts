import { Controller, Get, HttpCode, Param, Post, Query, Redirect, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { MetaService } from './meta.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';
import { GetCampaignsQueryDto } from 'src/libs/dto/meta/get-campaigns-query.dto';
import { GetAdSetsQueryDto } from 'src/libs/dto/meta/get-adsets-query.dto';
import { GetCreativesQueryDto } from 'src/libs/dto/meta/get-creatives-query.dto';
import { GetStatsQueryDto } from 'src/libs/dto/meta/get-stats-query.dto';

@Controller('meta')
export class MetaController {
	constructor(private readonly metaService: MetaService) { }

	// ==================== META OAUTH ====================

	@Get(':brandId/auth')
	@UseGuards(AuthGuard)
	@Redirect()
	async auth(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
	) {
		return this.metaService.getAuthUrl(brandId, userId);
	}

	@Get('callback')
	async callback(@Query() query: Record<string, string>, @Res() res: Response) {
		const redirectUrl = await this.metaService.handleCallback(query);
		return res.redirect(redirectUrl);
	}

	// ==================== META DATA ====================

	@Get(':brandId/campaigns')
	@UseGuards(AuthGuard)
	async getCampaigns(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetCampaignsQueryDto,
	) {
		return this.metaService.getCampaigns(brandId, userId, query);
	}

	@Get(':brandId/adsets')
	@UseGuards(AuthGuard)
	async getAdSets(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetAdSetsQueryDto,
	) {
		return this.metaService.getAdSets(brandId, userId, query);
	}

	@Get(':brandId/creatives')
	@UseGuards(AuthGuard)
	async getCreatives(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetCreativesQueryDto,
	) {
		return this.metaService.getCreatives(brandId, userId, query);
	}

	@Get(':brandId/stats')
	@UseGuards(AuthGuard)
	async getStats(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetStatsQueryDto,
	) {
		return this.metaService.getStats(brandId, userId, query);
	}

	// ==================== META SYNC ====================

	@Post(':brandId/sync')
	@UseGuards(AuthGuard)
	@HttpCode(200)
	async syncMeta(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
	) {
		return this.metaService.syncMetaData(brandId, userId);
	}
}
