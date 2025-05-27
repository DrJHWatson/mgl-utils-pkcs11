import { TULong } from '../LowLevel/LibTypes';
import { PKCS11Lib } from '../LowLevel/PKCS11Lib';

export class PKCS11Session {
	private readonly lib: PKCS11Lib;
	private readonly sessionId: TULong;

	constructor(lib: PKCS11Lib, sessionId: TULong) {
		this.lib = lib;
		this.sessionId = sessionId;
	}

	close() {
		this.lib.C_CloseSession(this.sessionId);
	}
}
