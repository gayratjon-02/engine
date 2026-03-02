import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from 'src/libs/entity/user-preference.entity';
import { Message } from 'src/libs/dto/enum/common.enum';
import { BrandService } from '../brand/brand.service';
import { UpdatePreferenceDto } from 'src/libs/dto/preference/update-preference.dto';

@Injectable()
export class PreferenceService {
	private readonly logger = new Logger(PreferenceService.name);

	constructor(
		@InjectRepository(UserPreference)
		private readonly prefRepo: Repository<UserPreference>,
		private readonly brandService: BrandService,
	) {}

	async getPreference(userId: string, brandId: string): Promise<UserPreference> {
		// Brand ownership tekshiruv
		await this.brandService.getBrand(userId, brandId);

		let pref = await this.prefRepo.findOne({
			where: { userId, brandId },
		});

		// Preference yo'q bo'lsa — default yaratib qaytaradi
		if (!pref) {
			pref = this.prefRepo.create({ userId, brandId } as Partial<UserPreference>);
			pref = await this.prefRepo.save(pref);
			this.logger.log(`Default preference created for user: ${userId}, brand: ${brandId}`);
		}

		return pref;
	}

	async updatePreference(userId: string, brandId: string, input: UpdatePreferenceDto): Promise<UserPreference> {
		const pref = await this.getPreference(userId, brandId);

		Object.assign(pref, input);

		const saved = await this.prefRepo.save(pref);
		this.logger.log(`Preference updated for user: ${userId}, brand: ${brandId}`);

		return saved;
	}
}
