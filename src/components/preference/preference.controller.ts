import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PreferenceService } from './preference.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { UpdatePreferenceDto } from 'src/libs/dto/preference/update-preference.dto';

@Controller('preferences')
export class PreferenceController {
	constructor(private readonly preferenceService: PreferenceService) {}

	@Get('getPreference/:brandId')
	@UseGuards(AuthGuard)
	async getPreference(@AuthMember('id') userId: string, @Param('brandId') brandId: string) {
		console.log('GET: getPreference');
		return this.preferenceService.getPreference(userId, brandId);
	}

	@Post('updatePreference/:brandId')
	@UseGuards(AuthGuard)
	async updatePreference(
		@AuthMember('id') userId: string,
		@Param('brandId') brandId: string,
		@Body() input: UpdatePreferenceDto,
	) {
		console.log('POST: updatePreference');
		return this.preferenceService.updatePreference(userId, brandId, input);
	}
}
