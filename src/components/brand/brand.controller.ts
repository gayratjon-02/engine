import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { CreateBrandDto } from 'src/libs/dto/brand/create-brand.dto';
import { UpdateBrandDto } from 'src/libs/dto/brand/update-brand.dto';

@Controller('brand')
export class BrandController {
	constructor(private readonly brandService: BrandService) {}

	@Post('createBrand')
	@UseGuards(AuthGuard)
	async createBrand(@AuthMember('id') userId: string, @Body() input: CreateBrandDto) {
		console.log('POST: createBrand');
		return this.brandService.createBrand(userId, input);
	}

	@Get('getUserBrands')
	@UseGuards(AuthGuard)
	async getUserBrands(@AuthMember('id') userId: string) {
		console.log('GET: getUserBrands');
		return this.brandService.getUserBrands(userId);
	}

	@Get('getBrand/:id')
	@UseGuards(AuthGuard)
	async getBrand(@AuthMember('id') userId: string, @Param('id') brandId: string) {
		console.log('GET: getBrand');
		return this.brandService.getBrand(userId, brandId);
	}

	@Post('updateBrand/:id')
	@UseGuards(AuthGuard)
	async updateBrand(@AuthMember('id') userId: string, @Param('id') brandId: string, @Body() input: UpdateBrandDto) {
		console.log('POST: updateBrand');
		return this.brandService.updateBrand(userId, brandId, input);
	}
}
