import clamp from 'lodash/clamp';

export type TMatchCandidates = {
	[key: string]: string[];
};

export function findMatch(input: string, candidates: TMatchCandidates, partial: boolean = false) {
	return Object.keys(candidates).find(key => {
		const keywords = candidates[key];
		return keywords.find(keyword => {
			const pattern = partial ? keyword : `(^|[^a-z])${keyword}([^a-z]|$)`;
			const regex = new RegExp(pattern, 'gimu');
			return regex.test(input);
		});
	});
}

export function float32ToUint8(input: Float32Array) {
	const output = new Uint8Array(input.length);

	input.forEach((value, index) => {
		let val = clamp(value, -1, 1);
		val *= (val < 0 ? 0x8000 : 0x7FFF);
		output[index] = (val / 256) + 128;
	});

	return output;
}
