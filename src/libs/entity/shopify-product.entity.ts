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

@Entity('shopify_products')
@Index(['brandId', 'shopifyProductId'], { unique: true })
export class ShopifyProduct {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'bigint' })
	shopifyProductId: number; // product.id

	@Column({ type: 'varchar', length: 255 })
	title: string; // product.title

	@Column({ type: 'varchar', length: 255, nullable: true })
	productType: string; // product.product_type — kategorizatsiya

	@Column({ type: 'varchar', length: 255, nullable: true })
	vendor: string; // product.vendor

	@Column({ type: 'text', nullable: true })
	imageUrl: string; // product.image.src — P&L jadvalda ko'rsatish uchun

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	price: number; // Asosiy variant narxi — product.variants[0].price

	@Column({ type: 'varchar', length: 100, nullable: true })
	sku: string; // Asosiy variant SKU — product.variants[0].sku

	@Column({ type: 'varchar', length: 50, default: 'active' })
	status: string; // product.status: active, archived, draft

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
