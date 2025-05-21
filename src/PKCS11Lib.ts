import { DynamicLibrary, ForeignFunction } from 'ffi-napi';
import { EPKCSResults, EPKCSFunctions } from './LibEnums';
import { alloc, NULL, refType } from 'ref-napi';
import {
	buildUIntArrayType,
	ILibInfo,
	IMechanismInfo,
	ISlotInfo,
	ITokenInfo,
	libInfoType,
	mechanismInfoType,
	sessionInfoType,
	slotInfoType,
	tokenInfoType,
	TULong,
} from './LibTypes';

interface ILibInterface extends Record<EPKCSFunctions, (...p: any[]) => void> {
	[EPKCSFunctions.C_Initialize]: () => void;
	[EPKCSFunctions.C_Finalize]: () => void;
	[EPKCSFunctions.C_GetInfo]: () => ILibInfo;
	[EPKCSFunctions.C_GetSlotList]: () => Array<number>;
	[EPKCSFunctions.C_GetSlotInfo]: (id: number) => ISlotInfo;
	[EPKCSFunctions.C_GetTokenInfo]: (slotId: number) => ITokenInfo;
	[EPKCSFunctions.C_WaitForSlotEvent]: (dontBlock: boolean) => TULong;
	[EPKCSFunctions.C_GetMechanismList]: () => Array<TULong>;
	[EPKCSFunctions.C_GetMechanismInfo]: (
		slotId: number,
		mechanismType: TULong,
	) => IMechanismInfo;
}

type TErrors = (keyof typeof EPKCSResults)[];

export class PKCS11Lib implements ILibInterface {
	private lib: DynamicLibrary;

	constructor(path: string) {
		this.lib = new DynamicLibrary(path);
	}

	private callFunction<F extends (...p: any[]) => any>(
		func: F,
		checkErrors: TErrors,
		...params: Parameters<F>
	) {
		const res: number = func(...params);

		checkErrors.forEach((key) => {
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
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CANT_LOCK',
			'CKR_CRYPTOKI_ALREADY_INITIALIZED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_NEED_TO_CREATE_THREADS',
		];
		this.callFunction(func, errors, NULL);
	}

	C_Finalize() {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_Finalize),
			'ulong',
			['void *'],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
		];
		this.callFunction(func, errors, NULL);
	}

	C_GetInfo() {
		const buffer = alloc(libInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetInfo),
			'ulong',
			[refType(libInfoType)],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
		];

		this.callFunction(func, errors, buffer);

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
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_BUFFER_TOO_SMALL',
		];

		this.callFunction(func, errors, 1, NULL, len);

		const lenValue = len.deref();

		if (typeof lenValue === 'string') {
			throw new Error(
				'Слишком много токенов, столько не бывает: ' + lenValue,
			);
		}

		const buffer = alloc(buildUIntArrayType(lenValue, 4));

		this.callFunction(func, errors, 1, buffer, len.ref());

		return buffer.deref();
	}

	C_GetSlotInfo(id: number) {
		const buffer = alloc(slotInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetSlotInfo),
			'ulong',
			['ulong', refType(slotInfoType)],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_SLOT_ID_INVALID',
		];

		this.callFunction(func, errors, id, buffer);

		return buffer.deref();
	}

	C_GetTokenInfo(slotId): ITokenInfo {
		const buffer = alloc(tokenInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetTokenInfo),
			'ulong',
			['ulong', refType(tokenInfoType)],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_SLOT_ID_INVALID',
		];

		this.callFunction(func, errors, slotId, buffer);

		return buffer.deref();
	}

	C_WaitForSlotEvent(dontBlock: boolean) {
		const slotId = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_WaitForSlotEvent),
			'ulong',
			['ulong', refType('ulong'), refType('void')],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
		];

		if (
			this.callFunction(func, errors, dontBlock ? 1 : 0, slotId, NULL) ===
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
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_BUFFER_TOO_SMALL',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
			'CKR_TOKEN_NOT_RECOGNIZED',
		];

		this.callFunction(func, errors, 1, NULL, len);

		const lenValue = len.deref();

		if (typeof lenValue === 'string') {
			throw new Error(
				'Слишком много механизмов, столько не бывает: ' + lenValue,
			);
		}

		const buffer = alloc(buildUIntArrayType(lenValue, 4));

		this.callFunction(func, errors, 1, buffer, len.ref());

		return buffer.deref();
	}

	C_GetMechanismInfo(slotId: number, mechanismType: number | string) {
		const mechanismInfo = alloc(mechanismInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetMechanismInfo),
			'ulong',
			['ulong', 'ulong', refType(mechanismInfoType)],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_BUFFER_TOO_SMALL',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
			'CKR_TOKEN_NOT_RECOGNIZED',
			'CKR_MECHANISM_INVALID',
		];

		this.callFunction(func, errors, slotId, mechanismType, mechanismInfo);

		return mechanismInfo.deref();
	}

	C_InitToken(slotId: TULong, pin: string, label: string) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_InitToken),
			'ulong',
			['ulong', 'CString', 'ulong', 'CString'],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_CANCELED',
			'CKR_FUNCTION_FAILED',
			'CKR_FUNCTION_REJECTED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_PIN_INCORRECT',
			'CKR_PIN_LOCKED',
			'CKR_SESSION_EXISTS',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
			'CKR_TOKEN_NOT_RECOGNIZED',
			'CKR_TOKEN_WRITE_PROTECTED',
		];

		this.callFunction(func, errors, slotId, pin, pin.length, label);
	}

	C_InitPIN(sessionId: TULong, pin: string) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_InitPIN),
			'ulong',
			['ulong', 'CString', 'ulong'],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_CANCELED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_PIN_INVALID',
			'CKR_PIN_LEN_RANGE',
			'CKR_SESSION_CLOSED',
			'CKR_SESSION_READ_ONLY',
			'CKR_SESSION_HANDLE_INVALID',
			'CKR_USER_NOT_LOGGED_IN',
		];

		this.callFunction(func, errors, sessionId, pin, pin.length);
	}

	C_SetPIN(sessionId: TULong, oldPin: string, newPin: string) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_SetPIN),
			'ulong',
			['ulong', 'CString', 'ulong', 'CString', 'ulong'],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_CANCELED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_PIN_INVALID',
			'CKR_PIN_LEN_RANGE',
			'CKR_SESSION_CLOSED',
			'CKR_SESSION_READ_ONLY',
			'CKR_SESSION_HANDLE_INVALID',
			'CKR_PIN_INCORRECT',
			'CKR_PIN_LOCKED',
			'CKR_TOKEN_WRITE_PROTECTED',
		];

		this.callFunction(
			func,
			errors,
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
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_TOKEN_WRITE_PROTECTED',
			'CKR_SESSION_COUNT',
			'CKR_SESSION_PARALLEL_NOT_SUPPORTED',
			'CKR_SESSION_READ_WRITE_SO_EXISTS',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
			'CKR_TOKEN_NOT_RECOGNIZED',
		];

		this.callFunction(func, errors, slotId, flags, NULL, NULL, sessionId);

		return sessionId.deref();
	}

	C_CloseSession(sessionId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CloseSession),
			'ulong',
			['ulong'],
		);
		const errors: TErrors = [
			'CKR_ARGUMENTS_BAD',
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_SESSION_CLOSED',
			'CKR_SESSION_HANDLE_INVALID',
		];

		this.callFunction(func, errors, sessionId);
	}

	C_CloseAllSessions(slotId: TULong) {
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_CloseAllSessions),
			'ulong',
			['ulong'],
		);
		const errors: TErrors = [
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
		];

		this.callFunction(func, errors, slotId);
	}

	C_GetSessionInfo(sessionId: TULong) {
		const info = alloc(sessionInfoType);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetSessionInfo),
			'ulong',
			['ulong', refType(sessionInfoType)],
		);
		const errors: TErrors = [
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
			'CKR_ARGUMENTS_BAD',
			'CKR_SESSION_CLOSED',
			'CKR_SESSION_HANDLE_INVALID',
		];

		this.callFunction(func, errors, sessionId, info);

		return info.deref();
	}

	/**
	 * Доделать запуск операций и протестировать
	 */
	C_GetOperationState(sessionId: TULong) {
		const buffer = alloc('char');
		const len = alloc('ulong', 0);
		const func = new ForeignFunction(
			this.lib.get(EPKCSFunctions.C_GetOperationState),
			'ulong',
			['ulong', refType('char'), refType('ulong *')],
		);
		const errors: TErrors = [
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
			'CKR_ARGUMENTS_BAD',
			'CKR_SESSION_CLOSED',
			'CKR_SESSION_HANDLE_INVALID',
		];

		this.callFunction(func, errors, sessionId, buffer, len.ref());
		console.log(buffer.deref(), len);

		return buffer;
	}

	/**
	 * Доделать запуск операций и протестировать
	 */
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
		const errors: TErrors = [
			'CKR_CRYPTOKI_NOT_INITIALIZED',
			'CKR_DEVICE_ERROR',
			'CKR_DEVICE_MEMORY',
			'CKR_DEVICE_REMOVED',
			'CKR_FUNCTION_FAILED',
			'CKR_GENERAL_ERROR',
			'CKR_HOST_MEMORY',
			'CKR_SLOT_ID_INVALID',
			'CKR_TOKEN_NOT_PRESENT',
			'CKR_ARGUMENTS_BAD',
			'CKR_SESSION_CLOSED',
			'CKR_SESSION_HANDLE_INVALID',
		];

		this.callFunction(
			func,
			errors,
			sessionId,
			buf.deref(),
			buf.length,
			encryptionKeyId,
			authKeyId,
		);
	}

	C_Login: (...p: any[]) => number;
	C_Logout: (...p: any[]) => number;
	C_CreateObject: (...p: any[]) => number;
	C_CopyObject: (...p: any[]) => number;
	C_DestroyObject: (...p: any[]) => number;
	C_GetObjectSize: (...p: any[]) => number;
	C_GetAttributeValue: (...p: any[]) => number;
	C_SetAttributeValue: (...p: any[]) => number;
	C_FindObjectsInit: (...p: any[]) => number;
	C_FindObjects: (...p: any[]) => number;
	C_FindObjectsFinal: (...p: any[]) => number;
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
	C_GetFunctionStatus: (...p: any[]) => number;
	C_CancelFunction: (...p: any[]) => number;
}
