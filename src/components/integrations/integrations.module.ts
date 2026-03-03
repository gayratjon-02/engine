import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformConnection } from 'src/libs/entity/platform-connection.entity';
import { Brand } from 'src/libs/entity/brand.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { BrandModule } from 'src/components/brand/brand.module';

@Module({
	imports: [TypeOrmModule.forFeature([PlatformConnection, Brand]), BrandModule],
	controllers: [IntegrationsController],
	providers: [IntegrationsService],
	exports: [IntegrationsService],
})
export class IntegrationsModule {}
