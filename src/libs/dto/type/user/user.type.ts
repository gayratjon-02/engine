export interface UserResponse {
	id: string;
	email: string;
	name: string;
	avatarUrl: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface GoogleProfile {
	googleId: string;
	email: string;
	name: string;
	avatarUrl?: string;
}
