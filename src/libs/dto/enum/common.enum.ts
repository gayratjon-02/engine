export enum Message {
	// Common
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',

	// Auth
	AUTHENTICATION_REQUIRED = 'Authentication required',
	EMAIL_ALREADY_REGISTERED = 'Email already registered',
	INVALID_EMAIL_OR_PASSWORD = 'Invalid email or password',
	USER_NOT_FOUND = 'User not found',
	INSUFFICIENT_PLAN = 'Your current plan does not have access to this feature',
	INVALID_PLAN = 'Invalid plan',

	// Subscription
	SUBSCRIPTION_NOT_FOUND = 'Subscription not found',
	ALREADY_ON_PLAN = 'You are already on this plan',
	DOWNGRADE_NOT_ALLOWED = 'Downgrade through API is not supported, please cancel first',
	FREE_PLAN_CANNOT_BE_CANCELLED = 'Free plan cannot be cancelled',
	SUBSCRIPTION_ALREADY_CANCELLED = 'Subscription is already cancelled',
	CANNOT_UPGRADE_TO_FREE = 'Cannot upgrade to free plan',

	// Brand
	BRAND_NOT_FOUND = 'Brand not found!',
	BRAND_ALREADY_EXISTS = 'Brand with this name already exists!',
	BRAND_LIMIT_REACHED = 'Brand limit reached for your current plan!',
	BRAND_ALREADY_DELETED = 'Brand is already deleted!',

	// Preference
	PREFERENCE_NOT_FOUND = 'Preference not found!',
	INVALID_PINNED_METRIC = 'Invalid pinned metric!',

	// Integration
	BRAND_ACCESS_DENIED = 'You do not have access to this brand',
	PLATFORM_ALREADY_CONNECTED = 'This platform is already connected to this brand',
	SHOPIFY_DOMAIN_REQUIRED = 'Shop domain is required for Shopify connections',
	AD_ACCOUNT_ID_REQUIRED = 'Ad account ID is required for this platform',
	PLATFORM_NOT_CONNECTED = 'This platform is not connected to this brand',
	PLATFORM_ALREADY_DISCONNECTED = 'This platform is already disconnected',

	// Role
	FORBIDDEN_RESOURCE = 'You do not have permission to access this resource',
}
