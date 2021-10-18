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
