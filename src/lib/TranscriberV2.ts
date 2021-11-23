import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import merge from 'lodash/merge';
import { IPipeDestination } from './types';
import PipeSource from './PipeSource';
import { float32ToUint8 } from './utils';

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
	audioThreshold: 50,
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
	private audioChunks: Uint8Array = new Uint8Array();
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
		const audioIsSpeech = false;
		const timerIsSet = this.noSpeechTimer.timer !== undefined;
		const setTimer = () =>
			(this.noSpeechTimer.timer = setTimeout(async () => {
				await this.finalize();
			}, maxSpeechPause));
		if (!this.isTranscribing && shouldAutoFinalize) {
			// User isn't currently speaking but has spoken before
			if (!audioIsSpeech && this.audioChunks.length) {
				// There is no timer so set timer
				if (!timerIsSet) {
					setTimer();
					this.noSpeechTimer.isRunning = true;
					// There is a timer, restart timer
				} else if (timerIsSet && !this.noSpeechTimer.isRunning) {
					this.noSpeechTimer.timer.refresh();
					this.noSpeechTimer.isRunning = true;
				}
				// User is currently speaking
			} else if (audioIsSpeech) {
				if (timerIsSet && this.noSpeechTimer.isRunning) {
					clearTimeout(this.noSpeechTimer.timer);
					this.noSpeechTimer.isRunning = false;
				}
				this.saveNewData(data);
			}
		}
	}

	private saveNewData(data: Float32Array) {
		const newAudioData = float32ToUint8(data);
		const arrayLength = this.audioChunks.length + newAudioData.length;
		const mergedArray = new Uint8Array(arrayLength);
		mergedArray.set(this.audioChunks, 0);
		mergedArray.set(newAudioData, this.audioChunks.length);
		this.audioChunks = mergedArray;
	}

	private async finalize() {
		this.isTranscribing = true;
		console.log('transcribing');
		this.isTranscribing = false;

		// const audio = {
		// 	content: this.audioChunks,
		// };
		// const config = {
		// 	encoding: 'LINEAR16' as const,
		// 	languageCode: this.options.language,
		// };
		// const response: AxiosResponse = await this.axiosInstance.post('', { audio, config });
		// return this.processResponseData(response.data);
	}

	private processResponseData(data: unknown) {
		console.dir(data);
	}
}
