import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get(':brandId/overview')
	@UseGuards(AuthGuard)
	async getOverview(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Query() query: DashboardQueryDto,
	) {
		return this.dashboardService.getOverview(brandId, userId, query);
	}
}
