export enum Message {
	// Auth
	EMAIL_ALREADY_REGISTERED = 'Email already registered',
	INVALID_EMAIL_OR_PASSWORD = 'Invalid email or password',
	USER_NOT_FOUND = 'User not found',

	// Subscription
	SUBSCRIPTION_NOT_FOUND = 'Subscription not found',
	ALREADY_ON_PLAN = 'You are already on this plan',
	DOWNGRADE_NOT_ALLOWED = 'Downgrade through API is not supported, please cancel first',
}
