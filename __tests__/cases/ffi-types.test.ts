import {
	attributeType,
	libInfoType,
	mechanismInfoType,
	mechanismType,
	sessionInfoType,
	slotInfoType,
	tokenInfoType,
	versionType,
} from '@/LowLevel/FFITypes';
import { EPKCSMechanism } from '@/LowLevel/LibEnums';
import { Type } from 'ref-napi';

type TTypeBase<T> = T extends Type<infer M> ? M : never;

function runTypeTest<T extends Type<any>>(
	ffiType: T,
	source: TTypeBase<T>,
): { source: TTypeBase<T>; restored: TTypeBase<T> } {
	const offset = Math.round(Math.random() * 100);
	const buffer = Buffer.alloc(ffiType.size + offset);

	ffiType.set(buffer, offset, source);

	return { source, restored: ffiType.get(buffer, offset) };
}

describe('ffi types', () => {
	test('attribute', () => {
		const { source, restored } = runTypeTest(attributeType, {
			type: 1,
			value: Buffer.from('test'),
		});

		expect(restored).toEqual(source);
	});

	test('session info', () => {
		const { source, restored } = runTypeTest(sessionInfoType, {
			flags: 123,
			slotID: 124,
			state: 125,
			ulDeviceError: 126,
		});

		expect(restored).toEqual(source);
	});

	test('mechanism info', () => {
		const { source, restored } = runTypeTest(mechanismInfoType, {
			ulMinKeySize: 12,
			ulMaxKeySize: 23,
			flags: 123,
		});

		expect(restored).toEqual(source);
	});

	test('token info', () => {
		const { source, restored } = runTypeTest(tokenInfoType, {
			label: 'test1',
			manufacturerID: 'test2',
			model: 'test3',
			serialNumber: '123321123',
			flags: 123,

			ulMaxSessionCount: 12,
			ulSessionCount: 6,
			ulMaxRwSessionCount: 11,
			ulRwSessionCount: 2,
			ulMaxPinLen: 8,
			ulMinPinLen: 4,
			ulTotalPublicMemory: 65536,
			ulFreePublicMemory: 32000,
			ulTotalPrivateMemory: 1024,
			ulFreePrivateMemory: 512,
			hardwareVersion: {
				major: 1,
				minor: 3,
			},
			firmwareVersion: {
				major: 2,
				minor: 1,
			},
			utcTime: '12051999225050\0\0',
		});

		expect(restored).toEqual(source);
	});

	test('slot info', () => {
		const { source, restored } = runTypeTest(slotInfoType, {
			slotDescription: 'test1',
			manufacturerID: 'test2',
			flags: 7,
			isHardware: true,
			isPresent: true,
			isRemovable: true,
			hardwareVersion: {
				major: 1,
				minor: 3,
			},
			firmwareVersion: {
				major: 2,
				minor: 1,
			},
		});

		expect(restored).toEqual(source);
	});

	test('library info', () => {
		const { source, restored } = runTypeTest(libInfoType, {
			libraryDescription: 'test1',
			manufacturerID: 'test2',
			flags: 123,
			cryptokiVersion: {
				major: 1,
				minor: 3,
			},
			libraryVersion: {
				major: 2,
				minor: 1,
			},
		});

		expect(restored).toEqual(source);
	});

	test('version', () => {
		const { source, restored } = runTypeTest(versionType, {
			major: 1,
			minor: 3,
		});

		expect(restored).toEqual(source);
	});

	test('mechanism', () => {
		const { source, restored } = runTypeTest(mechanismType, {
			type: EPKCSMechanism.CKM_SHA224,
			data: Buffer.from('some data'),
		});

		expect(restored).toEqual(source);
	});
});
