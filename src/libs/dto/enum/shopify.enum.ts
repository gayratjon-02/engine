export enum FINANCIAL_STATUS {
	PENDING = 'pending',
	AUTHORIZED = 'authorized',
	PARTIALLY_PAID = 'partially_paid',
	PAID = 'paid',
	PARTIALLY_REFUNDED = 'partially_refunded',
	REFUNDED = 'refunded',
	VOIDED = 'voided',
}

export enum FULFILLMENT_STATUS {
	UNFULFILLED = 'unfulfilled',
	PARTIAL = 'partial',
	FULFILLED = 'fulfilled',
	RESTOCKED = 'restocked',
}

export enum PRODUCT_STATUS {
	ACTIVE = 'active',
	ARCHIVED = 'archived',
	DRAFT = 'draft',
}

export enum CHECKOUT_STATUS {
	OPEN = 'open',
	COMPLETE = 'complete',
	ABANDONED = 'abandoned',
}

export enum REFUND_REASON {
	CUSTOMER = 'customer',
	DAMAGE = 'damage',
	RECEIVED_WRONG_ITEM = 'received_wrong_item',
	FRAUD = 'fraud',
	OTHER = 'other',
}
