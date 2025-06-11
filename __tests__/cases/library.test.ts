import {
	EAttributeType,
	EKeyConsumer,
	EKeyType,
	EObjectClass,
	EPKCSMechanism,
	ESessionState,
	EUserType,
} from '@/LowLevel/LibEnums';
import { ESessionInfoFlag } from '@/LowLevel/LibTypes';
import { PKCS11Lib } from '@/LowLevel/PKCS11Lib';
import { makeKeyTemplate, ulongToNumber } from '@/LowLevel/Utils';
import path from 'path';
import { alloc } from 'ref-napi';

describe('library mapping', () => {
	let lib: PKCS11Lib;
	function findToken() {
		const ADMIN_PIN = '98765432';
		const USER_PIN = '11111111';
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
		//console.log(infos);
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

	test('init pin', () => {
		const { token, userPin, adminPin } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			// изменить PIN на тестовый. если нет исключений, то всё корректно
			lib.C_Login(session, EUserType.CKU_SO, adminPin);
			try {
				lib.C_InitPIN(session, '12345678');
			} finally {
				lib.C_Logout(session);
			}
			// проверка PIN. если нет исключений, то всё корректно
			lib.C_Login(session, EUserType.CKU_USER, '12345678');
			lib.C_Logout(session);
			// изменить PIN на основной. если нет исключений, то всё корректно
			lib.C_Login(session, EUserType.CKU_SO, adminPin);
			try {
				lib.C_InitPIN(session, userPin);
			} finally {
				lib.C_Logout(session);
			}
			// проверка PIN. если нет исключений, то всё корректно
			lib.C_Login(session, EUserType.CKU_USER, userPin);
			lib.C_Logout(session);
		} finally {
			lib.C_CloseSession(session);
		}
	});

	test('set pin', () => {
		const { token, userPin } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			// изменить PIN на тестовый. если нет исключений, то всё корректно
			lib.C_Login(session, EUserType.CKU_USER, userPin);
			try {
				lib.C_SetPIN(session, userPin, '12345678');
			} finally {
				lib.C_Logout(session);
			}
			// изменить PIN на основной. если нет исключений, то всё корректно
			lib.C_Login(session, EUserType.CKU_USER, '12345678');
			try {
				lib.C_SetPIN(session, '12345678', userPin);
			} finally {
				lib.C_Logout(session);
			}
			// проверка PIN. если нет исключений, то всё корректно
			lib.C_Login(session, EUserType.CKU_USER, userPin);
			lib.C_Logout(session);
		} finally {
			lib.C_CloseSession(session);
		}
	});

	test('session info', () => {
		const { token } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			const info = lib.C_GetSessionInfo(session);
			expect(info.flags).toBe(
				ESessionInfoFlag.CKF_SERIAL_SESSION +
					ESessionInfoFlag.CKF_RW_SESSION,
			);
			expect(info.slotID).toBe(token.slotId);
			expect(info.state).toBe(ESessionState.CKS_RW_PUBLIC_SESSION);
		} finally {
			lib.C_CloseSession(session);
		}
	});

	test('function list is not allowed', () => {
		try {
			lib.C_GetFunctionList();
			expect('').toBe('C_GetFunctionList without error');
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			expect('C_GetFunctionList throws error').toBe(
				'C_GetFunctionList throws error',
			);
		}
	});

	test('wait for slot event', () => {
		// трудно проверить в автоматическом режиме
		// хотя бы чтоб не было ошибок и блокировки
		const slotId = lib.C_WaitForSlotEvent(true);
		expect(slotId).toBe(-1);
	});

	test('create and destroy object', () => {
		const { token } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			const objectId = lib.C_CreateObject(session, [
				{
					type: EAttributeType.CKA_CLASS,
					value: alloc('ulong', EObjectClass.CKO_DATA),
				},
				{
					type: EAttributeType.CKA_TOKEN,
					value: Buffer.from([0]),
				},
				{
					type: EAttributeType.CKA_PRIVATE,
					value: Buffer.from([0]),
				},
				{
					type: EAttributeType.CKA_LABEL,
					value: Buffer.from('APP'),
				},
			]);
			try {
				lib.C_FindObjectsInit(session, [
					{
						type: EAttributeType.CKA_CLASS,
						value: alloc('ulong', EObjectClass.CKO_DATA),
					},
					{
						type: EAttributeType.CKA_LABEL,
						value: Buffer.from('APP'),
					},
				]);
				const ids = lib.C_FindObjects(session);
				lib.C_FindObjectsFinal(session);
				expect(ids[0]).toBe(objectId);
			} finally {
				lib.C_DestroyObject(session, objectId);
			}
		} finally {
			lib.C_CloseSession(session);
		}
	});

	test('object attributes', () => {
		const { token } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			const objectId = lib.C_CreateObject(session, [
				{
					type: EAttributeType.CKA_CLASS,
					value: alloc('ulong', EObjectClass.CKO_DATA),
				},
				{
					type: EAttributeType.CKA_TOKEN,
					value: Buffer.from([0]),
				},
				{
					type: EAttributeType.CKA_PRIVATE,
					value: Buffer.from([0]),
				},
				{
					type: EAttributeType.CKA_LABEL,
					value: Buffer.from('APP'),
				},
			]);
			try {
				const att1 = lib.C_GetAttributeValue(session, objectId, [
					{
						type: EAttributeType.CKA_LABEL,
						value: Buffer.alloc(100),
					},
				]);
				expect(att1[0].value.toString()).toBe('APP');
				lib.C_SetAttributeValue(session, objectId, [
					{
						type: EAttributeType.CKA_LABEL,
						value: Buffer.from('test1'),
					},
				]);
				const att2 = lib.C_GetAttributeValue(session, objectId, [
					{
						type: EAttributeType.CKA_LABEL,
						value: Buffer.alloc(100),
					},
				]);
				expect(att2[0].value.toString()).toBe('test1');
			} finally {
				lib.C_DestroyObject(session, objectId);
			}
		} finally {
			lib.C_CloseSession(session);
		}
	});

	test('rutoken does not support', () => {
		const { token } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			const objectId = lib.C_CreateObject(session, [
				{
					type: EAttributeType.CKA_CLASS,
					value: alloc('ulong', EObjectClass.CKO_DATA),
				},
				{
					type: EAttributeType.CKA_TOKEN,
					value: Buffer.from([0]),
				},
				{
					type: EAttributeType.CKA_PRIVATE,
					value: Buffer.from([0]),
				},
				{
					type: EAttributeType.CKA_LABEL,
					value: Buffer.from('APP'),
				},
			]);
			try {
				// rutoken не поддерживает методы C_GetObjectSize, C_CopyObject, проверить наличие исключений
				try {
					lib.C_GetObjectSize(session, objectId);
				} catch (e: any) {
					expect(e?.errorCode).toBe('CKR_FUNCTION_NOT_SUPPORTED');
				}
				try {
					const copyId = lib.C_CopyObject(session, objectId, [
						{
							type: EAttributeType.CKA_LABEL,
							value: Buffer.from('test'),
						},
					]);
					lib.C_DestroyObject(session, copyId);
				} catch (e: any) {
					expect(e?.errorCode).toBe('CKR_FUNCTION_NOT_SUPPORTED');
				}
			} finally {
				lib.C_DestroyObject(session, objectId);
			}
		} finally {
			lib.C_CloseSession(session);
		}
	});

	test('ulong to number', () => {
		expect(ulongToNumber('12345678901')).toBe(12345678901);
		expect(ulongToNumber(12345678901)).toBe(12345678901);
	});

	test('digest', () => {
		const { token } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			lib.C_DigestInit(session, {
				type: EPKCSMechanism.CKM_MD5,
				data: null,
			});
			lib.C_DigestUpdate(session, Buffer.from('test'));
			const resultBuffer1 = lib.C_DigestFinal(session, 16);
			expect(resultBuffer1.toString('hex')).toBe(
				'098f6bcd4621d373cade4e832627b4f6',
			);
			lib.C_DigestInit(session, {
				type: EPKCSMechanism.CKM_MD5,
				data: null,
			});
			const resultBuffer2 = lib.C_Digest(
				session,
				Buffer.from('test'),
				16,
			);
			expect(resultBuffer2.toString('hex')).toBe(
				'098f6bcd4621d373cade4e832627b4f6',
			);
		} finally {
			lib.C_CloseSession(session);
		}
	});

	test('generate key', () => {
		const { token, userPin } = findToken();
		const session = lib.C_OpenSession(
			token.slotId,
			ESessionInfoFlag.CKF_SERIAL_SESSION +
				ESessionInfoFlag.CKF_RW_SESSION,
		);
		try {
			lib.C_Login(session, EUserType.CKU_USER, userPin);
			const len = Buffer.alloc(4);
			len.writeUInt32LE(512);
			const keys = lib.C_GenerateKeyPair(
				session,
				{
					type: EPKCSMechanism.CKM_RSA_PKCS_KEY_PAIR_GEN,
					data: null,
				},
				makeKeyTemplate<EKeyConsumer.C_GenerateKeyPair>({
					class: EObjectClass.CKO_PUBLIC_KEY,
					keyType: EKeyType.CKK_RSA,
					modulusBitsCount: 512,
				}),
				makeKeyTemplate<EKeyConsumer.C_GenerateKeyPair>({
					class: EObjectClass.CKO_PRIVATE_KEY,
					keyType: EKeyType.CKK_RSA,
				}),
			);
			const plaintext = 'testtesttesttesttesttesttesttesttesttest';
			lib.C_EncryptInit(
				session,
				{
					type: EPKCSMechanism.CKM_RSA_PKCS,
					data: null,
				},
				keys.publicKeyId,
			);
			const buf = lib.C_Encrypt(session, Buffer.from(plaintext));
			lib.C_DecryptInit(
				session,
				{
					data: null,
					type: EPKCSMechanism.CKM_RSA_PKCS,
				},
				keys.privateKeyId,
			);
			const decr = lib.C_Decrypt(session, buf);
			expect(plaintext).toBe(decr.toString());
		} finally {
			lib.C_CloseSession(session);
		}
	});
});
