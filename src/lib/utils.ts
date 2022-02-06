import clamp from 'lodash/clamp';

export type TMatchCandidates = {
	[key: string]: Array<string>;
};

export function findMatch(input: string, candidates: TMatchCandidates, partial: boolean = false): string {
	return Object.keys(candidates).find(key => {
		const keywords = candidates[key];
		return keywords.find(keyword => {
			const pattern = partial ? keyword : `(^|[^a-z])${keyword}([^a-z]|$)`;
			const regex = new RegExp(pattern, 'gimu');
			return regex.test(input);
		});
	});
}

export function float32ToUint8(input: Float32Array): Uint8Array {
	const output = new Uint8Array(input.length);

	input.forEach((value, index) => {
		let val = clamp(value, -1, 1);
		val *= val < 0 ? 0x8000 : 0x7FFF;
		output[index] = val / 256 + 128;
	});

	return output;
}

export function float32ToInt16(input: Float32Array): Int16Array {
	return Int16Array.from(input, k => 32767 * Math.min(1, k));
}

/* eslint-disable no-bitwise */
export function base64ArrayBuffer(arrayBuffer: ArrayBuffer): string {
	let base64 = '';
	const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	const bytes = new Uint8Array(arrayBuffer);
	const { byteLength } = bytes;
	const byteRemainder = byteLength % 3;
	const mainLength = byteLength - byteRemainder;

	let a;
	let b;
	let c;
	let d;
	let chunk;

	// Main loop deals with bytes in chunks of 3
	for (let index = 0; index < mainLength; index += 3) {
		// Combine the three bytes into a single integer
		chunk = (bytes[index] << 16) | (bytes[index + 1] << 8) | bytes[index + 2];

		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
		c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
		d = chunk & 63; // 63       = 2^6 - 1

		// Convert the raw binary segments to the appropriate ASCII encoding
		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
	}

	// Deal with the remaining bytes and padding
	if (byteRemainder === 1) {
		chunk = bytes[mainLength];

		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

		// Set the 4 least significant bits to zero
		b = (chunk & 3) << 4; // 3   = 2^2 - 1

		base64 += `${encodings[a] + encodings[b]}==`;
	} else if (byteRemainder === 2) {
		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

		// Set the 2 least significant bits to zero
		c = (chunk & 15) << 2; // 15    = 2^4 - 1

		base64 += `${encodings[a] + encodings[b] + encodings[c]}=`;
	}

	return base64;
}
