import { Type } from 'ref-napi';
import { IAttribute, TULong } from './LibTypes';
import { EKeyConsumer } from './LibEnums';
import { TKeyTemplate } from './LibObjects';
import { objectToAttributes } from './LibObjectTemplates';

export function buildUIntArrayType(
	count: number,
	elementSize: 4,
): Type<Array<number>> {
	return {
		get(buffer, offset) {
			return new Array<number>(count).fill(undefined).map((_, i) => {
				switch (elementSize) {
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

export function makeKeyTemplate<Consumer extends EKeyConsumer>(
	objectTemplate: TKeyTemplate<Consumer>,
): IAttribute[] {
	return objectToAttributes(objectTemplate);
}
