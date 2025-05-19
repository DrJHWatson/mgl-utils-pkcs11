export enum EPKSCFunctions {
	/* инициализирует библиотеку */
	C_Initialize = 'C_Initialize',
	/* деинициализирует библиотеку */
	C_Finalize = 'C_Finalize',
	/* получает информацию о библиотеке */
	C_GetInfo = 'C_GetInfo',
	/* получает список всех функций в библиотеке */
	C_GetFunctionList = 'C_GetFunctionList',
	/* получает список слотов в системе */
	C_GetSlotList = 'C_GetSlotList',
	/* получает информацию о конкретном слоте */
	C_GetSlotInfo = 'C_GetSlotInfo',
	/* получает информацию о Рутокен в конкретном слоте */
	C_GetTokenInfo = 'C_GetTokenInfo',
	/* ожидает событие в любом слоте */
	C_WaitForSlotEvent = 'C_WaitForSlotEvent',
	/* получает список механизмов, поддерживаемых Рутокен */
	C_GetMechanismList = 'C_GetMechanismList',
	/* получает информацию о конкретном механизме */
	C_GetMechanismInfo = 'C_GetMechanismInfo',
	/* инициализирует память Рутокен */
	C_InitToken = 'C_InitToken',
	/* инициализирует PIN−код Пользователя Рутокен */
	C_InitPIN = 'C_InitPIN',
	/* изменяет PIN−код в пользователя Рутокен, выполнившего вход */
	C_SetPIN = 'C_SetPIN',
	/* открывает новую сессию с Рутокен */
	C_OpenSession = 'C_OpenSession',
	/* закрывает сессию */
	C_CloseSession = 'C_CloseSession',
	/* закрывает все сессии */
	C_CloseAllSessions = 'C_CloseAllSessions',
	/* получает информацию о конкретной сессии */
	C_GetSessionInfo = 'C_GetSessionInfo',
	/* получает информацию о состоянии выполнения криптографической операции */
	C_GetOperationState = 'C_GetOperationState',
	/* изменяет состояние выполнения криптографической операции */
	C_SetOperationState = 'C_SetOperationState',
	/* выполняет вход пользователя / администратора */
	C_Login = 'C_Login',
	/* выполняет выход пользователя / администратора */
	C_Logout = 'C_Logout',
	/* создает объект */
	C_CreateObject = 'C_CreateObject',
	/* создает копию объект */
	C_CopyObject = 'C_CopyObject',
	/* уничтожает объект */
	C_DestroyObject = 'C_DestroyObject',
	/* получает информацию о размере объекта в байтах */
	C_GetObjectSize = 'C_GetObjectSize',
	/* получает информацию об атрибутах объекта */
	C_GetAttributeValue = 'C_GetAttributeValue',
	/* изменяет значение атрибута объекта */
	C_SetAttributeValue = 'C_SetAttributeValue',
	/* инициализирует процесс поиска объекта */
	C_FindObjectsInit = 'C_FindObjectsInit',
	/* осуществляет поиск объекта по заданным условиям */
	C_FindObjects = 'C_FindObjects',
	/* завершает процесс поиска объекта */
	C_FindObjectsFinal = 'C_FindObjectsFinal',
	/* инициализирует процесс шифрования */
	C_EncryptInit = 'C_EncryptInit',
	/* шифрует данные целиком */
	C_Encrypt = 'C_Encrypt',
	/* продолжает шифрование данных по частям */
	C_EncryptUpdate = 'C_EncryptUpdate',
	/* завершает шифрование данных по частям */
	C_EncryptFinal = 'C_EncryptFinal',
	/* инициализирует процесс расшифрования */
	C_DecryptInit = 'C_DecryptInit',
	/* расшифровывает данные целиком */
	C_Decrypt = 'C_Decrypt',
	/* продолжает расшифрование данных по частям */
	C_DecryptUpdate = 'C_DecryptUpdate',
	/* завершает расшифрование данных по частям */
	C_DecryptFinal = 'C_DecryptFinal',
	/* инициализирует процесс хеширования */
	C_DigestInit = 'C_DigestInit',
	/* хеширует данные целиком */
	C_Digest = 'C_Digest',
	/* продолжает хеширование данных по частям */
	C_DigestUpdate = 'C_DigestUpdate',
	/* хеширует ключ */
	C_DigestKey = 'C_DigestKey',
	/* завершает хеширование данных по частям */
	C_DigestFinal = 'C_DigestFinal',
	/* инициализирует процесс подписи */
	C_SignInit = 'C_SignInit',
	/* подписывает данные целиком */
	C_Sign = 'C_Sign',
	/* продолжает подпись данных по частям */
	C_SignUpdate = 'C_SignUpdate',
	/* завершает подпись данных по частям */
	C_SignFinal = 'C_SignFinal',
	/* инициализирует процесс подписи с восстановлением */
	C_SignRecoverInit = 'C_SignRecoverInit',
	/* подписывает данные целиком подписью с восстановлением */
	C_SignRecover = 'C_SignRecover',
	/* инициализирует процесс проверки подписи */
	C_VerifyInit = 'C_VerifyInit',
	/* проверяет подпись данных, подписанных целиком */
	C_Verify = 'C_Verify',
	/* продолжает проверку подписи данных, подписанных по частям */
	C_VerifyUpdate = 'C_VerifyUpdate',
	/* завершает проверку подписи данных, подписанных по частям */
	C_VerifyFinal = 'C_VerifyFinal',
	/* инициализирует операцию проверки подписи с восстановлением */
	C_VerifyRecoverInit = 'C_VerifyRecoverInit',
	/* проверяет подпись с восстановлением подписанных целиком данных */
	C_VerifyRecover = 'C_VerifyRecover',
	/* продолжает одновременное хеширование и шифрование данных по частям */
	C_DigestEncryptUpdate = 'C_DigestEncryptUpdate',
	/* продолжает одновременное расшифрование и хеширование данных по частям */
	C_DecryptDigestUpdate = 'C_DecryptDigestUpdate',
	/* продолжает одновременную подпись и шифрование данных по частям */
	C_SignEncryptUpdate = 'C_SignEncryptUpdate',
	/* продолжает одновременное расшифрование и проверку подписи данных, подписанных по частям */
	C_DecryptVerifyUpdate = 'C_DecryptVerifyUpdate',
	/* генерирует секретный ключ на Рутокен */
	C_GenerateKey = 'C_GenerateKey',
	/* генерирует пару «открытый/закрытый ключ» */
	C_GenerateKeyPair = 'C_GenerateKeyPair',
	/* шифрует ключ */
	C_WrapKey = 'C_WrapKey',
	/* расшифровывает ключ */
	C_UnwrapKey = 'C_UnwrapKey',
	/* вырабатывает ключ из основного ключа */
	C_DeriveKey = 'C_DeriveKey',
	/* задает инициализирующее значение для генератора случайных чисел */
	C_SeedRandom = 'C_SeedRandom',
	/* генерирует случайное число */
	C_GenerateRandom = 'C_GenerateRandom',
	/* устаревшая функция, всегда возвращает CKR_FUNCTION_NOT_PARALLEL */
	C_GetFunctionStatus = 'C_GetFunctionStatus',
	/* устаревшая функция, всегда возвращает CKR_FUNCTION_NOT_PARALLEL */
	C_CancelFunction = 'C_CancelFunction',
}

export enum EPKCSResults {
	CKR_OK = 0x0,
	CKR_CANCEL = 0x1,
	CKR_HOST_MEMORY = 0x2,
	CKR_SLOT_ID_INVALID = 0x3,
	CKR_GENERAL_ERROR = 0x5,
	CKR_FUNCTION_FAILED = 0x6,
	CKR_ARGUMENTS_BAD = 0x7,
	CKR_NO_EVENT = 0x8,
	CKR_NEED_TO_CREATE_THREADS = 0x9,
	CKR_CANT_LOCK = 0xa,
	CKR_ATTRIBUTE_READ_ONLY = 0x10,
	CKR_ATTRIBUTE_SENSITIVE = 0x11,
	CKR_ATTRIBUTE_TYPE_INVALID = 0x12,
	CKR_ATTRIBUTE_VALUE_INVALID = 0x13,
	CKR_ACTION_PROHIBITED = 0x1b,
	CKR_DATA_INVALID = 0x20,
	CKR_DATA_LEN_RANGE = 0x21,
	CKR_DEVICE_ERROR = 0x30,
	CKR_DEVICE_MEMORY = 0x31,
	CKR_DEVICE_REMOVED = 0x32,
	CKR_ENCRYPTED_DATA_INVALID = 0x40,
	CKR_ENCRYPTED_DATA_LEN_RANGE = 0x41,
	CKR_FUNCTION_CANCELED = 0x50,
	CKR_FUNCTION_NOT_PARALLEL = 0x51,
	CKR_FUNCTION_NOT_SUPPORTED = 0x54,
	CKR_KEY_HANDLE_INVALID = 0x60,
	CKR_KEY_SIZE_RANGE = 0x62,
	CKR_KEY_TYPE_INCONSISTENT = 0x63,
	CKR_KEY_NOT_NEEDED = 0x64,
	CKR_KEY_CHANGED = 0x65,
	CKR_KEY_NEEDED = 0x66,
	CKR_KEY_INDIGESTIBLE = 0x67,
	CKR_KEY_FUNCTION_NOT_PERMITTED = 0x68,
	CKR_KEY_NOT_WRAPPABLE = 0x69,
	CKR_KEY_UNEXTRACTABLE = 0x6a,
	CKR_MECHANISM_INVALID = 0x70,
	CKR_MECHANISM_PARAM_INVALID = 0x71,
	CKR_OBJECT_HANDLE_INVALID = 0x82,
	CKR_OPERATION_ACTIVE = 0x90,
	CKR_OPERATION_NOT_INITIALIZED = 0x91,
	CKR_PIN_INCORRECT = 0xa0,
	CKR_PIN_INVALID = 0xa1,
	CKR_PIN_LEN_RANGE = 0xa2,
	CKR_PIN_EXPIRED = 0xa3,
	CKR_PIN_LOCKED = 0xa4,
	CKR_SESSION_CLOSED = 0xb0,
	CKR_SESSION_COUNT = 0xb1,
	CKR_SESSION_HANDLE_INVALID = 0xb3,
	CKR_SESSION_PARALLEL_NOT_SUPPORTED = 0xb4,
	CKR_SESSION_READ_ONLY = 0xb5,
	CKR_SESSION_EXISTS = 0xb6,
	CKR_SESSION_READ_ONLY_EXISTS = 0xb7,
	CKR_SESSION_READ_WRITE_SO_EXISTS = 0xb8,
	CKR_SIGNATURE_INVALID = 0xc0,
	CKR_SIGNATURE_LEN_RANGE = 0xc1,
	CKR_TEMPLATE_INCOMPLETE = 0xd0,
	CKR_TEMPLATE_INCONSISTENT = 0xd1,
	CKR_TOKEN_NOT_PRESENT = 0xe0,
	CKR_TOKEN_NOT_RECOGNIZED = 0xe1,
	CKR_TOKEN_WRITE_PROTECTED = 0xe2,
	CKR_UNWRAPPING_KEY_HANDLE_INVALID = 0xf0,
	CKR_UNWRAPPING_KEY_SIZE_RANGE = 0xf1,
	CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT = 0xf2,
	CKR_USER_ALREADY_LOGGED_IN = 0x100,
	CKR_USER_NOT_LOGGED_IN = 0x101,
	CKR_USER_PIN_NOT_INITIALIZED = 0x102,
	CKR_USER_TYPE_INVALID = 0x103,
	CKR_USER_ANOTHER_ALREADY_LOGGED_IN = 0x104,
	CKR_USER_TOO_MANY_TYPES = 0x105,
	CKR_WRAPPED_KEY_INVALID = 0x110,
	CKR_WRAPPED_KEY_LEN_RANGE = 0x112,
	CKR_WRAPPING_KEY_HANDLE_INVALID = 0x113,
	CKR_WRAPPING_KEY_SIZE_RANGE = 0x114,
	CKR_WRAPPING_KEY_TYPE_INCONSISTENT = 0x115,
	CKR_RANDOM_SEED_NOT_SUPPORTED = 0x120,
	CKR_RANDOM_NO_RNG = 0x121,
	CKR_DOMAIN_PARAMS_INVALID = 0x130,
	CKR_CURVE_NOT_SUPPORTED = 0x140,
	CKR_BUFFER_TOO_SMALL = 0x150,
	CKR_SAVED_STATE_INVALID = 0x160,
	CKR_INFORMATION_SENSITIVE = 0x170,
	CKR_STATE_UNSAVEABLE = 0x180,
	CKR_CRYPTOKI_NOT_INITIALIZED = 0x190,
	CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x191,
	CKR_MUTEX_BAD = 0x1a0,
	CKR_MUTEX_NOT_LOCKED = 0x1a1,
	CKR_NEW_PIN_MODE = 0x1b0,
	CKR_NEXT_OTP = 0x1b1,
	CKR_EXCEEDED_MAX_ITERATIONS = 0x1c0,
	CKR_FIPS_SELF_TEST_FAILED = 0x1c1,
	CKR_LIBRARY_LOAD_FAILED = 0x1c2,
	CKR_PIN_TOO_WEAK = 0x1c3,
	CKR_PUBLIC_KEY_INVALID = 0x1c4,
	CKR_FUNCTION_REJECTED = 0x200,
	CKR_VENDOR_DEFINED = 0x80000000,
}
