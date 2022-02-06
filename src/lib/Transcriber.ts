/*
	Takes an audio buffer and uses Google's Speech API to transcribe the audio to text
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import merge from 'lodash/merge';
import toWav from 'audiobuffer-to-wav';
import { IPipeDestination, TSpeechToTextResponse } from './types';
import PipeSource from './PipeSource';

type TTranscriberOptions = {
	language?: string;
	maxAlternatives?: number;
	minConfidence?: number;
	interimResults?: boolean;
	baseUrl?: string;
	apiKey?: string;
	sampleRate?: number;
};

const REQUEST_CONFIG: AxiosRequestConfig = {
	method: 'post',
	headers: {
		'Content-Type': 'application/json; charset=utf-8',
	},
	responseType: 'json',
};

export default class Transcriber extends PipeSource implements IPipeDestination {
	private readonly axiosInstance: AxiosInstance;
	public readonly defaultOptions: TTranscriberOptions = {
		language: 'en-US',
		maxAlternatives: 1,
		minConfidence: 0,
		interimResults: false,
		baseUrl: 'https://speech.googleapis.com/v1/speech:recognize',
		sampleRate: 44100,
	};

	public constructor(options: TTranscriberOptions = {}) {
		super(options);

		const { apiKey, baseUrl } = this.options as TTranscriberOptions;

		if (!baseUrl) throw new Error('Transcriber: Missing URL for Google Speech');

		if (!apiKey) throw new Error('Transcriber: Missing API key for Google Speech');

		this.axiosInstance = axios.create(
			merge({ baseURL: baseUrl, params: { key: apiKey } }, REQUEST_CONFIG),
		);
	}

	public async receive(data: AudioBuffer): Promise<void> {
		const audio = {
			content: Buffer.from(toWav(data)).toString('base64'),
		};

		const config = {
			encoding: 'LINEAR16' as const,
			languageCode: this.options.language,
			sampleRateHertz: this.options.sampleRate,
		};

		const response: AxiosResponse = await this.axiosInstance.post('', { audio, config });
		const responseData: TSpeechToTextResponse = response.data;

		if (!responseData?.results?.[0]?.alternatives?.length) return;

		this.publish(responseData.results[0].alternatives[0].transcript);
	}
}
