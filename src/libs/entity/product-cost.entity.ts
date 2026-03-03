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

@Entity('product_costs')
@Index(['brandId', 'shopifyProductId'], { unique: true })
export class ProductCost {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'bigint' })
	shopifyProductId: number; // ShopifyProduct bilan matching

	@Column({ type: 'varchar', length: 100, nullable: true })
	sku: string; // Qo'shimcha matching uchun

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	cogs: number; // Cost of Goods Sold — ishlab chiqarish narxi per unit

	@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
	shippingCost: number; // Yetkazib berish narxi per unit

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
