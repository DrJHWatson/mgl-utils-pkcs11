import {
	EPKCSResults,
	EPKCSFunctions,
	EUserType,
	EPKCSMechanism,
} from './LibEnums';
import refModule, { alloc, NULL, readPointer, refType } from 'ref-napi';
import {
	IAttribute,
	ILibInfo,
	IMechanism,
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
	mechanismType,
	sessionInfoType,
	slotInfoType,
	tokenInfoType,
} from './FFITypes';
import { buildUIntArrayType, ulongToNumber } from './Utils';
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
	[EPKCSFunctions.C_GetMechanismList]: (
		slotId: TULong,
	) => Array<EPKCSMechanism>;
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

		const buffer = alloc(buildUIntArrayType(ulongToNumber(lenValue), 4));

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

	C_GetMechanismList(slotId: TULong) {
		const len = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetMechanismList),
			'ulong',
			['ulong', 'ulong *', 'ulong *'],
		);

		this.callFunction(func, slotId, NULL, len);

		const lenValue = len.deref();
		const buffer = alloc(buildUIntArrayType(ulongToNumber(lenValue), 4));

		this.callFunction(func, slotId, buffer, len.ref());

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

		return readPointer(buffer, 0, ulongToNumber(stateLength));
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
		const TemplateType = ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();
		const handle = alloc('ulong', 0);

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CreateObject),
			'ulong',
			['ulong', 'byte *', 'ulong', refType('ulong')],
		);

		this.callFunction(
			func,
			sessionId,
			templateBuffer.buffer,
			template.length,
			handle,
		);

		return handle.deref();
	}

	C_CopyObject(sessionId: TULong, sourceId: TULong, template: IAttribute[]) {
		const TemplateType = ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();
		const handle = alloc('ulong', 0);

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CopyObject),
			'ulong',
			['ulong', 'ulong', 'byte *', 'ulong', refType('ulong')],
		);

		this.callFunction(
			func,
			sessionId,
			sourceId,
			templateBuffer.buffer,
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

	/**
	 *
	 * @param sessionId
	 * @param sourceId
	 * @param template буфер для значений, записываться будет по этому же адресу
	 * @returns
	 */
	C_GetAttributeValue(
		sessionId: TULong,
		sourceId: TULong,
		template: IAttribute[],
	) {
		const TemplateType = ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetAttributeValue),
			'ulong',
			['ulong', 'ulong', 'byte *', 'ulong'],
		);

		this.callFunction(
			func,
			sessionId,
			sourceId,
			templateBuffer.buffer,
			template.length,
		);

		return templateBuffer.toArray();
	}

	C_SetAttributeValue(
		sessionId: TULong,
		sourceId: TULong,
		template: IAttribute[],
	) {
		const TemplateType = ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SetAttributeValue),
			'ulong',
			['ulong', 'ulong', 'byte *', 'ulong'],
		);

		this.callFunction(
			func,
			sessionId,
			sourceId,
			templateBuffer.buffer,
			template.length,
		);
	}

	C_FindObjectsInit(sessionId: TULong, template: IAttribute[]) {
		const TemplateType = ArrayType(attributeType, template.length);
		const templateBuffer = new TemplateType();

		template.forEach((value, index) => (templateBuffer[index] = value));

		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_FindObjectsInit),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);

		this.callFunction(
			func,
			sessionId,
			templateBuffer.buffer,
			template.length,
		);
	}

	C_FindObjects(sessionId: TULong, packSize: number = 100) {
		const IdsType = ArrayType('ulong', packSize);
		const idsBuffer = new IdsType();
		const actualCount = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_FindObjects),
			'ulong',
			['ulong', 'void *', 'ulong', refType('ulong')],
		);

		this.callFunction(
			func,
			sessionId,
			idsBuffer.buffer,
			packSize,
			actualCount,
		);
		const uLongActualCount = actualCount.deref();

		return idsBuffer.toArray().slice(0, ulongToNumber(uLongActualCount));
	}

	C_FindObjectsFinal(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_FindObjectsFinal),
			'ulong',
			['ulong'],
		);

		this.callFunction(func, sessionId);
	}

	C_EncryptInit(sessionId: TULong, mechanism: IMechanism, objectId: TULong) {
		const mechBuffer = alloc(mechanismType, mechanism);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_EncryptInit),
			'ulong',
			['ulong', refType(mechanismType), 'ulong'],
		);

		this.callFunction(func, sessionId, mechBuffer, objectId);
	}

	C_Encrypt(sessionId: TULong, dataForEncrypt: Buffer) {
		const inputBuffer = alloc('byte *', dataForEncrypt);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Encrypt),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(
			func,
			sessionId,
			inputBuffer,
			dataForEncrypt.length,
			outPointerBuffer,
			lengthBuffer,
		);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_EncryptUpdate(sessionId: TULong, dataForEncrypt: Buffer) {
		const inputBuffer = alloc('byte *', dataForEncrypt);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_EncryptUpdate),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(
			func,
			sessionId,
			inputBuffer,
			dataForEncrypt.length,
			outPointerBuffer,
			lengthBuffer,
		);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_EncryptFinal(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_EncryptUpdate),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(func, sessionId, outPointerBuffer, lengthBuffer);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_DecryptInit(sessionId: TULong, mechanism: IMechanism, keyId: TULong) {
		const mechBuffer = alloc(mechanismType, mechanism);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DecryptInit),
			'ulong',
			['ulong', refType(mechanismType), 'ulong'],
		);

		this.callFunction(func, sessionId, mechBuffer, keyId);
	}

	C_Decrypt(sessionId: TULong, dataForDecrypt: Buffer) {
		const inputBuffer = alloc('byte *', dataForDecrypt);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Decrypt),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(
			func,
			sessionId,
			inputBuffer,
			dataForDecrypt.length,
			outPointerBuffer,
			lengthBuffer,
		);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_DecryptUpdate(sessionId: TULong, dataForDecrypt: Buffer) {
		const inputBuffer = alloc('byte *', dataForDecrypt);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DecryptUpdate),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(
			func,
			sessionId,
			inputBuffer,
			dataForDecrypt.length,
			outPointerBuffer,
			lengthBuffer,
		);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_DecryptFinal(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DecryptFinal),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(func, sessionId, outPointerBuffer, lengthBuffer);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_DigestInit(sessionId: TULong, mechanism: IMechanism) {
		const mechBuffer = alloc(mechanismType, mechanism);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DigestInit),
			'ulong',
			['ulong', refType(mechanismType)],
		);

		this.callFunction(func, sessionId, mechBuffer);
	}

	C_Digest(sessionId: TULong, dataForDigest: Buffer, digestLength: number) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Digest),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong', digestLength);
		const outBuffer = Buffer.alloc(digestLength);

		this.callFunction(
			func,
			sessionId,
			dataForDigest,
			dataForDigest.length,
			outBuffer,
			lengthBuffer,
		);

		return outBuffer.subarray(0, ulongToNumber(lengthBuffer.deref()));
	}

	C_DigestUpdate(sessionId: TULong, dataForDigest: Buffer) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DigestUpdate),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);

		this.callFunction(func, sessionId, dataForDigest, dataForDigest.length);
	}

	C_DigestKey(sessionId: TULong, keyId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DigestKey),
			'ulong',
			['ulong', 'ulong'],
		);

		this.callFunction(func, sessionId, keyId);
	}

	C_DigestFinal(sessionId: TULong, digestLength: number) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DigestFinal),
			'ulong',
			['ulong', 'byte *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong', digestLength);
		const outBuffer = Buffer.alloc(digestLength);
		this.callFunction(func, sessionId, outBuffer, lengthBuffer);

		return outBuffer.subarray(0, ulongToNumber(lengthBuffer.deref()));
	}

	C_SignInit(sessionId: TULong, mechanism: IMechanism, keyId: TULong) {
		const mechBuffer = alloc(mechanismType, mechanism);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SignInit),
			'ulong',
			['ulong', refType(mechanismType), 'ulong'],
		);

		this.callFunction(func, sessionId, mechBuffer, keyId);
	}

	C_Sign(sessionId: TULong, dataForSign: Buffer) {
		const inputBuffer = alloc('byte *', dataForSign);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Sign),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(
			func,
			sessionId,
			inputBuffer,
			dataForSign.length,
			outPointerBuffer,
			lengthBuffer,
		);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_SignUpdate(sessionId: TULong, dataForSign: Buffer) {
		const inputBuffer = alloc('byte *', dataForSign);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SignUpdate),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);

		this.callFunction(func, sessionId, inputBuffer, dataForSign.length);
	}

	C_SignFinal(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SignFinal),
			'ulong',
			['ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(func, sessionId, outPointerBuffer, lengthBuffer);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_SignRecoverInit(sessionId: TULong, mechanism: IMechanism, keyId: TULong) {
		const mechBuffer = alloc(mechanismType, mechanism);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SignRecoverInit),
			'ulong',
			['ulong', refType(mechanismType), 'ulong'],
		);

		this.callFunction(func, sessionId, mechBuffer, keyId);
	}

	C_SignRecover(sessionId: TULong, dataForSign: Buffer) {
		const inputBuffer = alloc('byte *', dataForSign);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SignRecover),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(
			func,
			sessionId,
			inputBuffer,
			dataForSign.length,
			outPointerBuffer,
			lengthBuffer,
		);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_VerifyInit(sessionId: TULong, mechanism: IMechanism, keyId: TULong) {
		const mechBuffer = alloc(mechanismType, mechanism);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_VerifyInit),
			'ulong',
			['ulong', refType(mechanismType), 'ulong'],
		);

		this.callFunction(func, sessionId, mechBuffer, keyId);
	}

	/**
	 * тестировать. совершенно не понятно, как это должно работать
	 */
	C_Verify(sessionId: TULong, dataForVerify: Buffer) {
		const inputBuffer = alloc('byte *', dataForVerify);
		//const signBuffer = alloc('byte *', sign);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Sign),
			'ulong',
			['ulong', 'byte *', 'ulong', 'void *', 'ulong *'],
		);
		const lengthBuffer = alloc('ulong');
		const outPointerBuffer = alloc('void *');

		this.callFunction(
			func,
			sessionId,
			inputBuffer,
			dataForVerify.length,
			outPointerBuffer,
			lengthBuffer,
		);

		return readPointer(
			outPointerBuffer,
			ulongToNumber(lengthBuffer.deref()),
		);
	}

	C_VerifyUpdate(sessionId: TULong, dataForVerify: Buffer) {
		const inputBuffer = alloc('byte *', dataForVerify);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Sign),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);

		this.callFunction(func, sessionId, inputBuffer, dataForVerify.length);
	}

	C_VerifyFinal: (...p: any[]) => number;
	C_VerifyRecoverInit: (...p: any[]) => number;
	C_VerifyRecover: (...p: any[]) => number;

	C_DigestEncryptUpdate: (...p: any[]) => number;
	C_DecryptDigestUpdate: (...p: any[]) => number;

	C_SignEncryptUpdate: (...p: any[]) => number;
	C_DecryptVerifyUpdate: (...p: any[]) => number;

	C_GenerateKey: (...p: any[]) => number;
	C_GenerateKeyPair(
		sessionId: TULong,
		mechanism: IMechanism,
		publicKeyTemplate: IAttribute[],
		privateKeyTemplate: IAttribute[],
	) {
		const PubTemplateType = ArrayType(
			attributeType,
			publicKeyTemplate.length,
		);
		publicKeyTemplate.forEach(
			(value, index) => (pubKeyTemplateBuffer[index] = value),
		);
		const pubKeyTemplateBuffer = new PubTemplateType();
		const PrivTemplateType = ArrayType(
			attributeType,
			privateKeyTemplate.length,
		);
		privateKeyTemplate.forEach(
			(value, index) => (privKeyTemplateBuffer[index] = value),
		);
		const privKeyTemplateBuffer = new PrivTemplateType();
		const mechBuffer = alloc(mechanismType, mechanism);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_DigestInit),
			'ulong',
			[
				'ulong',
				refType(mechanismType),
				'byte *',
				'ulong',
				'byte *',
				'ulong',
				'ulong *',
				'ulong *',
			],
		);
		const publicKeyId = alloc('ulong', 0);
		const privateKeyId = alloc('ulong', 0);

		this.callFunction(
			func,
			sessionId,
			mechBuffer,
			pubKeyTemplateBuffer.buffer,
			publicKeyTemplate.length,
			privKeyTemplateBuffer.buffer,
			privateKeyTemplate.length,
			publicKeyId,
			privateKeyId,
		);
		return {
			publicKeyId: publicKeyId.deref(),
			privateKeyId: privateKeyId.deref(),
		};
	}
	C_WrapKey: (...p: any[]) => number;
	C_UnwrapKey: (...p: any[]) => number;
	C_DeriveKey: (...p: any[]) => number;

	C_SeedRandom(sessionId: TULong, seed: Buffer) {
		const seedBuffer = alloc('byte *', seed);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GenerateRandom),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);
		this.callFunction(func, sessionId, seedBuffer, seed.length);
	}

	C_GenerateRandom(sessionId: TULong, length: number) {
		const outPointerBuffer = alloc('void *');
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GenerateRandom),
			'ulong',
			['ulong', 'byte *', 'ulong'],
		);
		this.callFunction(func, sessionId, outPointerBuffer, length);

		return readPointer(outPointerBuffer, ulongToNumber(length));
	}
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
