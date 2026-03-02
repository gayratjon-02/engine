import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Brand } from './brand.entity';
import { DATE_PRESET } from 'src/libs/dto/enum/preference.enum';

@Entity('user_preferences')
@Unique(['userId', 'brandId'])
export class UserPreference {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	userId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column({ type: 'uuid' })
	brandId: string;

	@ManyToOne(() => Brand, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@Column({ type: 'jsonb', nullable: true, default: [] })
	pinnedMetrics: string[];

	@Column({ type: 'enum', enum: DATE_PRESET, default: DATE_PRESET.DAYS_30 })
	datePreset: DATE_PRESET;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
