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

@Entity('meta_ad_creatives')
@Index(['brandId', 'metaAdId'], { unique: true })
export class MetaAdCreative {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	// === Meta Ad Identifiers ===

	@Column({ type: 'varchar', length: 100 })
	metaAdId: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	metaCreativeId: string;

	@Column({ type: 'varchar', length: 100 })
	metaCampaignId: string;

	@Column({ type: 'varchar', length: 100 })
	metaAdSetId: string;

	// === Ad Info ===

	@Column({ type: 'varchar', length: 500 })
	name: string;

	@Column({ type: 'varchar', length: 50 })
	status: string;

	// === Creative Content ===

	@Column({ type: 'text', nullable: true })
	headline: string;

	@Column({ type: 'text', nullable: true })
	body: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({ type: 'text', nullable: true })
	imageUrl: string;

	@Column({ type: 'text', nullable: true })
	videoUrl: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	videoId: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	callToAction: string;

	@Column({ type: 'text', nullable: true })
	destinationUrl: string;

	// === Creative Type ===

	@Column({ type: 'varchar', length: 50, nullable: true })
	format: string;

	// === AI Creative Analysis (PRO feature) ===

	@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
	aiScore: number;

	@Column({ type: 'text', nullable: true })
	aiInsight: string;

	@Column({ type: 'timestamp', nullable: true })
	aiScoredAt: Date;

	// === Static Engine Feedback Loop ===

	@Column({ type: 'varchar', length: 255, nullable: true })
	staticEngineGenerationId: string;

	// === Timestamps ===

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
