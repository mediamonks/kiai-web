/*
	Takes audio data and smoothens it
 */
import range from 'lodash/range';
import { IPipeDestination, TAudioData } from './types';
import PipeSource from './PipeSource';

type TMethod = 'mean' | 'median' | 'interpolation' | 'linear';

type TSignalSmoothenerOptions = {
	windowSize?: number;
	method?: TMethod;
};

const median = (values: Array<number>): number => {
	const { length } = values;
	const sortedValues = values.sort();
	return (
		(length % 2 && sortedValues[(length - 1) / 2]) ||
		(sortedValues[length / 2] + sortedValues[length / 2 - 1]) / 2
	);
};

export default class SignalSmoothener extends PipeSource implements IPipeDestination {
	protected readonly defaultOptions: TSignalSmoothenerOptions = {
		windowSize: 16,
		method: SignalSmoothener.METHODS.MEAN,
	}

	public static readonly METHODS: { [key: string]: TMethod } = {
		MEAN: 'mean',
		MEDIAN: 'median',
		INTERPOLATION: 'interpolation',
		LINEAR: 'linear',
	};

	public receive({ timeDomain, frequency, amplitude }: TAudioData): void {
		const { windowSize, method } = this.options as TSignalSmoothenerOptions;

		const data = timeDomain;

		const result = data.map((value, index) => {
			const windowStart = Math.max(0, index - windowSize);
			const windowEnd = Math.min(data.length - 1, index + windowSize);
			const length = windowEnd - windowStart;

			switch (method) {
				default:
				/* fallthrough to default (mean) */
				case SignalSmoothener.METHODS.MEAN:
					return (
						range(windowStart, windowEnd).reduce((sum, position) => sum + data[position], 0) /
						length
					);
				case SignalSmoothener.METHODS.MEDIAN:
					return median(range(windowStart, windowEnd).map(position => data[position]));
				case SignalSmoothener.METHODS.INTERPOLATION:
					return (data[windowStart] + data[windowEnd]) / 2;
				case SignalSmoothener.METHODS.LINEAR:
					return data[windowStart] + (data[windowEnd] - data[windowStart]) * (windowSize / length);
			}

			return value;
		});

		this.publish({ timeDomain: result, frequency, amplitude });
	}
}
