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

@Entity('google_ads_ad_groups')
@Index(['brandId', 'googleAdGroupId'], { unique: true })
export class GoogleAdsAdGroup {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'varchar', length: 100 })
	googleAdGroupId: string;

	@Column({ type: 'varchar', length: 100 })
	googleCampaignId: string;

	@Column({ type: 'varchar', length: 500 })
	name: string;

	@Column({ type: 'varchar', length: 50 })
	status: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	adGroupType: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	cpcBid: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
