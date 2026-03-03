import type { USER_ROLE } from 'src/libs/dto/enum/user.enum';

export interface UserResponse {
	id: string;
	email: string;
	name: string;
	avatarUrl: string | null;
	role: USER_ROLE;
	createdAt: Date;
	updatedAt: Date;
}

export interface GoogleProfile {
	googleId: string;
	email: string;
	name: string;
	avatarUrl?: string;
}
