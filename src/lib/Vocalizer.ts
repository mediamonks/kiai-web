import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import merge from 'lodash/merge';
import md5 from 'md5';
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';

type TVocalizerOptions = {
	language?: string;
	voice?: string;
	speakingRate?: number;
	pitch?: number;
	volumeGainDb?: number;
	apiKey?: string;
	audioContext?: AudioContext;
	preserveOrder?: boolean;
	baseUrl?: string;
};

type TTtsResponse = {
	audioContent: string;
};

type TRequestQueue = {
	hash: string;
	promise: Promise<void>;
	audioBuffer?: AudioBuffer;
}[];

const REQUEST_CONFIG: AxiosRequestConfig = {
	method: 'post',
	headers: {
		'Content-Type': 'application/json; charset=utf-8',
	},
	responseType: 'json',
};

const DEFAULT_OPTIONS: TVocalizerOptions = {
	language: 'en-US',
	voice: 'en-US-Wavenet-D',
	preserveOrder: false,
	baseUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize',
};

export default class Vocalizer extends PipeSource implements IPipeDestination {
	private readonly axiosInstance: AxiosInstance;
	private readonly options: TVocalizerOptions;
	private readonly audioContext: AudioContext;
	private requests: TRequestQueue = [];

	constructor(options: TVocalizerOptions = {}) {
		super();

		this.options = { ...DEFAULT_OPTIONS, ...options };

		const { apiKey, baseUrl } = this.options;

		if (!apiKey && !baseUrl) {
			throw new Error('Vocalizer: Missing API key for Google Text-to-speech');
		}

		this.audioContext = this.options.audioContext || new AudioContext();

		this.axiosInstance = axios.create(
			merge({ baseURL: baseUrl, params: { key: apiKey } }, REQUEST_CONFIG),
		);
	}

	public receive(text: string): void {
		const hash = md5(text);
		const promise = this.synthesize(text)
			.then(audioBuffer => {
				if (!this.options.preserveOrder) {
					this.publish(audioBuffer);
					return;
				}

				const request = this.requests.find(req => req.hash === hash);
				if (!request) throw new Error('Vocalizer: No matching request found for response');
				request.audioBuffer = audioBuffer;
				this.processRequestQueue();
			})
			.catch(error => this.emit('error', error));

		this.requests.push({ hash, promise });
	}

	public synthesize(text: string): Promise<AudioBuffer> {
		const input = { ssml: text };
		const voice = {
			languageCode: this.options.language,
			name: this.options.voice,
		};
		const audioConfig = {
			audioEncoding: 'LINEAR16',
			speakingRate: this.options.speakingRate,
			pitch: this.options.pitch,
			volumeGainDb: this.options.volumeGainDb,
			effectsProfileId: ['large-home-entertainment-class-device'],
		};

		return this.axiosInstance
			.post('', { input, voice, audioConfig })
			.then((response: AxiosResponse) => this.processResponse(response.data));
	}

	private processRequestQueue() {
		setImmediate(() => {
			if (!this.requests.length) return;
			if (!this.requests[0].audioBuffer) return;
			this.publish(this.requests.shift().audioBuffer);
			this.processRequestQueue();
		});
	}

	private processResponse(data: TTtsResponse): Promise<AudioBuffer> {
		const arrayBuffer =
			Uint8Array.from(atob(data.audioContent), char => char.charCodeAt(0)).buffer;
		return this.audioContext.decodeAudioData(arrayBuffer);
	}
}
