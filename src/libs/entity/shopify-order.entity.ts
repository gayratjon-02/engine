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

@Entity('shopify_orders')
@Index(['brandId', 'orderDate'])
@Index(['brandId', 'isNewCustomer'])
@Index(['brandId', 'shopifyOrderId'], { unique: true })
export class ShopifyOrder {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'bigint' })
	shopifyOrderId: number; // order.id — unique per brand

	@Column({ type: 'varchar', length: 50 })
	orderNumber: string; // order.order_number — #1001

	@Column({ type: 'bigint', nullable: true })
	customerId: number; // order.customer.id — nullable (guest checkout)

	@Column({ type: 'varchar', length: 255, nullable: true })
	customerEmail: string; // order.email

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	totalPrice: number; // order.total_price — Revenue = SUM(totalPrice)

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	subtotalPrice: number; // order.subtotal_price

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	totalDiscounts: number; // order.total_discounts

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	totalShipping: number; // SUM(order.shipping_lines[].price)

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	totalTax: number; // order.total_tax

	@Column({ type: 'varchar', length: 50 })
	financialStatus: string; // order.financial_status (paid, refunded, etc.)

	@Column({ type: 'varchar', length: 50, nullable: true })
	fulfillmentStatus: string; // order.fulfillment_status — nullable

	// --- Attribution (Revenue by Channel) ---
	// Hammasi nullable — null = "Unattributed" (iOS privacy, direct traffic)

	@Column({ type: 'varchar', length: 50, nullable: true })
	sourceName: string; // order.source_name ('web', 'pos')

	@Column({ type: 'text', nullable: true })
	referringSite: string; // order.referring_site

	@Column({ type: 'text', nullable: true })
	landingSite: string; // order.landing_site (UTM bilan)

	@Column({ type: 'varchar', length: 255, nullable: true })
	utmSource: string; // 'facebook', 'google', 'tiktok', 'klaviyo', null

	@Column({ type: 'varchar', length: 255, nullable: true })
	utmMedium: string; // 'cpc', 'paid_social', 'email', 'organic', null

	@Column({ type: 'varchar', length: 255, nullable: true })
	utmCampaign: string; // Campaign nomi

	// --- Customer Classification ---

	@Column({ type: 'boolean', default: false })
	isNewCustomer: boolean; // customer.orders_count===1 → nCAC, New Customer ROAS

	@Column({ type: 'boolean', default: false })
	hasDiscount: boolean; // discount_codes array bo'sh emas

	@Column({ type: 'varchar', length: 500, nullable: true })
	discountCodes: string; // "WELCOME10,FREESHIP"

	// --- Timestamps ---

	@Column({ type: 'timestamp' })
	orderDate: Date; // order.created_at — date range filter

	@Column({ type: 'timestamp' })
	syncedAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
