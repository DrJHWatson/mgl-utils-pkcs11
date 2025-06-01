import { PKCS11 } from '@/index';
import path from 'path';

describe('common PKCS11 class', () => {
	test('find token', () => {
		const pkcs = new PKCS11(path.join(__dirname, '../bin/rtpkcs11ecp.dll'));

		const tokens = pkcs.findToken({
			label: /test/,
		});

		expect(tokens[0]?.label).toBe('test');
	});
});
