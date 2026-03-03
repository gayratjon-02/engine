import { encrypt, decrypt } from 'src/libs/config/encryption.util';
import type { ValueTransformer } from 'typeorm';

function getEncryptionKey(): string {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) throw new Error('ENCRYPTION_KEY is not set in environment variables');
	return key;
}

export const tokenTransformer: ValueTransformer = {
	to: (value: string | null): string | null => {
		if (!value) return null;
		return encrypt(value, getEncryptionKey());
	},
	from: (value: string | null): string | null => {
		if (!value) return null;
		return decrypt(value, getEncryptionKey());
	},
};
