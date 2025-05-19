import { types } from 'ref-napi';

export function buildULong(num: number) {
	const buffer = Buffer.alloc(4);

	buffer.type = types.ulong;
	buffer.writeUInt32LE(num);

	return buffer;
}

export function buildULongArray(count: number) {
	const buffer = Buffer.alloc(4 * count);

	buffer.type = types.ulong;

	return buffer;
}
