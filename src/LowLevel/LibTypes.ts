import { Type } from 'ref-napi';
import { EAttributeType } from './LibEnums';

export interface IVersion {
	minor: number;
	major: number;
}

export interface ILibInfo {
	cryptokiVersion: IVersion;
	manufacturerID: string;
	flags: number;
	libraryDescription: string;
	libraryVersion: IVersion;
}

export function buildUIntArrayType(
	count: number,
	elementSize: 1 | 2 | 4,
): Type<Array<number>> {
	return {
		get(buffer, offset) {
			return new Array<number>(count).fill(undefined).map((_, i) => {
				switch (elementSize) {
					case 1:
						return buffer.readUInt8(offset + i);
					case 2:
						return buffer.readUInt16LE(offset + i * elementSize);
					case 4:
						return buffer.readUInt32LE(offset + i * elementSize);
				}
			});
		},
		indirection: 1,
		size: count * elementSize,
		set(buffer, offset, value) {
			value.forEach((element, i) => {
				switch (elementSize) {
					case 1:
						return buffer.writeUInt8(element, offset + i);
					case 2:
						return buffer.writeUInt16LE(
							element,
							offset + i * elementSize,
						);
					case 4:
						return buffer.writeUInt32LE(
							element,
							offset + i * elementSize,
						);
				}
			});
		},
		name: `array[${count}] of <${elementSize}B>`,
	};
}

export interface ISlotInfo {
	slotDescription: string;
	manufacturerID: string;
	/**
	 * CKF_TOKEN_PRESENT     0x00000001UL  /* a token is there
	 * CKF_REMOVABLE_DEVICE  0x00000002UL  /* removable devices
	 * CKF_HW_SLOT           0x00000004UL  /* hardware slot
	 */
	flags: number;
	hardwareVersion: IVersion;
	firmwareVersion: IVersion;
}

export interface ITokenInfo {
	label: string;
	manufacturerID: string;
	model: string;
	serialNumber: string;
	flags: number;

	ulMaxSessionCount: number;
	ulSessionCount: number;
	ulMaxRwSessionCount: number;
	ulRwSessionCount: number;
	ulMaxPinLen: number;
	ulMinPinLen: number;
	ulTotalPublicMemory: number;
	ulFreePublicMemory: number;
	ulTotalPrivateMemory: number;
	ulFreePrivateMemory: number;
	hardwareVersion: IVersion;
	firmwareVersion: IVersion;
	utcTime: string;
}

export interface IMechanismInfo {
	ulMinKeySize: number;
	ulMaxKeySize: number;
	flags: number;
}

export type TULong = number | string;

export enum ESessionInfoFlag {
	CKF_RW_SESSION = 0x2,
	CKF_SERIAL_SESSION = 0x4,
}

export interface ISessionInfo {
	slotID: number;
	state: number;
	flags: number;
	ulDeviceError: number;
}

export interface IAttribute {
	type: EAttributeType;
	value: Buffer;
}
