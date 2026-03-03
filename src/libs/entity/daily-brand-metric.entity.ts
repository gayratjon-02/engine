import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Brand } from './brand.entity';

@Entity('daily_brand_metrics')
@Index(['brandId', 'date'], { unique: true })
export class DailyBrandMetric {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'date' })
	date: Date;

	// --- Shopify data ---

	@Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
	totalRevenue: number; // SUM(shopify_orders.totalPrice)

	@Column({ type: 'integer', default: 0 })
	totalOrders: number;

	@Column({ type: 'integer', default: 0 })
	totalSessions: number; // Shopify analytics dan

	@Column({ type: 'integer', default: 0 })
	newCustomers: number; // COUNT(WHERE isNewCustomer=true)

	@Column({ type: 'integer', default: 0 })
	returningCustomers: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	totalRefunds: number; // SUM(refund.amount)

	// --- Ad spend (barcha kanallar) ---

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	totalAdSpend: number; // meta + google + tiktok

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	metaSpend: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	metaRevenue: number; // Meta attributed (platform-specific ROAS uchun)

	@Column({ type: 'integer', default: 0 })
	metaPurchases: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	googleSpend: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	googleRevenue: number;

	@Column({ type: 'integer', default: 0 })
	googleConversions: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	tiktokSpend: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	tiktokRevenue: number;

	@Column({ type: 'integer', default: 0 })
	tiktokConversions: number;

	// --- Revenue by Channel ---

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	paidRevenue: number; // UTM attribution → paid

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	emailRevenue: number; // UTM source = klaviyo, mailchimp

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	organicRevenue: number; // UTM medium = organic

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	directRevenue: number; // No referrer

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	unattributedRevenue: number; // UTM null — iOS privacy gaps

	// --- Calculated metrics (nightly job) ---

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	avgOrderValue: number; // totalRevenue / totalOrders

	@Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
	conversionRate: number; // totalOrders / totalSessions

	@Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
	blendedRoas: number; // totalRevenue / totalAdSpend (MER)

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	blendedCpa: number; // totalAdSpend / totalOrders

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	ncac: number; // totalAdSpend / newCustomers

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	newCustomerRoas: number; // SUM(new customer revenue) / totalAdSpend

	@Column({ type: 'timestamp' })
	computedAt: Date;

	@CreateDateColumn()
	createdAt: Date;
}
