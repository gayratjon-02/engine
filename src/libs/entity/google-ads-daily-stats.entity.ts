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

@Entity('google_ads_daily_stats')
@Index(['brandId', 'date'])
@Index(['brandId', 'googleAdId', 'date'], { unique: true })
@Index(['brandId', 'googleCampaignId', 'date'])
export class GoogleAdsDailyStats {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'varchar', length: 100 })
	googleCampaignId: string;

	@Column({ type: 'varchar', length: 100 })
	googleAdGroupId: string;

	@Column({ type: 'varchar', length: 100 })
	googleAdId: string;

	@Column({ type: 'date' })
	date: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	spend: number;

	@Column({ type: 'integer', default: 0 })
	impressions: number;

	@Column({ type: 'integer', default: 0 })
	clicks: number;

	@Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
	cpc: number;

	@Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
	cpm: number;

	@Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
	ctr: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	conversions: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	conversionsValue: number;

	@Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
	roas: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	costPerConversion: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
