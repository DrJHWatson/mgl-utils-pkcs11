import { EAttributeType } from './LibEnums';
import { IAttribute } from './LibTypes';

const OBJECT_TEMPLATE_PROPERTIES = {
	class: EAttributeType.CKA_CLASS,
	storeInToken: EAttributeType.CKA_TOKEN,
	isPrivate: EAttributeType.CKA_PRIVATE,
	label: EAttributeType.CKA_LABEL,
	application: EAttributeType.CKA_APPLICATION,
	value: EAttributeType.CKA_VALUE,
	objectId: EAttributeType.CKA_OBJECT_ID,
	certificateType: EAttributeType.CKA_CERTIFICATE_TYPE,
	issuer: EAttributeType.CKA_ISSUER,
	sn: EAttributeType.CKA_SERIAL_NUMBER,
	acIssuer: EAttributeType.CKA_AC_ISSUER,
	owner: EAttributeType.CKA_OWNER,
	attrTypes: EAttributeType.CKA_ATTR_TYPES,
	isTrusted: EAttributeType.CKA_TRUSTED,
	certificateCategory: EAttributeType.CKA_CERTIFICATE_CATEGORY,
	midpSecurityDomain: EAttributeType.CKA_JAVA_MIDP_SECURITY_DOMAIN,
	url: EAttributeType.CKA_URL,
	subjectPublicKeyHash: EAttributeType.CKA_HASH_OF_SUBJECT_PUBLIC_KEY,
	issuerPublicKeyHash: EAttributeType.CKA_HASH_OF_ISSUER_PUBLIC_KEY,
	publicKeysHashAlgorythm: EAttributeType.CKA_NAME_HASH_ALGORITHM,
	checkValue: EAttributeType.CKA_CHECK_VALUE,

	keyType: EAttributeType.CKA_KEY_TYPE,
	subject: EAttributeType.CKA_SUBJECT,
	id: EAttributeType.CKA_ID,
	isSensitive: EAttributeType.CKA_SENSITIVE,
	supportsEncrypt: EAttributeType.CKA_ENCRYPT,
	supportsDecrypt: EAttributeType.CKA_DECRYPT,
	supportsWrap: EAttributeType.CKA_WRAP,
	supportsUnwrap: EAttributeType.CKA_UNWRAP,
	supportsSign: EAttributeType.CKA_SIGN,
	supportsSignRecover: EAttributeType.CKA_SIGN_RECOVER,
	supportsVerify: EAttributeType.CKA_VERIFY,
	suppoertsVerifyRecover: EAttributeType.CKA_VERIFY_RECOVER,
	supportsDerive: EAttributeType.CKA_DERIVE,
	startDate: EAttributeType.CKA_START_DATE,
	endDate: EAttributeType.CKA_END_DATE,
	modulus: EAttributeType.CKA_MODULUS,
	modulusBitsCount: EAttributeType.CKA_MODULUS_BITS,
	publicExponent: EAttributeType.CKA_PUBLIC_EXPONENT,
	privateExponent: EAttributeType.CKA_PRIVATE_EXPONENT,
	prime1: EAttributeType.CKA_PRIME_1,
	prime2: EAttributeType.CKA_PRIME_2,
	exponent1: EAttributeType.CKA_EXPONENT_1,
	exponent2: EAttributeType.CKA_EXPONENT_2,
	ctr: EAttributeType.CKA_COEFFICIENT,
	// EAttributeType.CKA_PUBLIC_KEY_INFO,
	// EAttributeType.CKA_PRIME,
	// EAttributeType.CKA_SUBPRIME,
	// EAttributeType.CKA_BASE,

	// EAttributeType.CKA_PRIME_BITS,
	// EAttributeType.CKA_SUBPRIME_BITS,
	// EAttributeType.CKA_VALUE_BITS,
	valueLength: EAttributeType.CKA_VALUE_LEN,
	isExtractable: EAttributeType.CKA_EXTRACTABLE,
	isLocal: EAttributeType.CKA_LOCAL,
	isNeverExtractable: EAttributeType.CKA_NEVER_EXTRACTABLE,
	isAlwaysSensitive: EAttributeType.CKA_ALWAYS_SENSITIVE,
	keyGenMechanism: EAttributeType.CKA_KEY_GEN_MECHANISM,

	isModifiable: EAttributeType.CKA_MODIFIABLE,
	isCopiable: EAttributeType.CKA_COPYABLE,

	/* new for v2.40 */
	// EAttributeType.CKA_DESTROYABLE,
	ecParams: EAttributeType.CKA_EC_PARAMS,
	ecPoint: EAttributeType.CKA_EC_POINT,

	// EAttributeType.CKA_SECONDARY_AUTH /* Deprecated */,
	// EAttributeType.CKA_AUTH_PIN_FLAGS /* Deprecated */,

	requirePinEveryTime: EAttributeType.CKA_ALWAYS_AUTHENTICATE,

	wrapWithTrustedOnly: EAttributeType.CKA_WRAP_WITH_TRUSTED,
	wrapTemplate: EAttributeType.CKA_WRAP_TEMPLATE,
	unwrapTemplate: EAttributeType.CKA_UNWRAP_TEMPLATE,

	// EAttributeType.CKA_OTP_FORMAT,
	// EAttributeType.CKA_OTP_LENGTH,
	// EAttributeType.CKA_OTP_TIME_INTERVAL,
	// EAttributeType.CKA_OTP_USER_FRIENDLY_MODE,
	// EAttributeType.CKA_OTP_CHALLENGE_REQUIREMENT,
	// EAttributeType.CKA_OTP_TIME_REQUIREMENT,
	// EAttributeType.CKA_OTP_COUNTER_REQUIREMENT,
	// EAttributeType.CKA_OTP_PIN_REQUIREMENT,
	// EAttributeType.CKA_OTP_COUNTER,
	// EAttributeType.CKA_OTP_TIME,
	// EAttributeType.CKA_OTP_USER_IDENTIFIER,
	// EAttributeType.CKA_OTP_SERVICE_IDENTIFIER,
	// EAttributeType.CKA_OTP_SERVICE_LOGO,
	// EAttributeType.CKA_OTP_SERVICE_LOGO_TYPE,

	gost3410Params: EAttributeType.CKA_GOSTR3410_PARAMS,
	gost3411Params: EAttributeType.CKA_GOSTR3411_PARAMS,
	gost28147Params: EAttributeType.CKA_GOST28147_PARAMS,

	// EAttributeType.CKA_HW_FEATURE_TYPE,
	// EAttributeType.CKA_RESET_ON_INIT,
	// EAttributeType.CKA_HAS_RESET,

	// EAttributeType.CKA_PIXEL_X,
	// EAttributeType.CKA_PIXEL_Y,
	// EAttributeType.CKA_RESOLUTION,
	// EAttributeType.CKA_CHAR_ROWS,
	// EAttributeType.CKA_CHAR_COLUMNS,
	// EAttributeType.CKA_COLOR,
	// EAttributeType.CKA_BITS_PER_PIXEL,
	// EAttributeType.CKA_CHAR_SETS,
	// EAttributeType.CKA_ENCODING_METHODS,
	// EAttributeType.CKA_MIME_TYPES,
	// EAttributeType.CKA_MECHANISM_TYPE,
	// EAttributeType.CKA_REQUIRED_CMS_ATTRIBUTES,
	// EAttributeType.CKA_DEFAULT_CMS_ATTRIBUTES,
	// EAttributeType.CKA_SUPPORTED_CMS_ATTRIBUTES,
	allowedMechanisms: EAttributeType.CKA_ALLOWED_MECHANISMS,
};

function getValueSize(value): number {
	if (value === undefined) return 0;
	if (Buffer.isBuffer(value)) return value.length;
	if (typeof value === 'boolean') return 1;
	if (typeof value === 'number') {
		return 4;
	}
	throw new Error(`unsupported type: ${value} ${typeof value}`);
}

export function objectToAttributes(object: {
	[key in keyof typeof OBJECT_TEMPLATE_PROPERTIES]?: unknown;
}): IAttribute[] {
	return Object.keys(object).map((fieldName) => {
		const attType = OBJECT_TEMPLATE_PROPERTIES[fieldName];

		if (attType === undefined)
			throw new Error(fieldName + ' is not supported attribute');

		const objectValue = object[fieldName];
		if (objectValue === undefined)
			return {
				type: attType,
				value: Buffer.alloc(0),
			};
		if (Buffer.isBuffer(objectValue))
			return {
				type: attType,
				value: objectValue,
			};
		if (typeof objectValue === 'boolean')
			return {
				type: attType,
				value: Buffer.from([objectValue ? 1 : 0]),
			};
		if (typeof objectValue === 'number') {
			const ulongBuffer = Buffer.alloc(4);
			ulongBuffer.writeUInt32LE(objectValue);
			return {
				type: attType,
				value: ulongBuffer,
			};
		}
		if (Array.isArray(objectValue)) {
			if (objectValue.length === 0)
				return {
					type: attType,
					value: Buffer.alloc(0),
				};
			const elementSize = getValueSize(objectValue[0]);
			const result = Buffer.alloc(elementSize * objectValue.length);
			objectValue.forEach((element, i) => {
				if (typeof element === 'number') {
					result.writeUInt32LE(element, elementSize * i);
					return;
				}

				throw new Error(
					`unsupported type: ${element} ${typeof element}`,
				);
			});
			return {
				type: attType,
				value: result,
			};
		}
		throw new Error(`unsupported type: ${fieldName} ${typeof objectValue}`);
	});
}
