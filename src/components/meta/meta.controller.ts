import { Controller, Get, HttpCode, Param, Post, Query, Redirect, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { MetaService } from './meta.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';

@Controller('meta')
export class MetaController {
	constructor(private readonly metaService: MetaService) {}

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
