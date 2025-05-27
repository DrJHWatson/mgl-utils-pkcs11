import { readPointer, Type } from 'ref-napi';
import {
	IAttribute,
	ILibInfo,
	IMechanismInfo,
	ISessionInfo,
	ISlotInfo,
	ITokenInfo,
	IVersion,
} from './LibTypes';

export const attributeType: Type<IAttribute> = {
	get(buffer, offset) {
		const length = buffer.readUInt32LE(offset + 8);
		return {
			type: buffer.readUInt32LE(offset),
			value: readPointer(buffer, offset + 4, length),
		};
	},
	set(buffer, offset, value) {
		buffer.writeUInt32LE(value.type, offset);
		buffer.writeUInt32LE(value.value.address(), offset + 4);
		buffer.writeUInt32LE(value.value.length, offset + 8);
	},
	indirection: 1,
	size: 12,
	name: 'attribute',
};

export const sessionInfoType: Type<ISessionInfo> = {
	get(buffer, offset) {
		return {
			slotID: buffer.readUInt32LE(offset),
			state: buffer.readUInt32LE(offset + 4),
			flags: buffer.readUInt32LE(offset + 8),
			ulDeviceError: buffer.readUInt32LE(offset + 12),
		};
	},
	set(buffer, offset, value) {
		buffer.writeUInt32LE(value.slotID, offset);
		buffer.writeUInt32LE(value.state, offset + 4);
		buffer.writeUInt32LE(value.flags, offset + 8);
		buffer.writeUInt32LE(value.ulDeviceError, offset + 12);
	},
	indirection: 1,
	size: 16,
	name: 'session_info',
};

export const mechanismInfoType: Type<IMechanismInfo> = {
	get(buffer, offset) {
		return {
			ulMinKeySize: buffer.readUInt32LE(offset),
			ulMaxKeySize: buffer.readUInt32LE(offset + 4),
			flags: buffer.readUInt32LE(offset + 8),
		};
	},
	set(buffer, offset, value) {
		buffer.writeUInt32LE(value.ulMinKeySize, offset);
		buffer.writeUInt32LE(value.ulMaxKeySize, offset + 4);
		buffer.writeUInt32LE(value.flags, offset + 8);
	},
	indirection: 1,
	size: 12,
	name: 'mechanism_info',
};

export const tokenInfoType: Type<ITokenInfo> = {
	get(buffer, offset) {
		console.log(buffer.subarray(offset + 144, offset + 160));
		return {
			label: buffer.subarray(offset, offset + 32).toString(),
			manufacturerID: buffer
				.subarray(offset + 32, offset + 64)
				.toString(),
			model: buffer.subarray(offset + 64, offset + 80).toString(),
			serialNumber: buffer.subarray(offset + 80, offset + 96).toString(),
			flags: buffer.readUInt32LE(offset + 96),

			ulMaxSessionCount: buffer.readUInt32LE(offset + 100),
			ulSessionCount: buffer.readUInt32LE(offset + 104),
			ulMaxRwSessionCount: buffer.readUInt32LE(offset + 108),
			ulRwSessionCount: buffer.readUInt32LE(offset + 112),
			ulMaxPinLen: buffer.readUInt32LE(offset + 116),
			ulMinPinLen: buffer.readUInt32LE(offset + 120),
			ulTotalPublicMemory: buffer.readUInt32LE(offset + 124),
			ulFreePublicMemory: buffer.readUInt32LE(offset + 128),
			ulTotalPrivateMemory: buffer.readUInt32LE(offset + 132),
			ulFreePrivateMemory: buffer.readUInt32LE(offset + 136),
			hardwareVersion: versionType.get(buffer, offset + 140),
			firmwareVersion: versionType.get(buffer, offset + 142),
			utcTime: buffer.subarray(offset + 144, offset + 160).toString(),
		};
	},
	set(buffer, offset, value) {
		buffer.writeCString(value.label, offset, 'utf8');
		buffer.writeCString(value.manufacturerID, offset + 32, 'utf8');
		buffer.writeCString(value.model, offset + 64, 'utf8');
		buffer.writeCString(value.serialNumber, offset + 80, 'ansi');
		buffer.writeUInt32LE(value.flags, offset + 96);

		buffer.writeUInt32LE(value.ulMaxSessionCount, offset + 100);
		buffer.writeUInt32LE(value.ulSessionCount, offset + 104);
		buffer.writeUInt32LE(value.ulMaxRwSessionCount, offset + 108);
		buffer.writeUInt32LE(value.ulRwSessionCount, offset + 112);
		buffer.writeUInt32LE(value.ulMaxPinLen, offset + 116);
		buffer.writeUInt32LE(value.ulMinPinLen, offset + 120);
		buffer.writeUInt32LE(value.ulTotalPublicMemory, offset + 124);
		buffer.writeUInt32LE(value.ulFreePublicMemory, offset + 128);
		buffer.writeUInt32LE(value.ulTotalPrivateMemory, offset + 132);
		buffer.writeUInt32LE(value.ulFreePrivateMemory, offset + 136);
		versionType.set(buffer, offset + 140, value.hardwareVersion);
		versionType.set(buffer, offset + 142, value.firmwareVersion);
		buffer.writeCString(value.utcTime, offset + 144, 'utf8');
	},
	indirection: 1,
	size: 160,
	name: 'token_info',
};

export const slotInfoType: Type<ISlotInfo> = {
	get(buffer, offset) {
		return {
			slotDescription: buffer.subarray(offset, offset + 64).toString(),
			manufacturerID: buffer
				.subarray(offset + 64, offset + 96)
				.toString(),
			flags: buffer.readUInt32LE(offset + 96),
			hardwareVersion: versionType.get(buffer, offset + 100),
			firmwareVersion: versionType.get(buffer, offset + 102),
		};
	},
	set(buffer, offset, value) {
		buffer.writeCString(value.slotDescription, offset, 'utf8');
		buffer.writeCString(value.manufacturerID, offset + 64, 'utf8');
		buffer.writeUInt32LE(value.flags, offset + 96);
		versionType.set(buffer, offset + 100, value.hardwareVersion);
		versionType.set(buffer, offset + 102, value.firmwareVersion);
	},
	indirection: 1,
	size: 104,
	name: 'slot_info',
};

export const libInfoType: Type<ILibInfo> = {
	size: 72,
	indirection: 1,
	name: 'lib_info',
	get(buffer, offset) {
		return {
			cryptokiVersion: versionType.get(buffer, offset),
			manufacturerID: buffer.subarray(offset + 2, offset + 34).toString(),
			flags: buffer.readUint32LE(offset + 34),
			libraryDescription: buffer
				.subarray(offset + 38, offset + 70)
				.toString(),
			libraryVersion: versionType.get(buffer, offset + 70),
		};
	},
	set(buffer, offset, value) {
		versionType.set(buffer, offset, value.cryptokiVersion);
		buffer.writeCString(value.manufacturerID, offset + 2, 'utf8');
		buffer.writeUInt32LE(value.flags, offset + 34);
		buffer.writeCString(value.libraryDescription, offset + 38);
		versionType.set(buffer, offset + 70, value.libraryVersion);
	},
};

export const versionType: Type<IVersion> = {
	get(buffer, offset) {
		return {
			major: buffer.readUint8(offset),
			minor: buffer.readUint8(offset + 1),
		};
	},
	set(buffer, offset, value) {
		buffer.writeUInt8(value.major, offset);
		buffer.writeUInt8(value.minor, offset + 1);
	},
	indirection: 1,
	size: 2,
	name: 'version',
};
