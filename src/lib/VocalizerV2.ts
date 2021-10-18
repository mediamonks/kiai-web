import textToSpeech, { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

type TVocalizerOptions = {
	language?: string;
	voice?: string;
	speakingRate?: number;
	pitch?: number;
	volumeGainDb?: number;
	credentials?: {
		'private_key': string;
		'client_email': string;
	};
};

type TTtsResponse = {
	audioContent: ArrayBuffer;
};

const defaultOptions: TVocalizerOptions = {
	language: 'en-US',
	voice: 'en-US-Wavenet-D',
};

export default class VocalizerV2 extends PipeSource implements IPipeDestination {
	private readonly options: TVocalizerOptions;
	private readonly client: TextToSpeechClient;

	constructor(options: TVocalizerOptions = {}) {
		super();

		this.options = { ...defaultOptions, ...options };

		if (!this.options.credentials) throw new Error('Vocalizer: No credentials provided');

		// eslint-disable-next-line camelcase
		const { client_email, private_key } = this.options.credentials;
		// eslint-disable-next-line camelcase
		const credentials = { client_email, private_key };
		this.client = new textToSpeech.TextToSpeechClient({ credentials });
	}

	public receive(text: string): void {
		const input = { text }; // or { ssml }
		const voice = {
			languageCode: this.options.language,
			name: this.options.voice,
		};
		const audioEncoding = 'LINEAR16' as const;
		const audioConfig = {
			audioEncoding,
			speakingRate: this.options.speakingRate,
			pitch: this.options.pitch,
			volumeGainDb: this.options.volumeGainDb,
			effectsProfileId: ['large-home-entertainment-class-device'],
		};
		this.client
			.synthesizeSpeech({ input, voice, audioConfig })
			.then(([response]: any[]) => {
				this.processResponse(response);
			});
	}

	private processResponse(data: TTtsResponse): void {
		this.publish(data.audioContent);
	}
}
