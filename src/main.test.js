
/* global describe, test, expect */
/* eslint-disable jsdoc/require-jsdoc */

import {
	TasqRequestRejectedError,
	TasqRequestUnknownMethodError } from './errors.js';

import { createClient } from '../test/client.js';
import '../test/server.js';

const tasqClient = await createClient();

describe('successfully responding to requests', () => {
	test('method returning string', async () => {
		const response = await tasqClient.request('test', 'echo');

		expect(response).toBe('Hello, world!');
	});

	test('method returning string from argument', async () => {
		const response = await tasqClient.request(
			'test',
			'echo',
			{
				name: 'Tasq',
			},
		);

		expect(response).toBe('Hello, Tasq!');
	});

	test('method returning object (sync)', async () => {
		const response = await tasqClient.request('test', 'userSync');

		expect(response).toStrictEqual({
			id: 1,
			name: 'Tasq',
		});
	});

	test('method returning object (async)', async () => {
		const response = await tasqClient.request('test', 'userAsync');

		expect(response).toStrictEqual({
			id: 1,
			name: 'Tasq',
		});
	});
});

describe('errors', () => {
	test('unknown method', async () => {
		const promise = tasqClient.request('test', 'not-exists');

		await expect(promise).rejects.toBeInstanceOf(TasqRequestUnknownMethodError);
		await expect(promise).rejects.toThrow('Unknown method called.');
	});

	test('method that throws', async () => {
		const promise = tasqClient.request('test', 'error');

		await expect(promise).rejects.toBeInstanceOf(TasqRequestRejectedError);
		await expect(promise).rejects.toThrow('Method failed to execute.');
	});
});

describe('internal things', () => {
	test('running 2 tasks in parallel and scheduling 3rd task', async () => {
		const performance_start = performance.now();

		const result = await Promise.all(
			Array.from(
				{ length: 3 },
				() => tasqClient.request('test', 'timeout')
					.then(() => performance.now() - performance_start),
			),
		);

		// console.log('result', result);

		// first 2 tasks should be executed in parallel
		expect(
			result[1] - result[0],
		).toBeLessThan(1);

		// execution of 3rd task should be delayed until one of the first 2 tasks is finished
		expect(
			result[2] - result[1],
		).toBeGreaterThan(100);
	});
});
