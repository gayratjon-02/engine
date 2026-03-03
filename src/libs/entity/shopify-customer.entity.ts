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

@Entity('shopify_customers')
@Index(['brandId', 'shopifyCustomerId'], { unique: true })
@Index(['brandId', 'firstOrderDate']) // Cohort grouping uchun
export class ShopifyCustomer {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'bigint' })
	shopifyCustomerId: number; // customer.id

	@Column({ type: 'varchar', length: 255, nullable: true })
	email: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	firstName: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	lastName: string;

	@Column({ type: 'timestamp' })
	firstOrderDate: Date; // Cohort month shu sanadan olinadi

	@Column({ type: 'uuid', nullable: true })
	firstOrderId: string; // Birinchi order reference

	@Column({ type: 'bigint', nullable: true })
	firstProductId: number; // Birinchi sotib olgan mahsulot — Product LTV uchun

	@Column({ type: 'integer', default: 1 })
	totalOrders: number; // Jami buyurtmalar — returning customer = totalOrders > 1

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	totalSpent: number; // Jami xarajat — LTV hisoblashda ishlatiladi

	@Column({ type: 'timestamp', nullable: true })
	lastOrderDate: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
