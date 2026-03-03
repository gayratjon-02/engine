import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Brand } from './brand.entity';
import { ShopifyOrder } from './shopify-order.entity';

@Entity('shopify_refunds')
@Index(['brandId', 'refundDate'])
export class ShopifyRefund {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'uuid' })
	orderId: string;

	@ManyToOne(() => ShopifyOrder, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'orderId' })
	order: ShopifyOrder;

	@Column({ type: 'bigint' })
	shopifyRefundId: number; // refund.id — Shopify original

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	amount: number; // refund.transactions[].amount yig'indisi

	@Column({ type: 'varchar', length: 50, nullable: true })
	reason: string; // customer, damage, received_wrong_item, fraud, other

	@Column({ type: 'text', nullable: true })
	note: string; // refund.note

	@Column({ type: 'timestamp' })
	refundDate: Date; // refund.created_at

	@Column({ type: 'jsonb', nullable: true })
	refundLineItems: any[]; // Qaysi productlar qaytarilgan — [{productId, quantity, amount}]

	@CreateDateColumn()
	createdAt: Date;
}
