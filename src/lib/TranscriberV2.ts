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
};

const DEFAULT_OPTIONS: TTranscriberOptions = {
	language: 'en-US',
	maxAlternatives: 1,
	minConfidence: 0,
	interimResults: false,
	baseUrl: 'https://speech.googleapis.com/v1/speech:recognize',
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
		const audio = {
			content: float32ToUint8(data),
		};

		const config = {
			encoding: 'LINEAR16' as const,
			languageCode: this.options.language,
		};

		return this.axiosInstance
			.post('', { audio, config })
			.then((response: AxiosResponse) => this.processResponseData(response.data));
	}

	private processResponseData(data: unknown) {
		console.dir(data);
	}
}
