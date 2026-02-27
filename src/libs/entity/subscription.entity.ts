import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToOne,
	JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './user.entity';

@Entity('subscriptions')
export class Subscription {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	userId: string;

	@OneToOne(() => User)
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column({ type: 'varchar', length: 20, default: 'free' })
	plan: string; // free | pro | agency

	@Column({ type: 'varchar', length: 20, default: 'active' })
	status: string; // active | cancelled | past_due

	@Column({ type: 'varchar', length: 255, nullable: true })
	@Exclude()
	stripeCustomerId: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	@Exclude()
	stripeSubscriptionId: string;

	@Column({ type: 'timestamp', nullable: true })
	currentPeriodStart: Date;

	@Column({ type: 'timestamp', nullable: true })
	currentPeriodEnd: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
