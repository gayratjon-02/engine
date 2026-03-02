import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('brands')
export class Brand {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	userId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column({ type: 'varchar', length: 255 })
	name: string;

	@Column({ type: 'text', nullable: true })
	logoUrl: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	shopifyDomain: string;

	@Column({ type: 'varchar', length: 50, default: 'UTC' })
	timezone: string;

	@Column({ type: 'varchar', length: 3, default: 'USD' })
	currency: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
