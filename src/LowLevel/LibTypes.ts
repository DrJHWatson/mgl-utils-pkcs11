import { EAttributeType, EPKCSMechanism } from './LibEnums';

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

export interface ISlotInfo {
	slotDescription: string;
	manufacturerID: string;
	flags: number;
	isPresent: boolean;
	isRemovable: boolean;
	isHardware: boolean;
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

export interface IMechanism {
	type: EPKCSMechanism;
	data: Buffer;
}
