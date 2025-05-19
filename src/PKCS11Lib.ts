import { DynamicLibrary, ForeignFunction } from 'ffi-napi';
import { EPKCSResults, EPKSCFunctions } from './LibEnums';
import { alloc, NULL, refType } from 'ref-napi';
import {
	buildUIntArrayType,
	ILibInfo,
	ISlotInfo,
	libInfoType,
	slotInfoType,
} from './LibTypes';

interface ILibInterface extends Record<EPKSCFunctions, (...p: any[]) => void> {
	[EPKSCFunctions.C_Initialize]: () => void;
	[EPKSCFunctions.C_Finalize]: () => void;
	[EPKSCFunctions.C_GetInfo]: () => ILibInfo;
	[EPKSCFunctions.C_GetSlotList]: () => Array<number>;
	[EPKSCFunctions.C_GetSlotInfo]: (id: number) => ISlotInfo;
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
	}

	C_Initialize() {
		const func = new ForeignFunction(
			this.lib.get(EPKSCFunctions.C_Initialize),
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
			this.lib.get(EPKSCFunctions.C_Finalize),
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
			this.lib.get(EPKSCFunctions.C_GetInfo),
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
			this.lib.get(EPKSCFunctions.C_GetSlotList),
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
			this.lib.get(EPKSCFunctions.C_GetSlotInfo),
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
	C_GetTokenInfo: (...p: any[]) => number;
	C_WaitForSlotEvent: (...p: any[]) => number;
	C_GetMechanismList: (...p: any[]) => number;
	C_GetMechanismInfo: (...p: any[]) => number;
	C_InitToken: (...p: any[]) => number;
	C_InitPIN: (...p: any[]) => number;
	C_SetPIN: (...p: any[]) => number;
	C_OpenSession: (...p: any[]) => number;
	C_CloseSession: (...p: any[]) => number;
	C_CloseAllSessions: (...p: any[]) => number;
	C_GetSessionInfo: (...p: any[]) => number;
	C_GetOperationState: (...p: any[]) => number;
	C_SetOperationState: (...p: any[]) => number;
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
