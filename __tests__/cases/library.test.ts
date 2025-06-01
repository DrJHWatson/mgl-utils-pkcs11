import { EPKCSMechanism } from '@/LowLevel/LibEnums';
import { ESessionInfoFlag } from '@/LowLevel/LibTypes';
import { PKCS11Lib } from '@/LowLevel/PKCS11Lib';
import path from 'path';

describe('library mapping', () => {
	let lib: PKCS11Lib;
	function findToken() {
		const ADMIN_PIN = '98765432';
		const USER_PIN = '1111';
		const testTokenSN = /34b37163/;

		const slots = lib.C_GetSlotList();
		const filtered = slots
			.map((slotId) => {
				const slot = lib.C_GetSlotInfo(slotId);
				return { ...slot, slotId };
			})
			.filter((slot) => slot.isPresent);

		expect(filtered.length).toBe(1);

		const token = filtered
			.map(({ slotId }) => ({ ...lib.C_GetTokenInfo(slotId), slotId }))
			.find((token) => token.serialNumber.match(testTokenSN));

		return {
			token,
			adminPin: ADMIN_PIN,
			userPin: USER_PIN,
		};
	}

	beforeEach(() => {
		lib = new PKCS11Lib(path.join(__dirname, '../bin/rtpkcs11ecp.dll'));

		lib.C_Initialize();
	});

	afterEach(() => {
		lib.C_Finalize();
	});

	test('library loaded', () => {
		expect(lib).toBeDefined();
	});

	test('library info', () => {
		const info = lib.C_GetInfo();

		expect(info.libraryDescription.trim()).toBe(
			'Rutoken ECP PKCS #11 library',
		);
		expect(info.manufacturerID.trim()).toBe('Aktiv Co.');
		expect(info.cryptokiVersion.major).toBe(2);
		expect(info.cryptokiVersion.minor).toBe(40);
		expect(info.libraryVersion.major).toBe(2);
		expect(info.libraryVersion.minor).toBe(17);
	});

	test('slots', () => {
		const slots = lib.C_GetSlotList();

		slots.forEach((slotId) => {
			const slot = lib.C_GetSlotInfo(slotId);

			expect(slot).toHaveProperty('firmwareVersion');
			expect(slot).toHaveProperty('flags');
			expect(slot).toHaveProperty('hardwareVersion');
			expect(slot).toHaveProperty('manufacturerID');
			expect(slot).toHaveProperty('slotDescription');
		});
	});

	test('have single testing device', () => {
		const { token } = findToken();
		expect(token.label).toBe('test');
	});

	test('mechanisms', () => {
		const { token } = findToken();
		const mechanisms = lib.C_GetMechanismList(token.slotId);

		expect(mechanisms.length).toBeGreaterThan(0);

		const infos = mechanisms.map((mechanismId) => {
			const info = {
				...lib.C_GetMechanismInfo(token.slotId, mechanismId),
				slotId: token.slotId,
				mechanismId,
				text: Object.keys(EPKCSMechanism).find(
					(name) => mechanismId === EPKCSMechanism[name],
				),
			};

			expect(info.text).toBeTruthy();

			return info;
		});
		expect(infos.length).toBeGreaterThan(0);
	});

	test('init token', () => {
		const { token, adminPin } = findToken();
		if (token) {
			lib.C_InitToken(token.slotId, adminPin, 'test1');
			const info1 = lib.C_GetTokenInfo(token.slotId);
			expect(info1.label).toBe('test1');

			lib.C_InitToken(token.slotId, adminPin, 'test');
			const info = lib.C_GetTokenInfo(token.slotId);
			expect(info.label).toBe('test');
		}
	});

	test('open and close session', () => {
		const { token } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION,
		);
		expect(lib.C_GetTokenInfo(token.slotId).ulSessionCount).toBe(
			token.ulSessionCount + 1,
		);
		lib.C_CloseSession(session);
		expect(lib.C_GetTokenInfo(token.slotId).ulSessionCount).toBe(
			token.ulSessionCount,
		);
	});

	test('open and close all sessions', () => {
		const { token } = findToken();
		lib.C_OpenSession(token.slotId, ESessionInfoFlag.CKF_SERIAL_SESSION);
		lib.C_OpenSession(token.slotId, ESessionInfoFlag.CKF_SERIAL_SESSION);
		expect(lib.C_GetTokenInfo(token.slotId).ulSessionCount).toBe(
			token.ulSessionCount + 2,
		);
		lib.C_CloseAllSessions(token.slotId);
		expect(lib.C_GetTokenInfo(token.slotId).ulSessionCount).toBe(
			token.ulSessionCount,
		);
	});
});
