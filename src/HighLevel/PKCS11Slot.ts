import { ESessionInfoFlag, TULong } from '../LowLevel/LibTypes';
import { PKCS11Lib } from '../LowLevel/PKCS11Lib';
import { PKCS11Session } from './PKCS11Session';

export class PKCS11Slot {
	private lib: PKCS11Lib;
	private readonly slotId: TULong;

	constructor(lib: PKCS11Lib, slotId: TULong) {
		this.lib = lib;
		this.slotId = slotId;
	}

	getInfo() {
		return this.lib.C_GetSlotInfo(this.slotId);
	}

	openSession(flags?: { rw?: boolean; serial?: boolean }) {
		const flagsValue: number =
			(flags?.rw ? ESessionInfoFlag.CKF_RW_SESSION : 0) +
			(flags?.serial ? ESessionInfoFlag.CKF_SERIAL_SESSION : 0);
		const sessionId = this.lib.C_OpenSession(this.slotId, flagsValue);

		return new PKCS11Session(this.lib, sessionId);
	}

	closeAllSessions() {
		this.lib.C_CloseAllSessions(this.slotId);
	}
}
