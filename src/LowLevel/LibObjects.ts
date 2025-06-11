import {
	ECertificateCategory,
	ECertificateMIDPDomain,
	ECertificateType,
	EKeyConsumer,
	EKeyType,
	EObjectClass,
	EPKCSMechanism,
} from './LibEnums';
import { TULong } from './LibTypes';

export interface IPKCSObject<C extends EObjectClass> {
	class: C;
}

interface IStoreObject<C extends EObjectClass> extends IPKCSObject<C> {
	storeInToken?: boolean;
	isPrivate?: boolean;
	isModifiable?: boolean;
	label?: string;
	isCopyable?: boolean;
}

export interface IDataObject extends IStoreObject<EObjectClass.CKO_DATA> {
	application?: string;
	objectId?: Buffer;
	value?: Buffer;
}

interface ICertificateObject<T extends ECertificateType>
	extends IStoreObject<EObjectClass.CKO_CERTIFICATE> {
	certificateType: T;
	isTrusted: boolean;
	category?: ECertificateCategory;
	checksum?: Buffer;
	startDate?: Date;
	endDate?: Date;
}

export interface IX509PublicKeyObject
	extends ICertificateObject<ECertificateType.CKC_X_509> {
	ownerName: Buffer;
	id?: Buffer;
	issuerName?: Buffer;
	certSN?: Buffer;
	value: Buffer;
	url?: string;
	ownerPublicKeyHash?: Buffer;
	issuerPublicKeyHash?: Buffer;
	midpDomain: ECertificateMIDPDomain;
	hashAlgorithm: EPKCSMechanism;
}

export interface IX509AttributesObject
	extends ICertificateObject<ECertificateType.CKC_X_509_ATTR_CERT> {
	ownerNameDER: Buffer;
	issuerNameDER?: Buffer;
	certSn?: Buffer;
	attrTypes: Buffer;
	value: Buffer;
}

interface IKeyObject<
	C extends EObjectClass,
	T extends EKeyType,
	Consumer extends EKeyConsumer,
> extends IStoreObject<C> {
	// keyType: Consumer extends
	// 	| EKeyConsumer.C_CreateObject
	// 	| EKeyConsumer.C_UnwrapKey
	// 	? T
	// 	: T | undefined;
	keyType: T;
	id?: Buffer;
	startDate?: Date;
	endDate?: Date;
	supportsDerive?: boolean;
	isLocal?: Consumer extends
		| EKeyConsumer.C_CreateObject
		| EKeyConsumer.C_UnwrapKey
		| EKeyConsumer.C_GenerateKey
		| EKeyConsumer.C_GenerateKeyPair
		? never
		: boolean;
	keyGenMechanism?: Consumer extends
		| EKeyConsumer.C_CreateObject
		| EKeyConsumer.C_UnwrapKey
		| EKeyConsumer.C_GenerateKey
		| EKeyConsumer.C_GenerateKeyPair
		? never
		: EPKCSMechanism;
	allowedMechanisms?: EPKCSMechanism[];
}

export interface IPublicKeyObject<
	T extends EKeyType,
	Consumer extends EKeyConsumer,
> extends IKeyObject<EObjectClass.CKO_PUBLIC_KEY, T, Consumer> {
	subject?: Buffer;
	supportsEncrypt?: boolean;
	supportsVerify?: boolean;
	supportsVerifyRecover?: boolean;
	supportsWrap?: boolean;
	isTrusted?: boolean;
	// TODO: разобраться и типизировать
	wrapTemplate?: Partial<IKeyObject<any, any, any>>;
}

export type IPublicKeyRSAObject<Consumer extends EKeyConsumer> =
	IPublicKeyObject<EKeyType.CKK_RSA, Consumer> &
		(Consumer extends EKeyConsumer.C_CreateObject
			? { modulus: Buffer }
			: Consumer extends
						| EKeyConsumer.C_GenerateKey
						| EKeyConsumer.C_GenerateKeyPair
				? object
				: { modulus?: Buffer }) &
		(Consumer extends EKeyConsumer.C_CreateObject
			? object
			: Consumer extends
						| EKeyConsumer.C_GenerateKey
						| EKeyConsumer.C_GenerateKeyPair
				? { modulusBitsCount: TULong }
				: { modulusBitsCount?: TULong }) &
		(Consumer extends EKeyConsumer.C_CreateObject
			? { exponent: Buffer }
			: { exponent?: Buffer });

export type IPublicKeyECDSAObject<Consumer extends EKeyConsumer> =
	IPublicKeyObject<EKeyType.CKK_EC, Consumer> &
		Consumer extends EKeyConsumer.C_UnwrapKey
		? object
		: Consumer extends
					| EKeyConsumer.C_GenerateKey
					| EKeyConsumer.C_GenerateKeyPair
			? {
					ecParams: Buffer;
				}
			: Consumer extends EKeyConsumer.C_CreateObject
				? {
						ecParams: Buffer;
						ecPoint: Buffer;
					}
				: {
						ecParams?: Buffer;
						ecPoint?: Buffer;
					};

// TODO: реализовать работу с ГОСТ34.10
// export interface IPublicKeyGIST3410Object extends IPublicKeyObject {

// }
// export interface IPublicKeyGIST3410512Object extends IPublicKeyObject {

// }

type IPrivateKeyObject<
	T extends EKeyType,
	Consumer extends EKeyConsumer,
> = IKeyObject<EObjectClass.CKO_PRIVATE_KEY, T, Consumer> & {
	subject?: Buffer;
	isSensitive?: boolean;
	supportsDecrypt?: boolean;
	supportsSign?: boolean;
	supportsSignRecover?: boolean;
	supportsUnwrap?: boolean;
	isExtractable?: boolean;
	isAlwaysSensitive?: boolean;
	// TODO: разобраться и типизировать
	unwrapTemplate?: Partial<IKeyObject<any, any, any>>;
	alwaysAuthenticate?: boolean;
} & (Consumer extends
		| EKeyConsumer.C_CreateObject
		| EKeyConsumer.C_UnwrapKey
		| EKeyConsumer.C_GenerateKey
		| EKeyConsumer.C_GenerateKeyPair
		? object
		: {
				isNeverExtractable?: boolean;
				wrapWithTrustedOnly?: boolean;
			});

export type IPrivateKeyRSAObject<Consumer extends EKeyConsumer> =
	IPrivateKeyObject<EKeyType.CKK_RSA, Consumer> & {
		prime1?: Buffer;
		prime2?: Buffer;
		exponent1?: Buffer;
		exponent2?: Buffer;
		ctr?: Buffer;
	} & (Consumer extends EKeyConsumer.C_CreateObject
			? {
					modulus: Buffer;
					privateExponent: Buffer;
				}
			: Consumer extends
						| EKeyConsumer.C_UnwrapKey
						| EKeyConsumer.C_GenerateKey
						| EKeyConsumer.C_GenerateKeyPair
				? object
				: {
						modulus?: Buffer;
						privateExponent?: Buffer;
					});

export type TKeyTemplate<Consumer extends EKeyConsumer> =
	| IPublicKeyRSAObject<Consumer>
	//| IPublicKeyECDSAObject<Consumer>
	| IPrivateKeyRSAObject<Consumer>;
