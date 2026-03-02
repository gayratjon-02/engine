import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreference } from 'src/libs/entity/user-preference.entity';
import { PreferenceService } from './preference.service';
import { PreferenceController } from './preference.controller';
import { BrandModule } from '../brand/brand.module';

@Module({
	imports: [TypeOrmModule.forFeature([UserPreference]), BrandModule],
	controllers: [PreferenceController],
	providers: [PreferenceService],
	exports: [PreferenceService],
})
export class PreferenceModule {}
