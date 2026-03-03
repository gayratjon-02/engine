import type { PLATFORM, CONNECTION_STATUS } from 'src/libs/dto/enum/platform.enum';

export interface IntegrationStatusResponse {
	platform: PLATFORM;
	status: CONNECTION_STATUS;
	externalAccountName: string | null;
	shopDomain: string | null;
	adAccountId: string | null;
	lastSyncedAt: Date | null;
	lastSyncError: string | null;
	connectedAt: Date;
}

export interface AllIntegrationsResponse {
	connectedCount: number;
	integrations: IntegrationStatusResponse[];
}
