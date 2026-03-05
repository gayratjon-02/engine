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

@Entity('meta_ad_daily_stats')
@Index(['brandId', 'date'])
@Index(['brandId', 'metaAdId', 'date'], { unique: true })
@Index(['brandId', 'metaCampaignId', 'date'])
export class MetaAdDailyStats {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	// === Identifiers ===

	@Column({ type: 'varchar', length: 100 })
	metaCampaignId: string;

	@Column({ type: 'varchar', length: 100 })
	metaAdSetId: string;

	@Column({ type: 'varchar', length: 100 })
	metaAdId: string;

	@Column({ type: 'date' })
	date: string;

	// === Core Metrics ===

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	spend: number;

	@Column({ type: 'integer', default: 0 })
	impressions: number;

	@Column({ type: 'integer', default: 0 })
	clicks: number;

	@Column({ type: 'integer', default: 0 })
	linkClicks: number;

	@Column({ type: 'integer', default: 0 })
	reach: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	frequency: number;

	// === Cost Metrics ===

	@Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
	cpc: number;

	@Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
	cpm: number;

	@Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
	ctr: number;

	// === Conversion Metrics ===

	@Column({ type: 'integer', default: 0 })
	purchases: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	purchaseValue: number;

	@Column({ type: 'integer', default: 0 })
	addToCart: number;

	@Column({ type: 'integer', default: 0 })
	initiateCheckout: number;

	// === Calculated ROAS ===

	@Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
	roas: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	costPerPurchase: number;

	// === Timestamps ===

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
