import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { Brand } from './brand.entity';

@Entity('google_ads_ads')
@Index(['brandId', 'googleAdId'], { unique: true })
export class GoogleAdsAd {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'varchar', length: 100 })
	googleAdId: string;

	@Column({ type: 'varchar', length: 100 })
	googleAdGroupId: string;

	@Column({ type: 'varchar', length: 100 })
	googleCampaignId: string;

	@Column({ type: 'varchar', length: 500, nullable: true })
	name: string;

	@Column({ type: 'varchar', length: 50 })
	status: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	adType: string;

	@Column({ type: 'jsonb', nullable: true })
	headlines: any;

	@Column({ type: 'jsonb', nullable: true })
	descriptions: any;

	@Column({ type: 'jsonb', nullable: true })
	finalUrls: any;

	@Column({ type: 'text', nullable: true })
	displayUrl: string;

	@Column({ type: 'text', nullable: true })
	imageUrl: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
