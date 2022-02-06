export type TIntentParameter = {
	name: string;
	entity: string;
	mandatory: boolean;
};

export type TIntent = {
	events: Array<string>;
	isFallback: boolean;
	phrases: {
		[language: string]: Array<string>;
	};
	parameters: Array<TIntentParameter>;
	contexts: Array<string>;
	priority: string;
};

export type TIntents = { [name: string]: TIntent };

export interface IPipeDestination {
	receive: (data: unknown) => void;
}

export type TPrimitive = string | number | boolean | null;

export type TKeyValue = {
	[key: string]: TPrimitive | Array<TPrimitive> | TKeyValue | Array<TKeyValue>;
};

export type TColor = [number, number, number];

export type TOptions = {
	[key: string]: TPrimitive | HTMLElement | TColor | AudioContext | TKeyValue;
};

export type TAudioData = {
	timeDomain?: Float32Array;
	frequency?: Float32Array;
	amplitude?: number;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
interface SpeechRecognitionEvent {
	results: Array<SpeechRecognitionResult>;
	error: string;
}

type TSpeechToTextResponse = {
	totalBilledTime: string;
	results?: Array<{
		alternatives: Array<{
			transcript: string;
			confidence: number;
		}>;
		resultEndTime: string;
		languageCode: string;
	}>;
};
