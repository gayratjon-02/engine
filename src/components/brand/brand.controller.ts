import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { CreateBrandDto } from 'src/libs/dto/brand/create-brand.dto';

@Controller('brand')
export class BrandController {
	constructor(private readonly brandService: BrandService) {}

	@Post('createBrand')
	@UseGuards(AuthGuard)
	async createBrand(@AuthMember('id') userId: string, @Body() input: CreateBrandDto) {
		console.log('POST: createBrand');
		return this.brandService.createBrand(userId, input);
	}
}
