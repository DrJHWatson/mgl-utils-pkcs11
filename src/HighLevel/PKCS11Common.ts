import { ISlotInfo, ITokenInfo, TULong } from '../LowLevel/LibTypes';
import { PKCS11Lib } from '../LowLevel/PKCS11Lib';
import { ESlotsGetting } from './Enums';
import { PKCS11Slot } from './PKCS11Slot';

type StringKeys<T> = {
	[P in keyof T]: T[P] extends string ? P : never;
}[keyof T];

export class PKCS11 {
	private lib: PKCS11Lib;
	constructor(path: string) {
		this.lib = new PKCS11Lib(path);
		this.lib.C_Initialize();
	}

	private slots: Map<TULong, ISlotInfo> = new Map<TULong, ISlotInfo>();
	private slotsRefreshTimer: NodeJS.Timeout;

	resetLibrary() {
		this.lib.C_Finalize();
		this.lib.C_Initialize();
	}

	getSlotsInfo(how: ESlotsGetting) {
		if (how === ESlotsGetting.WithUpdate) {
			this.slots.clear();
			this.lib.C_GetSlotList().forEach((slotId) => {
				this.slots.set(slotId, this.lib.C_GetSlotInfo(slotId));
			});
		}

		return this.slots;
	}

	startListenSlots(interval: number = 1000) {
		if (this.slotsRefreshTimer) {
			this.stopListenSlots();
		}
		this.slotsRefreshTimer = setInterval(() => {
			while (true) {
				const slotId = this.lib.C_WaitForSlotEvent(true);
				if (slotId === -1) break;
				this.slots.set(slotId, this.lib.C_GetSlotInfo(slotId));
			}
		}, interval);
	}

	stopListenSlots() {
		if (this.slotsRefreshTimer) {
			clearInterval(this.slotsRefreshTimer);
			this.slotsRefreshTimer = undefined;
		}
	}

	slotFactory(slotId: TULong) {
		return new PKCS11Slot(this.lib, slotId);
	}

	findToken(searchParams: Partial<Record<StringKeys<ITokenInfo>, RegExp>>) {
		const slots = this.lib
			.C_GetSlotList()
			.map((slotId) => {
				const slot = this.lib.C_GetSlotInfo(slotId);
				return { ...slot, slotId };
			})
			.filter((slot) => slot.isPresent);
		const tokens = slots.map((slot) => {
			const token = this.lib.C_GetTokenInfo(slot.slotId);

			if (
				Object.keys(searchParams).find((searchKey) =>
					token[searchKey]?.match(searchParams[searchKey]),
				)
			)
				return {
					...token,
					slotId: slot.slotId,
				};

			return null;
		});
		const filtered = tokens.filter((value) => value);

		return filtered;
	}
}
