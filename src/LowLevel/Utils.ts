import { Type } from 'ref-napi';
import { TULong } from './LibTypes';

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

export function ulongToNumber(value: TULong): number {
	if (typeof value === 'string') return Number.parseInt(value);

	return value;
}
