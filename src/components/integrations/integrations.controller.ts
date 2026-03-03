import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from 'src/components/auth/guards/auth.guard';
import { AuthMember } from 'src/components/auth/decorators/authMember.decorator';
import { ConnectPlatformDto } from 'src/libs/dto/integration/connect-platform.dto';
import { DisconnectPlatformDto } from 'src/libs/dto/integration/disconnect-platform.dto';

@Controller('integrations')
export class IntegrationsController {
	constructor(private readonly integrationsService: IntegrationsService) {}

	@Get('status/:brandId')
	@UseGuards(AuthGuard)
	async getStatus(@AuthMember('id') userId: string, @Param('brandId') brandId: string) {
		return this.integrationsService.getIntegrationStatus(brandId, userId);
	}

	@Post('connect/:brandId')
	@UseGuards(AuthGuard)
	async connect(@AuthMember('id') userId: string, @Param('brandId') brandId: string, @Body() input: ConnectPlatformDto) {
		return this.integrationsService.connectPlatform(brandId, userId, input);
	}

	@Post('disconnect/:brandId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async disconnect(@AuthMember('id') userId: string, @Param('brandId') brandId: string, @Body() input: DisconnectPlatformDto) {
		return this.integrationsService.disconnectPlatform(brandId, userId, input);
	}
}
