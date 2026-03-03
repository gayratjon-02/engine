import { Controller, Get, Param, Query, Redirect, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ShopifyService } from './shopify.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';
import { GetProductsQueryDto } from 'src/libs/dto/shopify/get-products-query.dto';
import { GetOrdersQueryDto } from 'src/libs/dto/shopify/get-orders-query.dto';
import { GetCustomersQueryDto } from 'src/libs/dto/shopify/get-customers-query.dto';
import { GetRefundsQueryDto } from 'src/libs/dto/shopify/get-refunds-query.dto';
import { GetCheckoutsQueryDto } from 'src/libs/dto/shopify/get-checkouts-query.dto';

@Controller('shopify')
export class ShopifyController {
	constructor(private readonly shopifyService: ShopifyService) {}

	// ==================== SHOPIFY OAUTH ====================

	@Get(':brandId/auth')
	@UseGuards(AuthGuard)
	@Redirect()
	async auth(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query('shop') shop: string,
	) {
		return this.shopifyService.getAuthUrl(brandId, userId, shop);
	}

	@Get('callback')
	async callback(@Query() query: Record<string, string>, @Res() res: Response) {
		const redirectUrl = await this.shopifyService.handleCallback(query);
		return res.redirect(redirectUrl);
	}

	// ==================== DATA ENDPOINTS ====================

	@Get(':brandId/products')
	@UseGuards(AuthGuard)
	async getProducts(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetProductsQueryDto,
	) {
		return this.shopifyService.getProducts(brandId, userId, query);
	}

	@Get(':brandId/orders')
	@UseGuards(AuthGuard)
	async getOrders(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetOrdersQueryDto,
	) {
		return this.shopifyService.getOrders(brandId, userId, query);
	}

	@Get(':brandId/customers')
	@UseGuards(AuthGuard)
	async getCustomers(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetCustomersQueryDto,
	) {
		return this.shopifyService.getCustomers(brandId, userId, query);
	}

	@Get(':brandId/refunds')
	@UseGuards(AuthGuard)
	async getRefunds(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetRefundsQueryDto,
	) {
		return this.shopifyService.getRefunds(brandId, userId, query);
	}

	@Get(':brandId/checkouts')
	@UseGuards(AuthGuard)
	async getCheckouts(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetCheckoutsQueryDto,
	) {
		return this.shopifyService.getCheckouts(brandId, userId, query);
	}
}
