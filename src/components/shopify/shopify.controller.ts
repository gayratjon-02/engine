import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';
import { GetProductsQueryDto } from 'src/libs/dto/shopify/get-products-query.dto';

@Controller('shopify')
export class ShopifyController {
	constructor(private readonly shopifyService: ShopifyService) {}

	@Get('getProducts/:brandId')
	@UseGuards(AuthGuard)
	async getProducts(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: GetProductsQueryDto,
	) {
		return this.shopifyService.getProducts(brandId, userId, query);
	}
}
