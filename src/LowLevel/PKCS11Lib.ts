import { EPKCSResults, EPKCSFunctions, EUserType } from './LibEnums';
import refModule, { alloc, NULL, readPointer, refType } from 'ref-napi';
import {
	IAttribute,
	ILibInfo,
	IMechanismInfo,
	ISlotInfo,
	ITokenInfo,
	TULong,
} from './LibTypes';
import { DynamicLibrary, ForeignFunction } from 'ffi-napi';
import {
	attributeType,
	libInfoType,
	mechanismInfoType,
	sessionInfoType,
	slotInfoType,
	tokenInfoType,
} from './FFITypes';
import { buildUIntArrayType } from './Utils';
import array from 'ref-array-di';

const ArrayType = array(refModule);

interface ILibInterface extends Record<EPKCSFunctions, (...p: any[]) => void> {
	[EPKCSFunctions.C_Initialize]: () => void;
	[EPKCSFunctions.C_Finalize]: () => void;
	[EPKCSFunctions.C_GetInfo]: () => ILibInfo;
	[EPKCSFunctions.C_GetSlotList]: () => Array<number>;
	[EPKCSFunctions.C_GetSlotInfo]: (id: TULong) => ISlotInfo;
	[EPKCSFunctions.C_GetTokenInfo]: (slotId: TULong) => ITokenInfo;
	[EPKCSFunctions.C_WaitForSlotEvent]: (dontBlock: boolean) => TULong;
	[EPKCSFunctions.C_GetMechanismList]: () => Array<TULong>;
	[EPKCSFunctions.C_GetMechanismInfo]: (
		slotId: TULong,
		mechanismType: TULong,
	) => IMechanismInfo;
}

type TErrors = (keyof typeof EPKCSResults)[];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { CKR_OK, CKR_NO_EVENT, ...errorsObject } = EPKCSResults;
const errors: TErrors = Object.keys(errorsObject) as TErrors;
export class PKCS11Lib implements ILibInterface {
	private lib: DynamicLibrary;

	constructor(path: string) {
		this.lib = new DynamicLibrary(path);
	}

	private callFunction<F extends (...p: any[]) => any>(
		func: F,
		...params: Parameters<F>
	) {
		const res: number = func(...params);

		errors.forEach((key) => {
			if (res === EPKCSResults[key]) throw { errorCode: key };
		});

		return res;
	}

	C_Initialize() {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Initialize),
			'ulong',
			['void *'],
		);
		this.callFunction(func, NULL);
	}

	C_Finalize() {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Finalize),
			'ulong',
			['void *'],
		);
		this.callFunction(func, NULL);
	}

	C_GetInfo() {
		const buffer = alloc(libInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetInfo),
			'ulong',
			[refType(libInfoType)],
		);

		this.callFunction(func, buffer);

		return buffer.deref();
	}

	C_GetFunctionList() {
		throw new Error('Не актуально в контексте этого проекта');
	}

	C_GetSlotList() {
		const len = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetSlotList),
			'ulong',
			[
				'uchar',
				'void *' /** 'ulong *', но чтобы не возиться с string, убтраем тип */,
				'ulong *',
			],
		);

		this.callFunction(func, 1, NULL, len);

		const lenValue = len.deref();

		if (typeof lenValue === 'string') {
			throw new Error(
				'Слишком много токенов, столько не бывает: ' + lenValue,
			);
		}

		const buffer = alloc(buildUIntArrayType(lenValue, 4));

		this.callFunction(func, 1, buffer, len.ref());

		return buffer.deref();
	}

	C_GetSlotInfo(id: TULong) {
		const buffer = alloc(slotInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetSlotInfo),
			'ulong',
			['ulong', refType(slotInfoType)],
		);

		this.callFunction(func, id, buffer);

		return buffer.deref();
	}

	C_GetTokenInfo(slotId: TULong): ITokenInfo {
		const buffer = alloc(tokenInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetTokenInfo),
			'ulong',
			['ulong', refType(tokenInfoType)],
		);

		this.callFunction(func, slotId, buffer);

		return buffer.deref();
	}

	C_WaitForSlotEvent(dontBlock: boolean) {
		const slotId = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_WaitForSlotEvent),
			'ulong',
			['ulong', refType('ulong'), refType('void')],
		);

		if (
			this.callFunction(func, dontBlock ? 1 : 0, slotId, NULL) ===
			EPKCSResults.CKR_NO_EVENT
		)
			return -1;

		return slotId.deref();
	}

	C_GetMechanismList() {
		const len = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetMechanismList),
			'ulong',
			['uchar', 'ulong *', 'ulong *'],
		);

		this.callFunction(func, 1, NULL, len);

		const lenValue = len.deref();

		if (typeof lenValue === 'string') {
			throw new Error(
				'Слишком много механизмов, столько не бывает: ' + lenValue,
			);
		}

		const buffer = alloc(buildUIntArrayType(lenValue, 4));

		this.callFunction(func, 1, buffer, len.ref());

		return buffer.deref();
	}

	C_GetMechanismInfo(slotId: TULong, mechanismType: TULong) {
		const mechanismInfo = alloc(mechanismInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetMechanismInfo),
			'ulong',
			['ulong', 'ulong', refType(mechanismInfoType)],
		);

		this.callFunction(func, slotId, mechanismType, mechanismInfo);

		return mechanismInfo.deref();
	}

	C_InitToken(slotId: TULong, pin: string, label: string) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_InitToken),
			'ulong',
			['ulong', 'CString', 'ulong', 'CString'],
		);

		this.callFunction(func, slotId, pin, pin.length, label);
	}

	C_InitPIN(sessionId: TULong, pin: string) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_InitPIN),
			'ulong',
			['ulong', 'CString', 'ulong'],
		);

		this.callFunction(func, sessionId, pin, pin.length);
	}

	C_SetPIN(sessionId: TULong, oldPin: string, newPin: string) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SetPIN),
			'ulong',
			['ulong', 'CString', 'ulong', 'CString', 'ulong'],
		);

		this.callFunction(
			func,
			sessionId,
			oldPin,
			oldPin.length,
			newPin,
			newPin.length,
		);
	}

	C_OpenSession(slotId: TULong, flags: TULong): TULong {
		const sessionId = alloc('ulong');

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_OpenSession),
			'ulong',
			[
				'ulong',
				'ulong',
				refType('void'),
				refType('void'),
				refType('ulong'),
			],
		);

		this.callFunction(func, slotId, flags, NULL, NULL, sessionId);

		return sessionId.deref();
	}

	C_CloseSession(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CloseSession),
			'ulong',
			['ulong'],
		);

		this.callFunction(func, sessionId);
	}

	C_CloseAllSessions(slotId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CloseAllSessions),
			'ulong',
			['ulong'],
		);

		this.callFunction(func, slotId);
	}

	C_GetSessionInfo(sessionId: TULong) {
		const info = alloc(sessionInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetSessionInfo),
			'ulong',
			['ulong', refType(sessionInfoType)],
		);

		this.callFunction(func, sessionId, info);

		return info.deref();
	}

	C_GetOperationState(sessionId: TULong) {
		const buffer = alloc('ulong', 0);
		const len = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetOperationState),
			'ulong',
			['ulong', refType('ulong'), refType('ulong')],
		);

		this.callFunction(func, sessionId, buffer, len);
		const stateLength = len.deref();

		if (stateLength === 0) return null;

		return readPointer(
			buffer,
			0,
			typeof stateLength === 'number'
				? stateLength
				: Number.parseInt(stateLength),
		);
	}

	C_SetOperationState(
		sessionId: TULong,
		buffer: Buffer,
		encryptionKeyId: TULong,
		authKeyId: TULong,
	) {
		const buf = alloc('byte *', buffer);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetOperationState),
			'ulong',
			['ulong', refType('byte'), 'ulong', 'ulong', 'ulong'],
		);

		this.callFunction(
			func,
			sessionId,
			buf.deref(),
			buf.length,
			encryptionKeyId,
			authKeyId,
		);
	}

	C_Login(sessionId: TULong, userType: EUserType, pin: string) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Login),
			'ulong',
			['ulong', 'ulong', 'string', 'ulong'],
		);

		this.callFunction(func, sessionId, userType, pin, pin.length);
	}

	C_Logout(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Logout),
			'ulong',
			['ulong'],
		);

		this.callFunction(func, sessionId);
	}

	C_CreateObject(sessionId: TULong, template: IAttribute[]) {
		const TemplateType = new ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();
		const handle = alloc('ulong', 0);

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CreateObject),
			'ulong',
			['ulong', TemplateType, 'ulong', refType('ulong')],
		);

		this.callFunction(
			func,
			sessionId,
			templateBuffer,
			template.length,
			handle,
		);

		return handle.deref();
	}

	C_CopyObject(sessionId: TULong, sourceId: TULong, template: IAttribute[]) {
		const TemplateType = new ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();
		const handle = alloc('ulong', 0);

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CopyObject),
			'ulong',
			['ulong', 'ulong', TemplateType, 'ulong', refType('ulong')],
		);

		this.callFunction(
			func,
			sessionId,
			sourceId,
			templateBuffer,
			template.length,
			handle,
		);

		return handle.deref();
	}

	C_DestroyObject(sessionId: TULong, objectId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DestroyObject),
			'ulong',
			['ulong', 'ulong'],
		);

		this.callFunction(func, sessionId, objectId);
	}

	C_GetObjectSize(sessionId: TULong, objectId: TULong) {
		const size = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetObjectSize),
			'ulong',
			['ulong', 'ulong', refType('ulong')],
		);

		this.callFunction(func, sessionId, objectId, size);

		return size.deref();
	}

	C_GetAttributeValue(
		sessionId: TULong,
		sourceId: TULong,
		template: IAttribute[],
	) {
		const TemplateType = new ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetAttributeValue),
			'ulong',
			['ulong', 'ulong', TemplateType, 'ulong'],
		);

		this.callFunction(
			func,
			sessionId,
			sourceId,
			templateBuffer,
			template.length,
		);

		return templateBuffer.toArray();
	}

	C_SetAttributeValue(
		sessionId: TULong,
		sourceId: TULong,
		template: IAttribute[],
	) {
		const TemplateType = new ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SetAttributeValue),
			'ulong',
			['ulong', 'ulong', TemplateType, 'ulong'],
		);

		this.callFunction(
			func,
			sessionId,
			sourceId,
			templateBuffer,
			template.length,
		);
	}

	C_FindObjectsInit(sessionId: TULong, template: IAttribute[]) {
		const TemplateType = new ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_FindObjectsInit),
			'ulong',
			['ulong', TemplateType, 'ulong'],
		);

		this.callFunction(func, sessionId, templateBuffer, template.length);
	}

	C_FindObjects(sessionId: TULong, packSize: number = 100) {
		const IdsType = new ArrayType('ulong', packSize);
		const idsBuffer = new IdsType();
		const actualCount = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_FindObjects),
			'ulong',
			['ulong', IdsType, 'ulong', refType('ulong')],
		);

		this.callFunction(func, sessionId, idsBuffer, packSize, actualCount);
		const uLongActualCount = actualCount.deref();

		return idsBuffer
			.toArray()
			.slice(
				0,
				typeof uLongActualCount === 'string'
					? Number.parseInt(uLongActualCount)
					: uLongActualCount,
			);
	}

	C_FindObjectsFinal(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_FindObjectsFinal),
			'ulong',
			['ulong'],
		);

		this.callFunction(func, sessionId);
	}

	C_EncryptInit: (...p: any[]) => number;
	C_Encrypt: (...p: any[]) => number;
	C_EncryptUpdate: (...p: any[]) => number;
	C_EncryptFinal: (...p: any[]) => number;

	C_DecryptInit: (...p: any[]) => number;
	C_Decrypt: (...p: any[]) => number;
	C_DecryptUpdate: (...p: any[]) => number;
	C_DecryptFinal: (...p: any[]) => number;

	C_DigestInit: (...p: any[]) => number;
	C_Digest: (...p: any[]) => number;
	C_DigestUpdate: (...p: any[]) => number;
	C_DigestKey: (...p: any[]) => number;
	C_DigestFinal: (...p: any[]) => number;

	C_SignInit: (...p: any[]) => number;
	C_Sign: (...p: any[]) => number;
	C_SignUpdate: (...p: any[]) => number;
	C_SignFinal: (...p: any[]) => number;
	C_SignRecoverInit: (...p: any[]) => number;
	C_SignRecover: (...p: any[]) => number;

	C_VerifyInit: (...p: any[]) => number;
	C_Verify: (...p: any[]) => number;
	C_VerifyUpdate: (...p: any[]) => number;
	C_VerifyFinal: (...p: any[]) => number;
	C_VerifyRecoverInit: (...p: any[]) => number;
	C_VerifyRecover: (...p: any[]) => number;

	C_DigestEncryptUpdate: (...p: any[]) => number;
	C_DecryptDigestUpdate: (...p: any[]) => number;

	C_SignEncryptUpdate: (...p: any[]) => number;
	C_DecryptVerifyUpdate: (...p: any[]) => number;

	C_GenerateKey: (...p: any[]) => number;
	C_GenerateKeyPair: (...p: any[]) => number;
	C_WrapKey: (...p: any[]) => number;
	C_UnwrapKey: (...p: any[]) => number;
	C_DeriveKey: (...p: any[]) => number;

	C_SeedRandom: (...p: any[]) => number;
	C_GenerateRandom: (...p: any[]) => number;
	/**
	 * @deprecated
	 */
	C_GetFunctionStatus() {
		throw new Error('Parallel function management is deprecated');
	}
	/**
	 * @deprecated
	 */
	C_CancelFunction() {
		throw new Error('Parallel function management is deprecated');
	}
}
