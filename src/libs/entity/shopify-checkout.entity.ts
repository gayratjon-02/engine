import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Brand } from './brand.entity';

@Entity('shopify_checkouts')
@Index(['brandId', 'checkoutDate'])
export class ShopifyCheckout {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'bigint' })
	shopifyCheckoutId: number; // checkout.id

	@Column({ type: 'varchar', length: 255, nullable: true })
	customerEmail: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	totalPrice: number; // checkout.total_price

	@Column({ type: 'varchar', length: 50 })
	status: string; // 'open', 'complete', 'abandoned'
	// Abandonment = status !== 'complete'

	@Column({ type: 'timestamp' })
	checkoutDate: Date; // checkout.created_at

	@Column({ type: 'timestamp', nullable: true })
	completedAt: Date; // checkout.completed_at — null = abandoned

	@CreateDateColumn()
	createdAt: Date;
}
