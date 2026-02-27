import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	private readonly logger = new Logger(GoogleStrategy.name);

	constructor(config: ConfigService) {
		const clientID = config.getOrThrow<string>('GOOGLE_CLIENT_ID');
		const clientSecret = config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
		const callbackURL = config.getOrThrow<string>('GOOGLE_CALLBACK_URL');

		super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });
	}

	async validate(_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback) {
		const email = profile.emails?.[0]?.value;
		if (!email) {
			this.logger.warn(`Google profile without email: ${profile.id}`);
			return done(new Error('Google account has no email'), false);
		}

		done(null, {
			googleId: profile.id,
			email,
			name: profile.displayName,
			avatarUrl: profile.photos?.[0]?.value || null,
		});
	}
}
