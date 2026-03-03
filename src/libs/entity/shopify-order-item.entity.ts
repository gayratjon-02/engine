import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Brand } from './brand.entity';
import { ShopifyOrder } from './shopify-order.entity';

@Entity('shopify_order_items')
@Index(['brandId', 'shopifyProductId'])
export class ShopifyOrderItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	orderId: string;

	@ManyToOne(() => ShopifyOrder, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'orderId' })
	order: ShopifyOrder;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'bigint' })
	shopifyProductId: number; // line_item.product_id

	@Column({ type: 'bigint', nullable: true })
	shopifyVariantId: number; // line_item.variant_id

	@Column({ type: 'varchar', length: 255 })
	productTitle: string; // line_item.title

	@Column({ type: 'varchar', length: 255, nullable: true })
	variantTitle: string; // line_item.variant_title ("Large / Blue")

	@Column({ type: 'varchar', length: 100, nullable: true })
	sku: string; // line_item.sku — ProductCost bilan matching

	@Column({ type: 'integer' })
	quantity: number; // line_item.quantity — P&L: units sold

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	price: number; // line_item.price — bitta unit narxi

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	totalDiscount: number; // line_item.total_discount

	@CreateDateColumn()
	createdAt: Date;
}
