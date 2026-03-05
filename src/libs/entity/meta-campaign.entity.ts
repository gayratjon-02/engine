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

@Entity('meta_campaigns')
@Index(['brandId', 'metaCampaignId'], { unique: true })
export class MetaCampaign {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	// === Meta Original Data ===

	@Column({ type: 'varchar', length: 100 })
	metaCampaignId: string;

	@Column({ type: 'varchar', length: 500 })
	name: string;

	@Column({ type: 'varchar', length: 50 })
	status: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	objective: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	dailyBudget: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	lifetimeBudget: number;

	@Column({ type: 'varchar', length: 100, nullable: true })
	buyingType: string;

	@Column({ type: 'timestamp', nullable: true })
	startTime: Date;

	@Column({ type: 'timestamp', nullable: true })
	stopTime: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
