import { DynamicLibrary, ForeignFunction } from 'ffi-napi';
import { alloc, NULL } from 'ref-napi';
import path from 'path';
import { PKCS11Lib } from '@/index';
import {
	EKeyConsumer,
	EKeyType,
	EObjectClass,
	EPKCSMechanism,
} from '@/LowLevel/LibEnums';
import { makeKeyTemplate } from '@/LowLevel/Utils';

describe('library ts interface testing', () => {
	let rawLib: DynamicLibrary;
	let lib: PKCS11Lib;

	function getLogs() {
		const get_log = new ForeignFunction(rawLib.get('get_log'), 'void', [
			'byte *',
			'long *',
		]);
		const lenBuffer = alloc('long', 0);
		get_log(NULL, lenBuffer);
		const actualLen = lenBuffer.deref();
		const buffer = Buffer.alloc(
			typeof actualLen === 'number'
				? actualLen
				: Number.parseInt(actualLen),
		);
		get_log(buffer, lenBuffer);
		return JSON.parse(buffer.toString());
	}

	beforeEach(() => {
		rawLib = new DynamicLibrary(
			path.join(__dirname, '../bin/pkcs11tester.dll'),
		);
		lib = new PKCS11Lib(path.join(__dirname, '../bin/pkcs11tester.dll'));
	});

	test('C_Finalize', () => {
		lib.C_Initialize();
		expect(getLogs()).toEqual([
			{ functionName: 'C_Initialize', params: { args: null } },
		]);
	});

	test('C_Finalize', () => {
		lib.C_Finalize();
		expect(getLogs()).toEqual([
			{ functionName: 'C_Finalize', params: { arg: null } },
		]);
	});

	test('C_GenerateKeyPair', () => {
		lib.C_GenerateKeyPair(
			123,
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
		console.log(getLogs());
	});
});
