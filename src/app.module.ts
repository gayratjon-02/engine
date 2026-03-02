import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComponentsModule } from './components/components.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				host: config.getOrThrow('DB_HOST'),
				port: config.getOrThrow<number>('DB_PORT'),
				username: config.getOrThrow('DB_USERNAME'),
				password: config.getOrThrow('DB_PASSWORD'),
				database: config.getOrThrow('DB_DATABASE'),
				autoLoadEntities: true,
				synchronize: true, // Dev only — production'da false qilamiz
			}),
		}),
		ComponentsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
