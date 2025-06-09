import pMap from 'p-map';

export default async function pFilter(iterable, filterer, options) {
	const values = await pMap(
		iterable,
		(element, index) => Promise.all([filterer(element, index), element]),
		options,
	);

	return values.filter(value => Boolean(value[0])).map(value => value[1]);
}
