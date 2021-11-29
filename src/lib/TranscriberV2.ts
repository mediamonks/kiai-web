import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import merge from 'lodash/merge';
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';
import { float32ToUint8, uint8ToBase64 } from './utils';

type TTranscriberOptions = {
	language?: string;
	maxAlternatives?: number;
	minConfidence?: number;
	interimResults?: boolean;
	baseUrl?: string;
	apiKey?: string;
	shouldAutoFinalize?: boolean;
	audioThreshold?: number;
	maxSpeechPause?: number;
};

const DEFAULT_OPTIONS: TTranscriberOptions = {
	language: 'en-US',
	maxAlternatives: 1,
	minConfidence: 0,
	interimResults: false,
	baseUrl: 'https://speech.googleapis.com/v1/speech:recognize',
	shouldAutoFinalize: true,
	audioThreshold: 0.2,
	maxSpeechPause: 1500,
};

const REQUEST_CONFIG: AxiosRequestConfig = {
	method: 'post',
	headers: {
		'Content-Type': 'application/json; charset=utf-8',
	},
	responseType: 'json',
};

export default class Transcriber extends PipeSource implements IPipeDestination {
	private readonly options: TTranscriberOptions;
	private readonly axiosInstance: AxiosInstance;
	private isTranscribing: boolean = false;
	private audioChunks: Array<Float32Array> = [];
	private noSpeechTimer: { timer: NodeJS.Timeout; isRunning: boolean } = {
		timer: undefined,
		isRunning: false,
	};

	constructor(options: TTranscriberOptions = {}) {
		super();

		this.options = { ...DEFAULT_OPTIONS, ...options };

		const { apiKey, baseUrl } = this.options;

		if (!apiKey && !baseUrl) {
			throw new Error('TranscriberV2: Missing API key for Google Speech');
		}

		this.axiosInstance = axios.create(
			merge({ baseURL: baseUrl, params: { key: apiKey } }, REQUEST_CONFIG),
		);
	}

	public receive(data: Float32Array) {
		const { shouldAutoFinalize, maxSpeechPause } = this.options;
		const zeroToOne = data.map(freq => (freq + 127) / 255);
		const audioIsSpeech = zeroToOne.some(freq => freq >= this.options.audioThreshold);
		const startTimer = () => {
			this.noSpeechTimer.timer = setTimeout(async () => {
				await this.finalize();
			}, maxSpeechPause);
		};
		if (!this.isTranscribing && shouldAutoFinalize) {
			// User isn't currently speaking but has spoken before
			if (!audioIsSpeech && this.audioChunks.length) {
				// There is no timer running so set timer
				if (!this.noSpeechTimer.isRunning) {
					startTimer();
					this.noSpeechTimer.isRunning = true;
				}
				// User is currently speaking
			} else if (audioIsSpeech) {
				if (this.noSpeechTimer.isRunning) {
					clearTimeout(this.noSpeechTimer.timer);
					this.noSpeechTimer.isRunning = false;
				}
				this.audioChunks.push(data);
			}
		}
	}

	private createBase64() {
		// Concat all chunks to one Float32Array
		const mergedArray = new Float32Array(this.audioChunks.length * 1024);
		this.audioChunks.map((floatArray, index) => {
			const minOneToOne = floatArray.map(freq => freq / 127);
			mergedArray.set(minOneToOne, index);
		});
		// Convert to Uint16Array
		const uint16Array = float32ToUint8(mergedArray);
		// Convert to base64
		return uint8ToBase64(uint16Array);
	}

	private async finalize() {
		this.isTranscribing = true;
		const audio = {
			content: this.createBase64(),
		};
		const config = {
			encoding: 'LINEAR16' as const,
			languageCode: this.options.language,
		};
		const response: AxiosResponse = await this.axiosInstance.post('', { audio, config });
		this.processResponseData(response.data);
		this.isTranscribing = false;
	}

	private processResponseData(data: unknown) {
		console.dir(data);
	}
}
