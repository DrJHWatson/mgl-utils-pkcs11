import { Type } from 'ref-napi';

export interface IVersion {
	minor: number;
	major: number;
}

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

export interface ILibInfo {
	cryptokiVersion: IVersion;
	manufacturerID: string;
	flags: number;
	libraryDescription: string;
	libraryVersion: IVersion;
}

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
	flags: number;
	hardwareVersion: IVersion;
	firmwareVersion: IVersion;
}

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
