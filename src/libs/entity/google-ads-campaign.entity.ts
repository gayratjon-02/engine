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

@Entity('google_ads_campaigns')
@Index(['brandId', 'googleCampaignId'], { unique: true })
export class GoogleAdsCampaign {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'varchar', length: 100 })
	googleCampaignId: string;

	@Column({ type: 'varchar', length: 500 })
	name: string;

	@Column({ type: 'varchar', length: 50 })
	status: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	campaignType: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	dailyBudget: number;

	@Column({ type: 'varchar', length: 100, nullable: true })
	biddingStrategy: string;

	@Column({ type: 'varchar', length: 50, nullable: true })
	startDate: string;

	@Column({ type: 'varchar', length: 50, nullable: true })
	endDate: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
