import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 255, unique: true })
	email: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	@Exclude()
	passwordHash: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	name: string;

	@Column({ type: 'varchar', length: 255, nullable: true, unique: true })
	@Exclude()
	googleId: string;

	@Column({ type: 'text', nullable: true })
	avatarUrl: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
