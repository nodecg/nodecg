/* eslint-env node, mocha, browser */
/* eslint-disable new-cap, camelcase, max-nested-callbacks, no-sparse-arrays */
'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const fs = require('fs');
const e = require('./setup/test-environment');

describe('client-side replicants', function () {
	this.timeout(10000);

	before(done => {
		e.browser.client
			.switchTab(e.browser.tabs.dashboard)
			.call(done)
			.catch(err => done(err));
	});

	it('should return a reference to any already-declared replicant', done => {
		e.browser.client
			.execute(() => {
				const rep1 = window.dashboardApi.Replicant('clientDupRef');
				const rep2 = window.dashboardApi.Replicant('clientDupRef');
				return rep1 === rep2;
			})
			.then(ret => {
				assert.isTrue(ret.value);
				done();
			})
			.catch(err => done(err));
	});

	it('should only apply defaultValue when first declared', done => {
		e.apis.extension.Replicant('clientTest', {
			defaultValue: 'foo',
			persistent: false
		});

		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('clientTest', {defaultValue: 'bar'});
				rep.on('declared', () => done(rep.value));
			})
			.then(ret => {
				expect(ret.value).to.equal('foo');
				done();
			})
			.catch(err => done(err));
	});

	it('should be readable without subscription, via readReplicant', done => {
		e.browser.client
			.executeAsync(done => window.dashboardApi.readReplicant('clientTest', done))
			.then(ret => {
				expect(ret.value).to.equal('foo');
				done();
			})
			.catch(err => done(err));
	});

	it('should throw an error when no name is provided', done => {
		e.browser.client
			.executeAsync(done => {
				try {
					window.dashboardApi.Replicant();
				} catch (e) {
					done(e.message);
				}
			})
			.then(ret => {
				expect(ret.value).to.equal('Must supply a name when instantiating a Replicant');
				done();
			})
			.catch(err => done(err));
	});

	it('should be assignable via the ".value" property', done => {
		e.browser.client
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('clientAssignmentTest', {persistent: false});
				rep.on('change', newVal => {
					if (newVal === 'assignmentOK') {
						done({
							value: rep.value,
							revision: rep.revision
						});
					}
				});
				rep.value = 'assignmentOK';
			})
			.then(ret => {
				expect(ret.value.value).to.equal('assignmentOK');
				expect(ret.value.revision).to.equal(1);
				done();
			})
			.catch(err => done(err));
	});

	// need a better way to test this
	it.skip('should redeclare after reconnecting to Socket.IO', function (done) {
		this.timeout(30000);

		e.browser.client
			.executeAsync(done => {
				window.clientRedeclare = window.dashboardApi.Replicant('clientRedeclare', {
					defaultValue: 'foo',
					persistent: false
				});

				window.clientRedeclare.once('declared', () => done());
			})
			.then(() => {
				e.server.once('stopped', () => {
					e.browser.client
						.executeAsync(done => {
							window.clientRedeclare.once('declared', () => done());
						})
						.call(done);

					e.server.start();
				});

				e.server.stop();
			})
			.catch(err => done(err));
	});

	context('when an array', () => {
		it('should react to changes', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientArrTest', {
						persistent: false,
						defaultValue: ['starting']
					});

					rep.on('declared', () => {
						rep.on('change', (newVal, oldVal, operations) => {
							console.log('change', newVal, oldVal, operations);
							if (newVal && oldVal && operations) {
								done({
									newVal,
									oldVal,
									operations
								});
							}
						});

						rep.value.push('arrPushOK');
					});
				})
				.then(ret => {
					expect(ret.value.newVal).to.deep.equal(['starting', 'arrPushOK']);
					expect(ret.value.oldVal).to.deep.equal(['starting']);
					expect(ret.value.operations).to.deep.equal([{
						args: ['arrPushOK'],
						path: '/',
						method: 'push',
						result: 2
					}]);
					done();
				})
				.catch(err => done(err));
		});

		it('should support the "delete" operator', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientArrayDelete', {
						defaultValue: ['foo', 'bar'],
						persistent: false
					});

					rep.on('change', (newVal, oldVal, operations) => {
						if (newVal[0] === 'foo') {
							delete rep.value[0];
						} else if (newVal[0] === undefined) {
							done({
								newVal,
								oldVal,
								operations
							});
						}
					});
				})
				.then(ret => {
					// This ends up being "null" rather than a sparse array, because JSON doesn't handle sparse arrays.
					// If we really need it to, we can convert the array to an object before stringification, then convert back to an array.
					expect(ret.value.newVal).to.deep.equal([null, 'bar']);
					expect(ret.value.oldVal).to.deep.equal(['foo', 'bar']);
					expect(ret.value.operations).to.deep.equal([{
						args: {prop: '0'},
						path: '/',
						method: 'delete',
						result: true
					}]);
					done();
				})
				.catch(err => done(err));
		});

		it('should proxy objects added to arrays via array insertion methods', done => {
			const rep = e.apis.extension.Replicant('serverArrInsertObj', {defaultValue: []});
			rep.value.push({foo: 'foo'});
			rep.on('change', newVal => {
				if (newVal[0].foo === 'bar') {
					assert.deepEqual(newVal, [{foo: 'bar'}]);
					done();
				}
			});

			process.nextTick(() => {
				rep.value[0].foo = 'bar';
			});
		});
	});

	context('when an object', () => {
		it('should not cause server-side replicants to lose observation', done => {
			const rep = e.apis.extension.Replicant('clientServerObservation', {
				defaultValue: {foo: 'foo'},
				persistent: false
			});

			e.browser.client
				.executeAsync(done => {
					let barred = false;
					const rep = window.dashboardApi.Replicant('clientServerObservation');
					rep.on('change', newVal => {
						if (newVal.foo === 'bar') {
							done(newVal);
						} else if (!barred) {
							barred = true;
							rep.value.foo = 'bar';
						}
					});
				})
				.then(ret => {
					expect(ret.value).to.deep.equal({foo: 'bar'});

					rep.on('change', newVal => {
						if (newVal.foo === 'baz') {
							done();
						}
					});

					rep.value.foo = 'baz';
				})
				.catch(err => done(err));
		});

		it('should react to changes in nested properties', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientObjTest', {
						persistent: false,
						defaultValue: {a: {b: {c: 'c'}}}
					});

					rep.on('declared', () => {
						rep.on('change', (newVal, oldVal, operations) => {
							if (newVal && oldVal && operations) {
								done({
									newVal,
									oldVal,
									operations
								});
							}
						});

						rep.value.a.b.c = 'nestedChangeOK';
					});
				})
				.then(ret => {
					expect(ret.value.oldVal).to.deep.equal({a: {b: {c: 'c'}}});
					expect(ret.value.newVal).to.deep.equal({a: {b: {c: 'nestedChangeOK'}}});
					expect(ret.value.operations).to.deep.equal([{
						args: {
							newValue: 'nestedChangeOK',
							prop: 'c'
						},
						path: '/a/b',
						method: 'update',
						result: 'c'
					}]);
					done();
				})
				.catch(err => done(err));
		});

		// This specifically tests the following case:
		// When the server has a replicant with an array nested inside an object, and that array changes,
		// the server should detect that change event, emit it to all clients,
		// and the clients should then digest that change and emit a "change" event.
		// This test is to address a very specific bug reported by Love Olsson.
		it('should react to server-side changes of array properties', done => {
			const serverRep = e.apis.extension.Replicant('s2c_nestedArrTest', {
				persistent: false,
				defaultValue: {
					arr: []
				}
			});

			e.browser.client
				.executeAsync(done => {
					window.s2c_nestedArrTest = window.dashboardApi.Replicant('s2c_nestedArrTest');
					window.s2c_nestedArrTest.on('declared', () => {
						done();

						window.s2c_nestedArrTest.on('change', (newVal, oldVal, operations) => {
							if (newVal && oldVal && operations) {
								window.s2c_nestedArrChange = {
									newVal,
									oldVal,
									operations
								};
							}
						});
					});
				})
				.then(() => serverRep.value.arr.push('test'))
				.executeAsync(done => {
					const interval = setInterval(() => {
						if (window.s2c_nestedArrChange) {
							clearInterval(interval);
							done(window.s2c_nestedArrChange);
						}
					}, 50);
				})
				.then(ret => {
					expect(ret.value.newVal).to.deep.equal({arr: ['test']});
					expect(ret.value.oldVal).to.deep.equal({arr: []});
					expect(ret.value.operations).to.deep.equal([{
						args: ['test'],
						path: '/arr',
						method: 'push',
						result: 1
					}]);
					done();
				})
				.catch(err => done(err));
		});

		it('should support the "delete" operator', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientObjectDelete', {
						defaultValue: {
							foo: 'foo',
							bar: 'bar'
						},
						persistent: false
					});

					rep.on('change', (newVal, oldVal, operations) => {
						if (newVal.foo) {
							delete rep.value.foo;
						} else if (newVal.bar) {
							done({
								newVal,
								oldVal,
								operations
							});
						}
					});
				})
				.then(ret => {
					expect(ret.value.newVal).to.deep.equal({bar: 'bar'});
					expect(ret.value.oldVal).to.deep.equal({
						foo: 'foo',
						bar: 'bar'
					});
					expect(ret.value.operations).to.deep.equal([{
						args: {prop: 'foo'},
						path: '/',
						method: 'delete',
						result: true
					}]);
					done();
				})
				.catch(err => done(err));
		});

		it('should properly proxy new objects assigned to properties', done => {
			const rep = e.apis.extension.Replicant('serverObjProp', {
				defaultValue: {foo: {bar: 'bar'}}
			});

			rep.value.foo = {baz: 'baz'};

			rep.on('change', newVal => {
				if (newVal.foo.baz === 'bax') {
					assert.equal(newVal.foo.baz, 'bax');
					done();
				}
			});

			process.nextTick(() => {
				rep.value.foo.baz = 'bax';
			});
		});
	});

	context('when "persistent" is set to "true"', () => {
		it('should load persisted values when they exist', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientPersistence');
					rep.on('declared', () => done(rep.value));
				})
				.then(ret => {
					expect(ret.value).to.equal('it work good!');
					done();
				})
				.catch(err => done(err));
		});

		it('should persist assignment to disk', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientPersistence');
					rep.value = {nested: 'hey we assigned!'};
					rep.on('change', newVal => {
						if (newVal.nested && newVal.nested === 'hey we assigned!') {
							done();
						}
					});
				})
				.then(() => {
					fs.readFile('./db/replicants/test-bundle/clientPersistence.rep', 'utf-8', (err, data) => {
						if (err) {
							throw err;
						}

						expect(data).to.equal('{"nested":"hey we assigned!"}');
						done();
					});
				})
				.catch(err => done(err));
		});

		it('should persist changes to disk', done => {
			const serverRep = e.apis.extension.Replicant('clientChangePersistence', {defaultValue: {nested: ''}});
			e.browser.client
				.executeAsync(done => {
					window.clientChangePersistence = window.dashboardApi.Replicant('clientChangePersistence');
					window.clientChangePersistence.once('change', () => done());
				})
				.then(() => {
					serverRep.on('change', newVal => {
						if (newVal.nested !== 'hey we changed!') {
							return;
						}

						// On a short timeout to give the Replicator time to write the new value to disk
						setTimeout(() => {
							const data = fs.readFileSync('./db/replicants/test-bundle/clientChangePersistence.rep',
								'utf-8');
							expect(data).to.equal('{"nested":"hey we changed!"}');
							done();
						}, 10);
					});
				})
				.execute(() => {
					window.clientChangePersistence.value.nested = 'hey we changed!';
				})
				.catch(err => done(err));
		});

		it('should persist falsey values to disk', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientFalseyWrite');
					rep.value = 0;
					rep.on('change', newVal => {
						if (newVal === 0) {
							done();
						}
					});
				})
				.then(() => {
					fs.readFile('./db/replicants/test-bundle/clientFalseyWrite.rep', 'utf-8', (err, data) => {
						if (err) {
							throw err;
						}

						expect(data).to.equal('0');
						done();
					});
				})
				.catch(err => done(err));
		});

		it('should read falsey values from disk', done => {
			e.browser.client
				.executeAsync(done => {
					const rep = window.dashboardApi.Replicant('clientFalseyRead');
					rep.on('declared', () => done(rep.value));
				})
				.then(ret => {
					expect(ret.value).to.equal(0);
					done();
				})
				.catch(err => done(err));
		});
	});

	context('when "persistent" is set to "false"', () => {
		it('should not write their value to disk', done => {
			fs.unlink('./db/replicants/test-bundle/clientTransience.rep', err => {
				if (err && err.code !== 'ENOENT') {
					throw err;
				}

				e.browser.client
					.executeAsync(done => {
						const rep = window.dashboardApi.Replicant('clientTransience', {
							defaultValue: 'o no',
							persistent: false
						});

						rep.on('declared', () => done());
					})
					.then(() => {
						fs.readFile('./db/replicants/test-bundle/clientTransience.rep', err => {
							expect(() => {
								if (err) {
									throw err;
								}
							}).to.throw(/ENOENT/);
						});
					})
					.call(done)
					.catch(err => done(err));
			});
		});
	});
});

describe('server-side replicants', () => {
	it('should return a reference to any already-declared replicant', () => {
		const rep1 = e.apis.extension.Replicant('dupRef');
		const rep2 = e.apis.extension.Replicant('dupRef');
		assert.strictEqual(rep1, rep2);
	});

	it('should only apply defaultValue when first declared', function (done) {
		this.timeout(10000);

		e.browser.client
			.switchTab(e.browser.tabs.dashboard)
			.executeAsync(done => {
				const rep = window.dashboardApi.Replicant('extensionTest', {
					defaultValue: 'foo',
					persistent: false
				});
				rep.on('declared', () => done());
			})
			.then(() => {
				const rep = e.apis.extension.Replicant('extensionTest', {defaultValue: 'bar'});
				expect(rep.value).to.equal('foo');
				done();
			})
			.catch(err => done(err));
	});

	it('should be readable without subscription, via readReplicant', () => {
		expect(e.apis.extension.readReplicant('extensionTest')).to.equal('foo');
	});

	it('should throw an error when no name is provided', () => {
		expect(() => {
			e.apis.extension.Replicant();
		}).to.throw(/Must supply a name when instantiating a Replicant/);
	});

	it('should be assignable via the ".value" property', () => {
		const rep = e.apis.extension.Replicant('extensionAssignmentTest', {persistent: false});
		rep.value = 'assignmentOK';
		expect(rep.value).to.equal('assignmentOK');
	});

	it('should react to changes in nested properties of objects', done => {
		const rep = e.apis.extension.Replicant('extensionObjTest', {
			persistent: false,
			defaultValue: {a: {b: {c: 'c'}}}
		});

		rep.on('change', (newVal, oldVal, operations) => {
			if (newVal.a.b.c !== 'nestedChangeOK') {
				return;
			}

			expect(oldVal).to.deep.equal({a: {b: {c: 'c'}}});
			expect(newVal).to.deep.equal({a: {b: {c: 'nestedChangeOK'}}});
			expect(operations).to.deep.equal([{
				args: {
					newValue: 'nestedChangeOK',
					prop: 'c'
				},
				method: 'update',
				path: '/a/b'
			}]);
			done();
		});

		rep.value.a.b.c = 'nestedChangeOK';
	});

	it('should only apply array splices from the client once', function (done) {
		this.timeout(10000);

		const serverRep = e.apis.extension.Replicant('clientDoubleApplyTest', {
			persistent: false,
			defaultValue: []
		});

		e.browser.client
			.switchTab(e.browser.tabs.dashboard)
			.executeAsync(done => {
				window.clientDoubleApplyTest = window.dashboardApi.Replicant('clientDoubleApplyTest');

				window.clientDoubleApplyTest.on('declared', () => {
					window.clientDoubleApplyTest.on('change', () => done());
				});
			})
			.then(() => {
				serverRep.on('change', newVal => {
					if (Array.isArray(newVal) && newVal[0] === 'test') {
						expect(newVal).to.deep.equal(['test']);
						done();
					}
				});
			})
			.execute(() => window.clientDoubleApplyTest.value.push('test'))
			.catch(err => done(err));
	});

	context('when an array', () => {
		it('should support the "delete" operator', done => {
			const rep = e.apis.extension.Replicant('serverArrayDelete', {
				persistent: false,
				defaultValue: ['foo', 'bar']
			});

			rep.on('change', (newVal, oldVal, operations) => {
				if (operations && operations[0].method === 'delete') {
					expect(newVal).to.deep.equal([, 'bar']);
					expect(oldVal).to.deep.equal(['foo', 'bar']);
					expect(operations).to.deep.equal([{
						args: {prop: '0'},
						path: '/',
						method: 'delete'
					}]);
					done();
				}
			});

			delete rep.value[0];
		});

		it('should react to changes', done => {
			const rep = e.apis.extension.Replicant('extensionArrTest', {
				persistent: false,
				defaultValue: ['starting']
			});

			rep.on('change', (newVal, oldVal, operations) => {
				if (!operations) {
					return;
				}

				expect(oldVal).to.deep.equal(['starting']);
				expect(newVal).to.deep.equal(['starting', 'arrPushOK']);
				expect(operations).to.deep.equal([{
					args: ['arrPushOK'],
					method: 'push',
					path: '/'
				}]);
				done();
			});

			rep.value.push('arrPushOK');
		});
	});

	context('when "persistent" is set to "true"', () => {
		it('should load persisted values when they exist', () => {
			const rep = e.apis.extension.Replicant('extensionPersistence');
			expect(rep.value).to.equal('it work good!');
		});

		it('should persist assignment to disk', done => {
			const rep = e.apis.extension.Replicant('extensionPersistence');
			rep.value = {nested: 'hey we assigned!'};
			setTimeout(() => {
				fs.readFile('./db/replicants/test-bundle/extensionPersistence.rep', 'utf-8', (err, data) => {
					if (err) {
						throw err;
					}

					expect(data).to.equal('{"nested":"hey we assigned!"}');
					done();
				});
			}, 10);
		});

		it('should persist changes to disk', done => {
			const rep = e.apis.extension.Replicant('extensionPersistence');
			rep.value.nested = 'hey we changed!';
			setTimeout(() => {
				fs.readFile('./db/replicants/test-bundle/extensionPersistence.rep', 'utf-8', (err, data) => {
					if (err) {
						throw err;
					}

					expect(data).to.equal('{"nested":"hey we changed!"}');
					done();
				});
			}, 10);
		});

		it('should persist falsey values to disk', done => {
			const rep = e.apis.extension.Replicant('extensionFalseyWrite');
			rep.value = 0;
			setTimeout(() => {
				fs.readFile('./db/replicants/test-bundle/extensionFalseyWrite.rep', 'utf-8', (err, data) => {
					if (err) {
						throw err;
					}

					expect(data).to.equal('0');
					done();
				});
			}, 10);
		});

		it('should read falsey values from disk', () => {
			const rep = e.apis.extension.Replicant('extensionFalseyRead');
			expect(rep.value).to.equal(0);
		});
	});

	context('when "persistent" is set to "false"', () => {
		it('should not write their value to disk', done => {
			// Remove the file if it exists for some reason
			fs.unlink('./db/replicants/test-bundle/extensionTransience.rep', err => {
				if (err && err.code !== 'ENOENT') {
					throw err;
				}

				const rep = e.apis.extension.Replicant('extensionTransience', {persistent: false});
				rep.value = 'o no';
				fs.readFile('./db/replicants/test-bundle/extensionTransience.rep', err => {
					expect(() => {
						if (err) {
							throw err;
						}
					}).to.throw(/ENOENT/);
					done();
				});
			});
		});
	});
});
