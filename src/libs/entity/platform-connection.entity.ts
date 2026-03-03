import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Brand } from './brand.entity';
import { PLATFORM_TYPE, CONNECTION_STATUS } from 'src/libs/dto/enum/platform.enum';

@Entity('platform_connections')
export class PlatformConnection {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'enum', enum: PLATFORM_TYPE })
	platform: PLATFORM_TYPE;

	@Column({ type: 'text' })
	@Exclude()
	accessToken: string; // ENCRYPTED — AES-256

	@Column({ type: 'text', nullable: true })
	@Exclude()
	refreshToken: string; // ENCRYPTED

	@Column({ type: 'varchar', length: 255, nullable: true })
	shopDomain: string; // Shopify: mystore.myshopify.com

	@Column({ type: 'varchar', length: 255, nullable: true })
	adAccountId: string; // Meta/Google/TikTok ad account ID

	@Column({ type: 'varchar', length: 255, nullable: true })
	externalAccountName: string; // Tashqi account nomi (ko'rsatish uchun)

	@Column({ type: 'timestamp', nullable: true })
	tokenExpiresAt: Date;

	@Column({ type: 'enum', enum: CONNECTION_STATUS, default: CONNECTION_STATUS.ACTIVE })
	status: CONNECTION_STATUS;

	@Column({ type: 'timestamp', nullable: true })
	lastSyncedAt: Date;

	@Column({ type: 'text', nullable: true })
	lastSyncError: string; // Oxirgi xatolik xabari

	@Column({ type: 'jsonb', nullable: true })
	metadata: Record<string, any>; // Platform-specific qo'shimcha ma'lumotlar

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
