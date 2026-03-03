import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';

@Controller('integrations')
export class IntegrationsController {
	constructor(private readonly integrationsService: IntegrationsService) {}

	@Get('status/:brandId')
	@UseGuards(AuthGuard)
	async getStatus(@AuthMember('id') userId: string, @Param('brandId') brandId: string) {
		return this.integrationsService.getIntegrationStatus(brandId, userId);
	}
}
