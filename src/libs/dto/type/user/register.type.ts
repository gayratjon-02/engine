import type { USER_ROLE } from 'src/libs/dto/enum/user.enum';

export interface AuthResponse {
	accessToken: string;
	user: {
		id: string;
		email: string;
		name: string;
		avatarUrl: string | null;
		role: USER_ROLE;
	};
}
