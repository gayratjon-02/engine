import { Controller, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PnlService } from './pnl.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';
import { UpdateCostsDto } from './dto/update-costs.dto';

@Controller('pnl')
export class PnlController {
	constructor(private readonly pnlService: PnlService) {}

	@Post(':brandId/costs')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async updateCosts(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Body() dto: UpdateCostsDto,
	) {
		return this.pnlService.updateCosts(brandId, userId, dto);
	}
}
