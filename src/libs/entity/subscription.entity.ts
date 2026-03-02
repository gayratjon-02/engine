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
import { SUBSCRIPTION_PLAN, PLAN_STATUS } from 'src/libs/dto/enum/sub.plan';

@Entity('subscriptions')
export class Subscription {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', unique: true })
	userId: string;

	@OneToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column({ type: 'enum', enum: SUBSCRIPTION_PLAN, default: SUBSCRIPTION_PLAN.FREE })
	plan: SUBSCRIPTION_PLAN;

	@Column({ type: 'enum', enum: PLAN_STATUS, default: PLAN_STATUS.ACTIVE })
	status: PLAN_STATUS;

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
