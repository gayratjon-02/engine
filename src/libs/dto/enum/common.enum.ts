export enum Message {
	// Common
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',

	// Auth
	EMAIL_ALREADY_REGISTERED = 'Email already registered',
	INVALID_EMAIL_OR_PASSWORD = 'Invalid email or password',
	USER_NOT_FOUND = 'User not found',

	// Subscription
	SUBSCRIPTION_NOT_FOUND = 'Subscription not found',
	ALREADY_ON_PLAN = 'You are already on this plan',
	DOWNGRADE_NOT_ALLOWED = 'Downgrade through API is not supported, please cancel first',

	// Brand
	BRAND_NOT_FOUND = 'Brand not found!',
	BRAND_ALREADY_EXISTS = 'Brand with this name already exists!',
	BRAND_LIMIT_REACHED = 'Brand limit reached for your current plan!',
}
