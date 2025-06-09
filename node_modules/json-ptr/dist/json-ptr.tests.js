/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/assertion-error/index.js":
/*!***********************************************!*\
  !*** ./node_modules/assertion-error/index.js ***!
  \***********************************************/
/***/ ((module) => {

/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || AssertionError;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  } else {
    try {
      throw new Error();
    } catch(e) {
      this.stack = e.stack;
    }
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};


/***/ }),

/***/ "./node_modules/call-bind/callBound.js":
/*!*********************************************!*\
  !*** ./node_modules/call-bind/callBound.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");

var callBind = __webpack_require__(/*! ./ */ "./node_modules/call-bind/index.js");

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};


/***/ }),

/***/ "./node_modules/call-bind/index.js":
/*!*****************************************!*\
  !*** ./node_modules/call-bind/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}


/***/ }),

/***/ "./node_modules/chai/index.js":
/*!************************************!*\
  !*** ./node_modules/chai/index.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! ./lib/chai */ "./node_modules/chai/lib/chai.js");


/***/ }),

/***/ "./node_modules/chai/lib/chai.js":
/*!***************************************!*\
  !*** ./node_modules/chai/lib/chai.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = [];

/*!
 * Chai version
 */

exports.version = '4.3.3';

/*!
 * Assertion Error
 */

exports.AssertionError = __webpack_require__(/*! assertion-error */ "./node_modules/assertion-error/index.js");

/*!
 * Utils for plugins (not exported)
 */

var util = __webpack_require__(/*! ./chai/utils */ "./node_modules/chai/lib/chai/utils/index.js");

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai.
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(exports, util);
    used.push(fn);
  }

  return exports;
};

/*!
 * Utility Functions
 */

exports.util = util;

/*!
 * Configuration
 */

var config = __webpack_require__(/*! ./chai/config */ "./node_modules/chai/lib/chai/config.js");
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = __webpack_require__(/*! ./chai/assertion */ "./node_modules/chai/lib/chai/assertion.js");
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = __webpack_require__(/*! ./chai/core/assertions */ "./node_modules/chai/lib/chai/core/assertions.js");
exports.use(core);

/*!
 * Expect interface
 */

var expect = __webpack_require__(/*! ./chai/interface/expect */ "./node_modules/chai/lib/chai/interface/expect.js");
exports.use(expect);

/*!
 * Should interface
 */

var should = __webpack_require__(/*! ./chai/interface/should */ "./node_modules/chai/lib/chai/interface/should.js");
exports.use(should);

/*!
 * Assert interface
 */

var assert = __webpack_require__(/*! ./chai/interface/assert */ "./node_modules/chai/lib/chai/interface/assert.js");
exports.use(assert);


/***/ }),

/***/ "./node_modules/chai/lib/chai/assertion.js":
/*!*************************************************!*\
  !*** ./node_modules/chai/lib/chai/assertion.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = __webpack_require__(/*! ./config */ "./node_modules/chai/lib/chai/config.js");

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * `Assertion` objects contain metadata in the form of flags. Three flags can
   * be assigned during instantiation by passing arguments to this constructor:
   *
   * - `object`: This flag contains the target of the assertion. For example, in
   *   the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
   *   contain `numKittens` so that the `equal` assertion can reference it when
   *   needed.
   *
   * - `message`: This flag contains an optional custom error message to be
   *   prepended to the error message that's generated by the assertion when it
   *   fails.
   *
   * - `ssfi`: This flag stands for "start stack function indicator". It
   *   contains a function reference that serves as the starting point for
   *   removing frames from the stack trace of the error that's created by the
   *   assertion when it fails. The goal is to provide a cleaner stack trace to
   *   end users by removing Chai's internal functions. Note that it only works
   *   in environments that support `Error.captureStackTrace`, and only when
   *   `Chai.config.includeStack` hasn't been set to `false`.
   *
   * - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
   *   should retain its current value, even as assertions are chained off of
   *   this object. This is usually set to `true` when creating a new assertion
   *   from within another assertion. It's also temporarily set to `true` before
   *   an overwritten assertion gets called by the overwriting assertion.
   *
   * @param {Mixed} obj target of the assertion
   * @param {String} msg (optional) custom error message
   * @param {Function} ssfi (optional) starting point for removing stack frames
   * @param {Boolean} lockSsfi (optional) whether or not the ssfi flag is locked
   * @api private
   */

  function Assertion (obj, msg, ssfi, lockSsfi) {
    flag(this, 'ssfi', ssfi || Assertion);
    flag(this, 'lockSsfi', lockSsfi);
    flag(this, 'object', obj);
    flag(this, 'message', msg);

    return util.proxify(this);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /**
   * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String|Function} message or function that returns message to display if expression fails
   * @param {String|Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @param {Boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (false !== showDiff) showDiff = true;
    if (undefined === expected && undefined === _actual) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      msg = util.getMessage(this, arguments);
      var actual = util.getActual(this, arguments);
      var assertionErrorObjectProperties = {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      };

      var operator = util.getOperator(this, arguments);
      if (operator) {
        assertionErrorObjectProperties.operator = operator;
      }

      throw new AssertionError(
        msg,
        assertionErrorObjectProperties,
        (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/config.js":
/*!**********************************************!*\
  !*** ./node_modules/chai/lib/chai/config.js ***!
  \**********************************************/
/***/ ((module) => {

module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

  includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded, for
   * example for large data structures, the value is replaced with something
   * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   * This is especially userful when doing assertions on arrays: having this
   * set to a reasonable large value makes the failure messages readily
   * inspectable.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40,

  /**
   * ### config.useProxy
   *
   * User configurable property, defines if chai will use a Proxy to throw
   * an error when a non-existent property is read, which protects users
   * from typos when using property-based assertions.
   *
   * Set it to false if you want to disable this feature.
   *
   *     chai.config.useProxy = false;  // disable use of Proxy
   *
   * This feature is automatically disabled regardless of this config value
   * in environments that don't support proxies.
   *
   * @param {Boolean}
   * @api public
   */

  useProxy: true,

  /**
   * ### config.proxyExcludedKeys
   *
   * User configurable property, defines which properties should be ignored
   * instead of throwing an error if they do not exist on the assertion.
   * This is only applied if the environment Chai is running in supports proxies and
   * if the `useProxy` configuration setting is enabled.
   * By default, `then` and `inspect` will not throw an error if they do not exist on the
   * assertion object because the `.inspect` property is read by `util.inspect` (for example, when
   * using `console.log` on the assertion object) and `.then` is necessary for promise type-checking.
   *
   *     // By default these keys will not throw an error if they do not exist on the assertion object
   *     chai.config.proxyExcludedKeys = ['then', 'inspect'];
   *
   * @param {Array}
   * @api public
   */

  proxyExcludedKeys: ['then', 'catch', 'inspect', 'toJSON']
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/core/assertions.js":
/*!*******************************************************!*\
  !*** ./node_modules/chai/lib/chai/core/assertions.js ***!
  \*******************************************************/
/***/ ((module) => {

/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , AssertionError = chai.AssertionError
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to improve the readability
   * of your assertions.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - which
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   * - but
   * - does
   * - still
   * - also
   *
   * @name language chains
   * @namespace BDD
   * @api public
   */

  [ 'to', 'be', 'been', 'is'
  , 'and', 'has', 'have', 'with'
  , 'that', 'which', 'at', 'of'
  , 'same', 'but', 'does', 'still', "also" ].forEach(function (chain) {
    Assertion.addProperty(chain);
  });

  /**
   * ### .not
   *
   * Negates all assertions that follow in the chain.
   *
   *     expect(function () {}).to.not.throw();
   *     expect({a: 1}).to.not.have.property('b');
   *     expect([1, 2]).to.be.an('array').that.does.not.include(3);
   *
   * Just because you can negate any assertion with `.not` doesn't mean you
   * should. With great power comes great responsibility. It's often best to
   * assert that the one expected output was produced, rather than asserting
   * that one of countless unexpected outputs wasn't produced. See individual
   * assertions for specific guidance.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.equal(1); // Not recommended
   *
   * @name not
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Causes all `.equal`, `.include`, `.members`, `.keys`, and `.property`
   * assertions that follow in the chain to use deep equality instead of strict
   * (`===`) equality. See the `deep-eql` project page for info on the deep
   * equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.keys([{a: 1}]);
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * @name deep
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .nested
   *
   * Enables dot- and bracket-notation in all `.property` and `.include`
   * assertions that follow in the chain.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *     expect({'.a': {'[b]': 'x'}}).to.nested.include({'\\.a.\\[b\\]': 'x'});
   *
   * `.nested` cannot be combined with `.own`.
   *
   * @name nested
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('nested', function () {
    flag(this, 'nested', true);
  });

  /**
   * ### .own
   *
   * Causes all `.property` and `.include` assertions that follow in the chain
   * to ignore inherited properties.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.property('b');
   *     expect({a: 1}).to.not.have.own.property('b');
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * `.own` cannot be combined with `.nested`.
   *
   * @name own
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('own', function () {
    flag(this, 'own', true);
  });

  /**
   * ### .ordered
   *
   * Causes all `.members` assertions that follow in the chain to require that
   * members be in the same order.
   *
   *     expect([1, 2]).to.have.ordered.members([1, 2])
   *       .but.not.have.ordered.members([2, 1]);
   *
   * When `.include` and `.ordered` are combined, the ordering begins at the
   * start of both arrays.
   *
   *     expect([1, 2, 3]).to.include.ordered.members([1, 2])
   *       .but.not.include.ordered.members([2, 3]);
   *
   * @name ordered
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ordered', function () {
    flag(this, 'ordered', true);
  });

  /**
   * ### .any
   *
   * Causes all `.keys` assertions that follow in the chain to only require that
   * the target have at least one of the given keys. This is the opposite of
   * `.all`, which requires that the target have all of the given keys.
   *
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name any
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('any', function () {
    flag(this, 'any', true);
    flag(this, 'all', false);
  });

  /**
   * ### .all
   *
   * Causes all `.keys` assertions that follow in the chain to require that the
   * target have all of the given keys. This is the opposite of `.any`, which
   * only requires that the target have at least one of the given keys.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` are
   * added earlier in the chain. However, it's often best to add `.all` anyway
   * because it improves readability.
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name all
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('all', function () {
    flag(this, 'all', true);
    flag(this, 'any', false);
  });

  /**
   * ### .a(type[, msg])
   *
   * Asserts that the target's type is equal to the given string `type`. Types
   * are case insensitive. See the `type-detect` project page for info on the
   * type detection algorithm: https://github.com/chaijs/type-detect.
   *
   *     expect('foo').to.be.a('string');
   *     expect({a: 1}).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *     expect(new Error).to.be.an('error');
   *     expect(Promise.resolve()).to.be.a('promise');
   *     expect(new Float32Array).to.be.a('float32array');
   *     expect(Symbol()).to.be.a('symbol');
   *
   * `.a` supports objects that have a custom type set via `Symbol.toStringTag`.
   *
   *     var myObj = {
   *       [Symbol.toStringTag]: 'myCustomType'
   *     };
   *
   *     expect(myObj).to.be.a('myCustomType').but.not.an('object');
   *
   * It's often best to use `.a` to check a target's type before making more
   * assertions on the same target. That way, you avoid unexpected behavior from
   * any assertion that does different things based on the target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.a`. However, it's often best to
   * assert that the target is the expected type, rather than asserting that it
   * isn't one of many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.an('array'); // Not recommended
   *
   * `.a` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     expect(1).to.be.a('string', 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.a('string');
   *
   * `.a` can also be used as a language chain to improve the readability of
   * your assertions.
   *
   *     expect({b: 2}).to.have.a.property('b');
   *
   * The alias `.an` can be used interchangeably with `.a`.
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj).toLowerCase()
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(val[, msg])
   *
   * When the target is a string, `.include` asserts that the given string `val`
   * is a substring of the target.
   *
   *     expect('foobar').to.include('foo');
   *
   * When the target is an array, `.include` asserts that the given `val` is a
   * member of the target.
   *
   *     expect([1, 2, 3]).to.include(2);
   *
   * When the target is an object, `.include` asserts that the given object
   * `val`'s properties are a subset of the target's properties.
   *
   *     expect({a: 1, b: 2, c: 3}).to.include({a: 1, b: 2});
   *
   * When the target is a Set or WeakSet, `.include` asserts that the given `val` is a
   * member of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Set([1, 2])).to.include(2);
   *
   * When the target is a Map, `.include` asserts that the given `val` is one of
   * the values of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.include(2);
   *
   * Because `.include` does different things based on the target's type, it's
   * important to check the target's type before using `.include`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *
   * By default, strict (`===`) equality is used to compare array members and
   * object properties. Add `.deep` earlier in the chain to use deep equality
   * instead (WeakSet targets are not supported). See the `deep-eql` project
   * page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   * By default, all of the target's properties are searched when working with
   * objects. This includes properties that are inherited and/or non-enumerable.
   * Add `.own` earlier in the chain to exclude the target's inherited
   * properties from the search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * Note that a target object is always only searched for `val`'s own
   * enumerable properties.
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({a: {b: 2}}).to.deep.own.include({a: {b: 2}});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 2}}).to.nested.include({'\\.a.\\[b\\]': 2});
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}}).to.deep.nested.include({'a.b[0]': {c: 3}});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.include`.
   *
   *     expect('foobar').to.not.include('taco');
   *     expect([1, 2, 3]).to.not.include(4);
   *
   * However, it's dangerous to negate `.include` when the target is an object.
   * The problem is that it creates uncertain expectations by asserting that the
   * target object doesn't have all of `val`'s key/value pairs but may or may
   * not have some of them. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target object isn't even expected to have `val`'s keys, it's
   * often best to assert exactly that.
   *
   *     expect({c: 3}).to.not.have.any.keys('a', 'b'); // Recommended
   *     expect({c: 3}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * When the target object is expected to have `val`'s keys, it's often best to
   * assert that each of the properties has its expected value, rather than
   * asserting that each property doesn't have one of many unexpected values.
   *
   *     expect({a: 3, b: 4}).to.include({a: 3, b: 4}); // Recommended
   *     expect({a: 3, b: 4}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * `.include` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.include(4, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.include(4);
   *
   * `.include` can also be used as a language chain, causing all `.members` and
   * `.keys` assertions that follow in the chain to require the target to be a
   * superset of the expected set, rather than an identical set. Note that
   * `.members` ignores duplicates in the subset when `.include` is added.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * Note that adding `.any` earlier in the chain causes the `.keys` assertion
   * to ignore `.include`.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *
   * The aliases `.includes`, `.contain`, and `.contains` can be used
   * interchangeably with `.include`.
   *
   * @name include
   * @alias contain
   * @alias includes
   * @alias contains
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function SameValueZero(a, b) {
    return (_.isNaN(a) && _.isNaN(b)) || a === b;
  }

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    if (msg) flag(this, 'message', msg);

    var obj = flag(this, 'object')
      , objType = _.type(obj).toLowerCase()
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate')
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , descriptor = isDeep ? 'deep ' : '';

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    var included = false;

    switch (objType) {
      case 'string':
        included = obj.indexOf(val) !== -1;
        break;

      case 'weakset':
        if (isDeep) {
          throw new AssertionError(
            flagMsg + 'unable to use .deep.include with WeakSet',
            undefined,
            ssfi
          );
        }

        included = obj.has(val);
        break;

      case 'map':
        var isEql = isDeep ? _.eql : SameValueZero;
        obj.forEach(function (item) {
          included = included || isEql(item, val);
        });
        break;

      case 'set':
        if (isDeep) {
          obj.forEach(function (item) {
            included = included || _.eql(item, val);
          });
        } else {
          included = obj.has(val);
        }
        break;

      case 'array':
        if (isDeep) {
          included = obj.some(function (item) {
            return _.eql(item, val);
          })
        } else {
          included = obj.indexOf(val) !== -1;
        }
        break;

      default:
        // This block is for asserting a subset of properties in an object.
        // `_.expectTypes` isn't used here because `.include` should work with
        // objects with a custom `@@toStringTag`.
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + 'the given combination of arguments ('
            + objType + ' and '
            + _.type(val).toLowerCase() + ')'
            + ' is invalid for this assertion. '
            + 'You can use an array, a map, an object, a set, a string, '
            + 'or a weakset instead of a '
            + _.type(val).toLowerCase(),
            undefined,
            ssfi
          );
        }

        var props = Object.keys(val)
          , firstErr = null
          , numErrs = 0;

        props.forEach(function (prop) {
          var propAssertion = new Assertion(obj);
          _.transferFlags(this, propAssertion, true);
          flag(propAssertion, 'lockSsfi', true);

          if (!negate || props.length === 1) {
            propAssertion.property(prop, val[prop]);
            return;
          }

          try {
            propAssertion.property(prop, val[prop]);
          } catch (err) {
            if (!_.checkError.compatibleConstructor(err, AssertionError)) {
              throw err;
            }
            if (firstErr === null) firstErr = err;
            numErrs++;
          }
        }, this);

        // When validating .not.include with multiple properties, we only want
        // to throw an assertion error if all of the properties are included,
        // in which case we throw the first property assertion error that we
        // encountered.
        if (negate && props.length > 1 && numErrs === props.length) {
          throw firstErr;
        }
        return;
    }

    // Assert inclusion in collection or substring in a string.
    this.assert(
      included
      , 'expected #{this} to ' + descriptor + 'include ' + _.inspect(val)
      , 'expected #{this} to not ' + descriptor + 'include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
  Assertion.addChainableMethod('contains', include, includeChainingBehavior);
  Assertion.addChainableMethod('includes', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is a truthy value (considered `true` in boolean context).
   * However, it's often best to assert that the target is strictly (`===`) or
   * deeply equal to its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.ok; // Not recommended
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.be.ok; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.ok`.
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.not.be.ok; // Not recommended
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.ok; // Not recommended
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.be.ok; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.be.ok; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.ok;
   *
   * @name ok
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is strictly (`===`) equal to `true`.
   *
   *     expect(true).to.be.true;
   *
   * Add `.not` earlier in the chain to negate `.true`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `true`.
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.true; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.true; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.true;
   *
   * @name true
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , flag(this, 'negate') ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is strictly (`===`) equal to `false`.
   *
   *     expect(false).to.be.false;
   *
   * Add `.not` earlier in the chain to negate `.false`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `false`.
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.not.be.false; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.false; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(true, 'nooo why fail??').to.be.false;
   *
   * @name false
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , flag(this, 'negate') ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is strictly (`===`) equal to `null`.
   *
   *     expect(null).to.be.null;
   *
   * Add `.not` earlier in the chain to negate `.null`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `null`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.null; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.null;
   *
   * @name null
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is strictly (`===`) equal to `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *
   * Add `.not` earlier in the chain to negate `.undefined`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `undefined`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.undefined; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.undefined;
   *
   * @name undefined
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .NaN
   *
   * Asserts that the target is exactly `NaN`.
   *
   *     expect(NaN).to.be.NaN;
   *
   * Add `.not` earlier in the chain to negate `.NaN`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `NaN`.
   *
   *     expect('foo').to.equal('foo'); // Recommended
   *     expect('foo').to.not.be.NaN; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.NaN;
   *
   * @name NaN
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('NaN', function () {
    this.assert(
        _.isNaN(flag(this, 'object'))
        , 'expected #{this} to be NaN'
        , 'expected #{this} not to be NaN'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is not strictly (`===`) equal to either `null` or
   * `undefined`. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.exist; // Not recommended
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.exist; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.exist`.
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.exist; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.exist; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(null, 'nooo why fail??').to.exist;
   *
   * The alias `.exists` can be used interchangeably with `.exist`.
   *
   * @name exist
   * @alias exists
   * @namespace BDD
   * @api public
   */

  function assertExist () {
    var val = flag(this, 'object');
    this.assert(
        val !== null && val !== undefined
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  }

  Assertion.addProperty('exist', assertExist);
  Assertion.addProperty('exists', assertExist);

  /**
   * ### .empty
   *
   * When the target is a string or array, `.empty` asserts that the target's
   * `length` property is strictly (`===`) equal to `0`.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *
   * When the target is a map or set, `.empty` asserts that the target's `size`
   * property is strictly equal to `0`.
   *
   *     expect(new Set()).to.be.empty;
   *     expect(new Map()).to.be.empty;
   *
   * When the target is a non-function object, `.empty` asserts that the target
   * doesn't have any own enumerable properties. Properties with Symbol-based
   * keys are excluded from the count.
   *
   *     expect({}).to.be.empty;
   *
   * Because `.empty` does different things based on the target's type, it's
   * important to check the target's type before using `.empty`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.empty`. However, it's often
   * best to assert that the target contains its expected number of values,
   * rather than asserting that it's not empty.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.not.be.empty; // Not recommended
   *
   *     expect(new Set([1, 2, 3])).to.have.property('size', 3); // Recommended
   *     expect(new Set([1, 2, 3])).to.not.be.empty; // Not recommended
   *
   *     expect(Object.keys({a: 1})).to.have.lengthOf(1); // Recommended
   *     expect({a: 1}).to.not.be.empty; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect([1, 2, 3], 'nooo why fail??').to.be.empty;
   *
   * @name empty
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('empty', function () {
    var val = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , itemsCount;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    switch (_.type(val).toLowerCase()) {
      case 'array':
      case 'string':
        itemsCount = val.length;
        break;
      case 'map':
      case 'set':
        itemsCount = val.size;
        break;
      case 'weakmap':
      case 'weakset':
        throw new AssertionError(
          flagMsg + '.empty was passed a weak collection',
          undefined,
          ssfi
        );
      case 'function':
        var msg = flagMsg + '.empty was passed a function ' + _.getName(val);
        throw new AssertionError(msg.trim(), undefined, ssfi);
      default:
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + '.empty was passed non-string primitive ' + _.inspect(val),
            undefined,
            ssfi
          );
        }
        itemsCount = Object.keys(val).length;
    }

    this.assert(
        0 === itemsCount
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an `arguments` object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   *     test();
   *
   * Add `.not` earlier in the chain to negate `.arguments`. However, it's often
   * best to assert which type the target is expected to be, rather than
   * asserting that it’s not an `arguments` object.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.arguments; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({}, 'nooo why fail??').to.be.arguments;
   *
   * The alias `.Arguments` can be used interchangeably with `.arguments`.
   *
   * @name arguments
   * @alias Arguments
   * @namespace BDD
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = _.type(obj);
    this.assert(
        'Arguments' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);

  /**
   * ### .equal(val[, msg])
   *
   * Asserts that the target is strictly (`===`) equal to the given `val`.
   *
   *     expect(1).to.equal(1);
   *     expect('foo').to.equal('foo');
   *
   * Add `.deep` earlier in the chain to use deep equality instead. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) equals `[1, 2]`
   *     expect([1, 2]).to.deep.equal([1, 2]);
   *     expect([1, 2]).to.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.equal`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to one of countless unexpected values.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.equal(2); // Not recommended
   *
   * `.equal` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.equal(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.equal(2);
   *
   * The aliases `.equals` and `eq` can be used interchangeably with `.equal`.
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      var prevLockSsfi = flag(this, 'lockSsfi');
      flag(this, 'lockSsfi', true);
      this.eql(val);
      flag(this, 'lockSsfi', prevLockSsfi);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(obj[, msg])
   *
   * Asserts that the target is deeply equal to the given `obj`. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object is deeply (but not strictly) equal to {a: 1}
   *     expect({a: 1}).to.eql({a: 1}).but.not.equal({a: 1});
   *
   *     // Target array is deeply (but not strictly) equal to [1, 2]
   *     expect([1, 2]).to.eql([1, 2]).but.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.eql`. However, it's often best
   * to assert that the target is deeply equal to its expected value, rather
   * than not deeply equal to one of countless unexpected values.
   *
   *     expect({a: 1}).to.eql({a: 1}); // Recommended
   *     expect({a: 1}).to.not.eql({b: 2}); // Not recommended
   *
   * `.eql` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect({a: 1}).to.eql({b: 2}, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.eql({b: 2});
   *
   * The alias `.eqls` can be used interchangeably with `.eql`.
   *
   * The `.deep.equal` assertion is almost identical to `.eql` but with one
   * difference: `.deep.equal` causes deep equality comparisons to also be used
   * for any other assertions that follow in the chain.
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} obj
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(n[, msg])
   *
   * Asserts that the target is a number or a date greater than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.above(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.above(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.above`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(1).to.not.be.above(2); // Not recommended
   *
   * `.above` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.above(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.above(2);
   *
   * The aliases `.gt` and `.greaterThan` can be used interchangeably with
   * `.above`.
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to above must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to above must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount > n
        , 'expected #{this} to have a ' + descriptor + ' above #{exp} but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + ' above #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above #{exp}'
        , 'expected #{this} to be at most #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(n[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `n` respectively. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.at.least(1); // Not recommended
   *     expect(2).to.be.at.least(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than or equal to the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.least(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.least`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.at.least(2); // Not recommended
   *
   * `.least` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.at.least(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.at.least(2);
   *
   * The aliases `.gte` and `.greaterThanOrEqual` can be used interchangeably with
   * `.least`.
   *
   * @name least
   * @alias gte
   * @alias greaterThanOrEqual
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to least must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to least must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount >= n
        , 'expected #{this} to have a ' + descriptor + ' at least #{exp} but got #{act}'
        , 'expected #{this} to have a ' + descriptor + ' below #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least #{exp}'
        , 'expected #{this} to be below #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);
  Assertion.addMethod('greaterThanOrEqual', assertLeast);

  /**
   * ### .below(n[, msg])
   *
   * Asserts that the target is a number or a date less than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.below(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is less than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.below(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.length(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.below(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.below`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.below(1); // Not recommended
   *
   * `.below` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.below(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.below(1);
   *
   * The aliases `.lt` and `.lessThan` can be used interchangeably with
   * `.below`.
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to below must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to below must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount < n
        , 'expected #{this} to have a ' + descriptor + ' below #{exp} but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + ' below #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below #{exp}'
        , 'expected #{this} to be at least #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(n[, msg])
   *
   * Asserts that the target is a number or a date less than or equal to the given number
   * or date `n` respectively. However, it's often best to assert that the target is equal to its
   * expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.at.most(2); // Not recommended
   *     expect(1).to.be.at.most(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is less than or equal to the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.most(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.most`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.at.most(1); // Not recommended
   *
   * `.most` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.at.most(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.at.most(1);
   *
   * The aliases `.lte` and `.lessThanOrEqual` can be used interchangeably with
   * `.most`.
   *
   * @name most
   * @alias lte
   * @alias lessThanOrEqual
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to most must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to most must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount <= n
        , 'expected #{this} to have a ' + descriptor + ' at most #{exp} but got #{act}'
        , 'expected #{this} to have a ' + descriptor + ' above #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most #{exp}'
        , 'expected #{this} to be above #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);
  Assertion.addMethod('lessThanOrEqual', assertMost);

  /**
   * ### .within(start, finish[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `start`, and less than or equal to the given number or date `finish` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.within(1, 3); // Not recommended
   *     expect(2).to.be.within(2, 3); // Not recommended
   *     expect(2).to.be.within(1, 2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than or equal to the given number `start`, and less
   * than or equal to the given number `finish`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.within(2, 4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.within(2, 4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.within`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.within(2, 4); // Not recommended
   *
   * `.within` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(4).to.be.within(1, 3, 'nooo why fail??');
   *     expect(4, 'nooo why fail??').to.be.within(1, 3);
   *
   * @name within
   * @param {Number} start lower bound inclusive
   * @param {Number} finish upper bound inclusive
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , startType = _.type(start).toLowerCase()
      , finishType = _.type(finish).toLowerCase()
      , errorMessage
      , shouldThrow = true
      , range = (startType === 'date' && finishType === 'date')
          ? start.toISOString() + '..' + finish.toISOString()
          : start + '..' + finish;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && (startType !== 'date' || finishType !== 'date'))) {
      errorMessage = msgPrefix + 'the arguments to within must be dates';
    } else if ((startType !== 'number' || finishType !== 'number') && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the arguments to within must be numbers';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount >= start && itemsCount <= finish
        , 'expected #{this} to have a ' + descriptor + ' within ' + range
        , 'expected #{this} to not have a ' + descriptor + ' within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor[, msg])
   *
   * Asserts that the target is an instance of the given `constructor`.
   *
   *     function Cat () { }
   *
   *     expect(new Cat()).to.be.an.instanceof(Cat);
   *     expect([1, 2]).to.be.an.instanceof(Array);
   *
   * Add `.not` earlier in the chain to negate `.instanceof`.
   *
   *     expect({a: 1}).to.not.be.an.instanceof(Array);
   *
   * `.instanceof` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.be.an.instanceof(Array, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.an.instanceof(Array);
   *
   * Due to limitations in ES5, `.instanceof` may not always work as expected
   * when using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing built-in object such as
   * `Array`, `Error`, and `Map`. See your transpiler's docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * The alias `.instanceOf` can be used interchangeably with `.instanceof`.
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} msg _optional_
   * @alias instanceOf
   * @namespace BDD
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);

    var target = flag(this, 'object')
    var ssfi = flag(this, 'ssfi');
    var flagMsg = flag(this, 'message');

    try {
      var isInstanceOf = target instanceof constructor;
    } catch (err) {
      if (err instanceof TypeError) {
        flagMsg = flagMsg ? flagMsg + ': ' : '';
        throw new AssertionError(
          flagMsg + 'The instanceof assertion needs a constructor but '
            + _.type(constructor) + ' was given.',
          undefined,
          ssfi
        );
      }
      throw err;
    }

    var name = _.getName(constructor);
    if (name === null) {
      name = 'an unnamed constructor';
    }

    this.assert(
        isInstanceOf
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name[, val[, msg]])
   *
   * Asserts that the target has a property with the given key `name`.
   *
   *     expect({a: 1}).to.have.property('a');
   *
   * When `val` is provided, `.property` also asserts that the property's value
   * is equal to the given `val`.
   *
   *     expect({a: 1}).to.have.property('a', 1);
   *
   * By default, strict (`===`) equality is used. Add `.deep` earlier in the
   * chain to use deep equality instead. See the `deep-eql` project page for
   * info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * The target's enumerable and non-enumerable properties are always included
   * in the search. By default, both own and inherited properties are included.
   * Add `.own` earlier in the chain to exclude inherited properties from the
   * search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.own.property('a', 1);
   *     expect({a: 1}).to.have.property('b');
   *     expect({a: 1}).to.not.have.own.property('b');
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({x: {a: 1}}).to.have.deep.own.property('x', {a: 1});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]', 'y');
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}})
   *       .to.have.deep.nested.property('a.b[0]', {c: 3});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.property`.
   *
   *     expect({a: 1}).to.not.have.property('b');
   *
   * However, it's dangerous to negate `.property` when providing `val`. The
   * problem is that it creates uncertain expectations by asserting that the
   * target either doesn't have a property with the given key `name`, or that it
   * does have a property with the given key `name` but its value isn't equal to
   * the given `val`. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property with the given key
   * `name`, it's often best to assert exactly that.
   *
   *     expect({b: 2}).to.not.have.property('a'); // Recommended
   *     expect({b: 2}).to.not.have.property('a', 1); // Not recommended
   *
   * When the target is expected to have a property with the given key `name`,
   * it's often best to assert that the property has its expected value, rather
   * than asserting that it doesn't have one of many unexpected values.
   *
   *     expect({a: 3}).to.have.property('a', 3); // Recommended
   *     expect({a: 3}).to.not.have.property('a', 1); // Not recommended
   *
   * `.property` changes the target of any assertions that follow in the chain
   * to be the value of the property from the original target object.
   *
   *     expect({a: 1}).to.have.property('a').that.is.a('number');
   *
   * `.property` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing `val`, only use the
   * second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.property('a', 2, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.have.property('a', 2);
   *     expect({a: 1}, 'nooo why fail??').to.have.property('b');
   *
   *     // Not recommended
   *     expect({a: 1}).to.have.property('b', undefined, 'nooo why fail??');
   *
   * The above assertion isn't the same thing as not providing `val`. Instead,
   * it's asserting that the target object has a `b` property that's equal to
   * `undefined`.
   *
   * The assertions `.ownProperty` and `.haveOwnProperty` can be used
   * interchangeably with `.own.property`.
   *
   * @name property
   * @param {String} name
   * @param {Mixed} val (optional)
   * @param {String} msg _optional_
   * @returns value of property for chaining
   * @namespace BDD
   * @api public
   */

  function assertProperty (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var isNested = flag(this, 'nested')
      , isOwn = flag(this, 'own')
      , flagMsg = flag(this, 'message')
      , obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , nameType = typeof name;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    if (isNested) {
      if (nameType !== 'string') {
        throw new AssertionError(
          flagMsg + 'the argument to property must be a string when using nested syntax',
          undefined,
          ssfi
        );
      }
    } else {
      if (nameType !== 'string' && nameType !== 'number' && nameType !== 'symbol') {
        throw new AssertionError(
          flagMsg + 'the argument to property must be a string, number, or symbol',
          undefined,
          ssfi
        );
      }
    }

    if (isNested && isOwn) {
      throw new AssertionError(
        flagMsg + 'The "nested" and "own" flags cannot be combined.',
        undefined,
        ssfi
      );
    }

    if (obj === null || obj === undefined) {
      throw new AssertionError(
        flagMsg + 'Target cannot be null or undefined.',
        undefined,
        ssfi
      );
    }

    var isDeep = flag(this, 'deep')
      , negate = flag(this, 'negate')
      , pathInfo = isNested ? _.getPathInfo(obj, name) : null
      , value = isNested ? pathInfo.value : obj[name];

    var descriptor = '';
    if (isDeep) descriptor += 'deep ';
    if (isOwn) descriptor += 'own ';
    if (isNested) descriptor += 'nested ';
    descriptor += 'property ';

    var hasProperty;
    if (isOwn) hasProperty = Object.prototype.hasOwnProperty.call(obj, name);
    else if (isNested) hasProperty = pathInfo.exists;
    else hasProperty = _.hasProperty(obj, name);

    // When performing a negated assertion for both name and val, merely having
    // a property with the given name isn't enough to cause the assertion to
    // fail. It must both have a property with the given name, and the value of
    // that property must equal the given val. Therefore, skip this assertion in
    // favor of the next.
    if (!negate || arguments.length === 1) {
      this.assert(
          hasProperty
        , 'expected #{this} to have ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (arguments.length > 1) {
      this.assert(
          hasProperty && (isDeep ? _.eql(val, value) : val === value)
        , 'expected #{this} to have ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  }

  Assertion.addMethod('property', assertProperty);

  function assertOwnProperty (name, value, msg) {
    flag(this, 'own', true);
    assertProperty.apply(this, arguments);
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .ownPropertyDescriptor(name[, descriptor[, msg]])
   *
   * Asserts that the target has its own property descriptor with the given key
   * `name`. Enumerable and non-enumerable properties are included in the
   * search.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a');
   *
   * When `descriptor` is provided, `.ownPropertyDescriptor` also asserts that
   * the property's descriptor is deeply equal to the given `descriptor`. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * Add `.not` earlier in the chain to negate `.ownPropertyDescriptor`.
   *
   *     expect({a: 1}).to.not.have.ownPropertyDescriptor('b');
   *
   * However, it's dangerous to negate `.ownPropertyDescriptor` when providing
   * a `descriptor`. The problem is that it creates uncertain expectations by
   * asserting that the target either doesn't have a property descriptor with
   * the given key `name`, or that it does have a property descriptor with the
   * given key `name` but it’s not deeply equal to the given `descriptor`. It's
   * often best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property descriptor with the given
   * key `name`, it's often best to assert exactly that.
   *
   *     // Recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a');
   *
   *     // Not recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * When the target is expected to have a property descriptor with the given
   * key `name`, it's often best to assert that the property has its expected
   * descriptor, rather than asserting that it doesn't have one of many
   * unexpected descriptors.
   *
   *     // Recommended
   *     expect({a: 3}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 3,
   *     });
   *
   *     // Not recommended
   *     expect({a: 3}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * `.ownPropertyDescriptor` changes the target of any assertions that follow
   * in the chain to be the value of the property descriptor from the original
   * target object.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a')
   *       .that.has.property('enumerable', true);
   *
   * `.ownPropertyDescriptor` accepts an optional `msg` argument which is a
   * custom error message to show when the assertion fails. The message can also
   * be given as the second argument to `expect`. When not providing
   * `descriptor`, only use the second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     }, 'nooo why fail??');
   *
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     });
   *
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('b');
   *
   *     // Not recommended
   *     expect({a: 1})
   *       .to.have.ownPropertyDescriptor('b', undefined, 'nooo why fail??');
   *
   * The above assertion isn't the same thing as not providing `descriptor`.
   * Instead, it's asserting that the target object has a `b` property
   * descriptor that's deeply equal to `undefined`.
   *
   * The alias `.haveOwnPropertyDescriptor` can be used interchangeably with
   * `.ownPropertyDescriptor`.
   *
   * @name ownPropertyDescriptor
   * @alias haveOwnPropertyDescriptor
   * @param {String} name
   * @param {Object} descriptor _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnPropertyDescriptor (name, descriptor, msg) {
    if (typeof descriptor === 'string') {
      msg = descriptor;
      descriptor = null;
    }
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
    if (actualDescriptor && descriptor) {
      this.assert(
          _.eql(descriptor, actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to match ' + _.inspect(descriptor) + ', got ' + _.inspect(actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to not match ' + _.inspect(descriptor)
        , descriptor
        , actualDescriptor
        , true
      );
    } else {
      this.assert(
          actualDescriptor
        , 'expected #{this} to have an own property descriptor for ' + _.inspect(name)
        , 'expected #{this} to not have an own property descriptor for ' + _.inspect(name)
      );
    }
    flag(this, 'object', actualDescriptor);
  }

  Assertion.addMethod('ownPropertyDescriptor', assertOwnPropertyDescriptor);
  Assertion.addMethod('haveOwnPropertyDescriptor', assertOwnPropertyDescriptor);

  /**
   * ### .lengthOf(n[, msg])
   *
   * Asserts that the target's `length` or `size` is equal to the given number
   * `n`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *     expect('foo').to.have.lengthOf(3);
   *     expect(new Set([1, 2, 3])).to.have.lengthOf(3);
   *     expect(new Map([['a', 1], ['b', 2], ['c', 3]])).to.have.lengthOf(3);
   *
   * Add `.not` earlier in the chain to negate `.lengthOf`. However, it's often
   * best to assert that the target's `length` property is equal to its expected
   * value, rather than not equal to one of many unexpected values.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.not.have.lengthOf(4); // Not recommended
   *
   * `.lengthOf` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(2, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.have.lengthOf(2);
   *
   * `.lengthOf` can also be used as a language chain, causing all `.above`,
   * `.below`, `.least`, `.most`, and `.within` assertions that follow in the
   * chain to use the target's `length` property as the target. However, it's
   * often best to assert that the target's `length` property is equal to its
   * expected length, rather than asserting that its `length` property falls
   * within some range of values.
   *
   *     // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *
   *     // Not recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2);
   *     expect([1, 2, 3]).to.have.lengthOf.below(4);
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(3);
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(3);
   *     expect([1, 2, 3]).to.have.lengthOf.within(2,4);
   *
   * Due to a compatibility issue, the alias `.length` can't be chained directly
   * off of an uninvoked method such as `.a`. Therefore, `.length` can't be used
   * interchangeably with `.lengthOf` in every situation. It's recommended to
   * always use `.lengthOf` instead of `.length`.
   *
   *     expect([1, 2, 3]).to.have.a.length(3); // incompatible; throws error
   *     expect([1, 2, 3]).to.have.a.lengthOf(3);  // passes as expected
   *
   * @name lengthOf
   * @alias length
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , objType = _.type(obj).toLowerCase()
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi')
      , descriptor = 'length'
      , itemsCount;

    switch (objType) {
      case 'map':
      case 'set':
        descriptor = 'size';
        itemsCount = obj.size;
        break;
      default:
        new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
        itemsCount = obj.length;
    }

    this.assert(
        itemsCount == n
      , 'expected #{this} to have a ' + descriptor + ' of #{exp} but got #{act}'
      , 'expected #{this} to not have a ' + descriptor + ' of #{act}'
      , n
      , itemsCount
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addChainableMethod('lengthOf', assertLength, assertLengthChain);

  /**
   * ### .match(re[, msg])
   *
   * Asserts that the target matches the given regular expression `re`.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * Add `.not` earlier in the chain to negate `.match`.
   *
   *     expect('foobar').to.not.match(/taco/);
   *
   * `.match` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect('foobar').to.match(/taco/, 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.match(/taco/);
   *
   * The alias `.matches` can be used interchangeably with `.match`.
   *
   * @name match
   * @alias matches
   * @param {RegExp} re
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */
  function assertMatch(re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  }

  Assertion.addMethod('match', assertMatch);
  Assertion.addMethod('matches', assertMatch);

  /**
   * ### .string(str[, msg])
   *
   * Asserts that the target string contains the given substring `str`.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * Add `.not` earlier in the chain to negate `.string`.
   *
   *     expect('foobar').to.not.have.string('taco');
   *
   * `.string` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect('foobar').to.have.string('taco', 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.have.string('taco');
   *
   * @name string
   * @param {String} str
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(obj, flagMsg, ssfi, true).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });

  /**
   * ### .keys(key1[, key2[, ...]])
   *
   * Asserts that the target object, array, map, or set has the given keys. Only
   * the target's own inherited properties are included in the search.
   *
   * When the target is an object or array, keys can be provided as one or more
   * string arguments, a single array argument, or a single object argument. In
   * the latter case, only the keys in the given object matter; the values are
   * ignored.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *     expect(['x', 'y']).to.have.all.keys(0, 1);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys(['a', 'b']);
   *     expect(['x', 'y']).to.have.all.keys([0, 1]);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys({a: 4, b: 5}); // ignore 4 and 5
   *     expect(['x', 'y']).to.have.all.keys({0: 4, 1: 5}); // ignore 4 and 5
   *
   * When the target is a map or set, each key must be provided as a separate
   * argument.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.have.all.keys('a', 'b');
   *     expect(new Set(['a', 'b'])).to.have.all.keys('a', 'b');
   *
   * Because `.keys` does different things based on the target's type, it's
   * important to check the target's type before using `.keys`. See the `.a` doc
   * for info on testing a target's type.
   *
   *     expect({a: 1, b: 2}).to.be.an('object').that.has.all.keys('a', 'b');
   *
   * By default, strict (`===`) equality is used to compare keys of maps and
   * sets. Add `.deep` earlier in the chain to use deep equality instead. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.all.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.all.keys([{a: 1}]);
   *
   * By default, the target must have all of the given keys and no more. Add
   * `.any` earlier in the chain to only require that the target have at least
   * one of the given keys. Also, add `.not` earlier in the chain to negate
   * `.keys`. It's often best to add `.any` when negating `.keys`, and to use
   * `.all` when asserting `.keys` without negation.
   *
   * When negating `.keys`, `.any` is preferred because `.not.any.keys` asserts
   * exactly what's expected of the output, whereas `.not.all.keys` creates
   * uncertain expectations.
   *
   *     // Recommended; asserts that target doesn't have any of the given keys
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   *     // Not recommended; asserts that target doesn't have all of the given
   *     // keys but may or may not have some of them
   *     expect({a: 1, b: 2}).to.not.have.all.keys('c', 'd');
   *
   * When asserting `.keys` without negation, `.all` is preferred because
   * `.all.keys` asserts exactly what's expected of the output, whereas
   * `.any.keys` creates uncertain expectations.
   *
   *     // Recommended; asserts that target has all the given keys
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   *     // Not recommended; asserts that target has at least one of the given
   *     // keys but may or may not have more of them
   *     expect({a: 1, b: 2}).to.have.any.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` appear
   * earlier in the chain. However, it's often best to add `.all` anyway because
   * it improves readability.
   *
   *     // Both assertions are identical
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b'); // Recommended
   *     expect({a: 1, b: 2}).to.have.keys('a', 'b'); // Not recommended
   *
   * Add `.include` earlier in the chain to require that the target's keys be a
   * superset of the expected keys, rather than identical sets.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   * However, if `.any` and `.include` are combined, only the `.any` takes
   * effect. The `.include` is ignored in this case.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.have.key('b');
   *
   * The alias `.key` can be used interchangeably with `.keys`.
   *
   * @name keys
   * @alias key
   * @param {...String|Array|Object} keys
   * @namespace BDD
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , objType = _.type(obj)
      , keysType = _.type(keys)
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , str
      , deepStr = ''
      , actual
      , ok = true
      , flagMsg = flag(this, 'message');

    flagMsg = flagMsg ? flagMsg + ': ' : '';
    var mixedArgsMsg = flagMsg + 'when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments';

    if (objType === 'Map' || objType === 'Set') {
      deepStr = isDeep ? 'deeply ' : '';
      actual = [];

      // Map and Set '.keys' aren't supported in IE 11. Therefore, use .forEach.
      obj.forEach(function (val, key) { actual.push(key) });

      if (keysType !== 'Array') {
        keys = Array.prototype.slice.call(arguments);
      }
    } else {
      actual = _.getOwnEnumerableProperties(obj);

      switch (keysType) {
        case 'Array':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          break;
        case 'Object':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          keys = Object.keys(keys);
          break;
        default:
          keys = Array.prototype.slice.call(arguments);
      }

      // Only stringify non-Symbols because Symbols would become "Symbol()"
      keys = keys.map(function (val) {
        return typeof val === 'symbol' ? val : String(val);
      });
    }

    if (!keys.length) {
      throw new AssertionError(flagMsg + 'keys required', undefined, ssfi);
    }

    var len = keys.length
      , any = flag(this, 'any')
      , all = flag(this, 'all')
      , expected = keys;

    if (!any && !all) {
      all = true;
    }

    // Has any
    if (any) {
      ok = expected.some(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });
    }

    // Has all
    if (all) {
      ok = expected.every(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });

      if (!flag(this, 'contains')) {
        ok = ok && keys.length == actual.length;
      }
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key) {
        return _.inspect(key);
      });
      var last = keys.pop();
      if (all) {
        str = keys.join(', ') + ', and ' + last;
      }
      if (any) {
        str = keys.join(', ') + ', or ' + last;
      }
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + deepStr + str
      , 'expected #{this} to not ' + deepStr + str
      , expected.slice(0).sort(_.compareByInspect)
      , actual.sort(_.compareByInspect)
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw([errorLike], [errMsgMatcher], [msg])
   *
   * When no arguments are provided, `.throw` invokes the target function and
   * asserts that an error is thrown.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw();
   *
   * When one argument is provided, and it's an error constructor, `.throw`
   * invokes the target function and asserts that an error is thrown that's an
   * instance of that error constructor.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError);
   *
   * When one argument is provided, and it's an error instance, `.throw` invokes
   * the target function and asserts that an error is thrown that's strictly
   * (`===`) equal to that error instance.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(err);
   *
   * When one argument is provided, and it's a string, `.throw` invokes the
   * target function and asserts that an error is thrown with a message that
   * contains that string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw('salmon');
   *
   * When one argument is provided, and it's a regular expression, `.throw`
   * invokes the target function and asserts that an error is thrown with a
   * message that matches that regular expression.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(/salmon/);
   *
   * When two arguments are provided, and the first is an error instance or
   * constructor, and the second is a string or regular expression, `.throw`
   * invokes the function and asserts that an error is thrown that fulfills both
   * conditions as described above.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon');
   *     expect(badFn).to.throw(TypeError, /salmon/);
   *     expect(badFn).to.throw(err, 'salmon');
   *     expect(badFn).to.throw(err, /salmon/);
   *
   * Add `.not` earlier in the chain to negate `.throw`.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw();
   *
   * However, it's dangerous to negate `.throw` when providing any arguments.
   * The problem is that it creates uncertain expectations by asserting that the
   * target either doesn't throw an error, or that it throws an error but of a
   * different type than the given type, or that it throws an error of the given
   * type but with a message that doesn't include the given string. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to throw an error, it's often best to assert
   * exactly that.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw(); // Recommended
   *     expect(goodFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * When the target is expected to throw an error, it's often best to assert
   * that the error is of its expected type, and has a message that includes an
   * expected string, rather than asserting that it doesn't have one of many
   * unexpected types, and doesn't have a message that includes some string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon'); // Recommended
   *     expect(badFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * `.throw` changes the target of any assertions that follow in the chain to
   * be the error object that's thrown.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     err.code = 42;
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError).with.property('code', 42);
   *
   * `.throw` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`. When not providing two arguments, always use
   * the second form.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.throw(TypeError, 'x', 'nooo why fail??');
   *     expect(goodFn, 'nooo why fail??').to.throw();
   *
   * Due to limitations in ES5, `.throw` may not always work as expected when
   * using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing the built-in `Error` object and
   * then passing the subclassed constructor to `.throw`. See your transpiler's
   * docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * Beware of some common mistakes when using the `throw` assertion. One common
   * mistake is to accidentally invoke the function yourself instead of letting
   * the `throw` assertion invoke the function for you. For example, when
   * testing if a function named `fn` throws, provide `fn` instead of `fn()` as
   * the target for the assertion.
   *
   *     expect(fn).to.throw();     // Good! Tests `fn` as desired
   *     expect(fn()).to.throw();   // Bad! Tests result of `fn()`, not `fn`
   *
   * If you need to assert that your function `fn` throws when passed certain
   * arguments, then wrap a call to `fn` inside of another function.
   *
   *     expect(function () { fn(42); }).to.throw();  // Function expression
   *     expect(() => fn(42)).to.throw();             // ES6 arrow function
   *
   * Another common mistake is to provide an object method (or any stand-alone
   * function that relies on `this`) as the target of the assertion. Doing so is
   * problematic because the `this` context will be lost when the function is
   * invoked by `.throw`; there's no way for it to know what `this` is supposed
   * to be. There are two ways around this problem. One solution is to wrap the
   * method or function call inside of another function. Another solution is to
   * use `bind`.
   *
   *     expect(function () { cat.meow(); }).to.throw();  // Function expression
   *     expect(() => cat.meow()).to.throw();             // ES6 arrow function
   *     expect(cat.meow.bind(cat)).to.throw();           // Bind
   *
   * Finally, it's worth mentioning that it's a best practice in JavaScript to
   * only throw `Error` and derivatives of `Error` such as `ReferenceError`,
   * `TypeError`, and user-defined objects that extend `Error`. No other type of
   * value will generate a stack trace when initialized. With that said, the
   * `throw` assertion does technically support any type of value being thrown,
   * not just `Error` and its derivatives.
   *
   * The aliases `.throws` and `.Throw` can be used interchangeably with
   * `.throw`.
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {Error|ErrorConstructor} errorLike
   * @param {String|RegExp} errMsgMatcher error message
   * @param {String} msg _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @namespace BDD
   * @api public
   */

  function assertThrows (errorLike, errMsgMatcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate') || false;
    new Assertion(obj, flagMsg, ssfi, true).is.a('function');

    if (errorLike instanceof RegExp || typeof errorLike === 'string') {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var caughtErr;
    try {
      obj();
    } catch (err) {
      caughtErr = err;
    }

    // If we have the negate flag enabled and at least one valid argument it means we do expect an error
    // but we want it to match a given set of criteria
    var everyArgIsUndefined = errorLike === undefined && errMsgMatcher === undefined;

    // If we've got the negate flag enabled and both args, we should only fail if both aren't compatible
    // See Issue #551 and PR #683@GitHub
    var everyArgIsDefined = Boolean(errorLike && errMsgMatcher);
    var errorLikeFail = false;
    var errMsgMatcherFail = false;

    // Checking if error was thrown
    if (everyArgIsUndefined || !everyArgIsUndefined && !negate) {
      // We need this to display results correctly according to their types
      var errorLikeString = 'an error';
      if (errorLike instanceof Error) {
        errorLikeString = '#{exp}';
      } else if (errorLike) {
        errorLikeString = _.checkError.getConstructorName(errorLike);
      }

      this.assert(
          caughtErr
        , 'expected #{this} to throw ' + errorLikeString
        , 'expected #{this} to not throw an error but #{act} was thrown'
        , errorLike && errorLike.toString()
        , (caughtErr instanceof Error ?
            caughtErr.toString() : (typeof caughtErr === 'string' ? caughtErr : caughtErr &&
                                    _.checkError.getConstructorName(caughtErr)))
      );
    }

    if (errorLike && caughtErr) {
      // We should compare instances only if `errorLike` is an instance of `Error`
      if (errorLike instanceof Error) {
        var isCompatibleInstance = _.checkError.compatibleInstance(caughtErr, errorLike);

        if (isCompatibleInstance === negate) {
          // These checks were created to ensure we won't fail too soon when we've got both args and a negate
          // See Issue #551 and PR #683@GitHub
          if (everyArgIsDefined && negate) {
            errorLikeFail = true;
          } else {
            this.assert(
                negate
              , 'expected #{this} to throw #{exp} but #{act} was thrown'
              , 'expected #{this} to not throw #{exp}' + (caughtErr && !negate ? ' but #{act} was thrown' : '')
              , errorLike.toString()
              , caughtErr.toString()
            );
          }
        }
      }

      var isCompatibleConstructor = _.checkError.compatibleConstructor(caughtErr, errorLike);
      if (isCompatibleConstructor === negate) {
        if (everyArgIsDefined && negate) {
            errorLikeFail = true;
        } else {
          this.assert(
              negate
            , 'expected #{this} to throw #{exp} but #{act} was thrown'
            , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
            , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
            , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
          );
        }
      }
    }

    if (caughtErr && errMsgMatcher !== undefined && errMsgMatcher !== null) {
      // Here we check compatible messages
      var placeholder = 'including';
      if (errMsgMatcher instanceof RegExp) {
        placeholder = 'matching'
      }

      var isCompatibleMessage = _.checkError.compatibleMessage(caughtErr, errMsgMatcher);
      if (isCompatibleMessage === negate) {
        if (everyArgIsDefined && negate) {
            errMsgMatcherFail = true;
        } else {
          this.assert(
            negate
            , 'expected #{this} to throw error ' + placeholder + ' #{exp} but got #{act}'
            , 'expected #{this} to throw error not ' + placeholder + ' #{exp}'
            ,  errMsgMatcher
            ,  _.checkError.getMessage(caughtErr)
          );
        }
      }
    }

    // If both assertions failed and both should've matched we throw an error
    if (errorLikeFail && errMsgMatcherFail) {
      this.assert(
        negate
        , 'expected #{this} to throw #{exp} but #{act} was thrown'
        , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
        , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
        , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
      );
    }

    flag(this, 'object', caughtErr);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method[, msg])
   *
   * When the target is a non-function object, `.respondTo` asserts that the
   * target has a method with the given name `method`. The method can be own or
   * inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.respondTo('meow');
   *
   * When the target is a function, `.respondTo` asserts that the target's
   * `prototype` property has a method with the given name `method`. Again, the
   * method can be own or inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(Cat).to.respondTo('meow');
   *
   * Add `.itself` earlier in the chain to force `.respondTo` to treat the
   * target as a non-function object, even if it's a function. Thus, it asserts
   * that the target has a method with the given name `method`, rather than
   * asserting that the target's `prototype` property has a method with the
   * given name `method`.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * When not adding `.itself`, it's important to check the target's type before
   * using `.respondTo`. See the `.a` doc for info on checking a target's type.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.be.an('object').that.respondsTo('meow');
   *
   * Add `.not` earlier in the chain to negate `.respondTo`.
   *
   *     function Dog () {}
   *     Dog.prototype.bark = function () {};
   *
   *     expect(new Dog()).to.not.respondTo('meow');
   *
   * `.respondTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect({}).to.respondTo('meow', 'nooo why fail??');
   *     expect({}, 'nooo why fail??').to.respondTo('meow');
   *
   * The alias `.respondsTo` can be used interchangeably with `.respondTo`.
   *
   * @name respondTo
   * @alias respondsTo
   * @param {String} method
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function respondTo (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === typeof obj && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  }

  Assertion.addMethod('respondTo', respondTo);
  Assertion.addMethod('respondsTo', respondTo);

  /**
   * ### .itself
   *
   * Forces all `.respondTo` assertions that follow in the chain to behave as if
   * the target is a non-function object, even if it's a function. Thus, it
   * causes `.respondTo` to assert that the target has a method with the given
   * name, rather than asserting that the target's `prototype` property has a
   * method with the given name.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * @name itself
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(matcher[, msg])
   *
   * Invokes the given `matcher` function with the target being passed as the
   * first argument, and asserts that the value returned is truthy.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 0;
   *     });
   *
   * Add `.not` earlier in the chain to negate `.satisfy`.
   *
   *     expect(1).to.not.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * `.satisfy` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 2;
   *     }, 'nooo why fail??');
   *
   *     expect(1, 'nooo why fail??').to.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * The alias `.satisfies` can be used interchangeably with `.satisfy`.
   *
   * @name satisfy
   * @alias satisfies
   * @param {Function} matcher
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function satisfy (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , flag(this, 'negate') ? false : true
      , result
    );
  }

  Assertion.addMethod('satisfy', satisfy);
  Assertion.addMethod('satisfies', satisfy);

  /**
   * ### .closeTo(expected, delta[, msg])
   *
   * Asserts that the target is a number that's within a given +/- `delta` range
   * of the given number `expected`. However, it's often best to assert that the
   * target is equal to its expected value.
   *
   *     // Recommended
   *     expect(1.5).to.equal(1.5);
   *
   *     // Not recommended
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *     expect(1.5).to.be.closeTo(2, 0.5);
   *     expect(1.5).to.be.closeTo(1, 1);
   *
   * Add `.not` earlier in the chain to negate `.closeTo`.
   *
   *     expect(1.5).to.equal(1.5); // Recommended
   *     expect(1.5).to.not.be.closeTo(3, 1); // Not recommended
   *
   * `.closeTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1.5).to.be.closeTo(3, 1, 'nooo why fail??');
   *     expect(1.5, 'nooo why fail??').to.be.closeTo(3, 1);
   *
   * The alias `.approximately` can be used interchangeably with `.closeTo`.
   *
   * @name closeTo
   * @alias approximately
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function closeTo(expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).is.a('number');
    if (typeof expected !== 'number' || typeof delta !== 'number') {
      flagMsg = flagMsg ? flagMsg + ': ' : '';
      var deltaMessage = delta === undefined ? ", and a delta is required" : "";
      throw new AssertionError(
          flagMsg + 'the arguments to closeTo or approximately must be numbers' + deltaMessage,
          undefined,
          ssfi
      );
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  }

  Assertion.addMethod('closeTo', closeTo);
  Assertion.addMethod('approximately', closeTo);

  // Note: Duplicates are ignored if testing for inclusion instead of sameness.
  function isSubsetOf(subset, superset, cmp, contains, ordered) {
    if (!contains) {
      if (subset.length !== superset.length) return false;
      superset = superset.slice();
    }

    return subset.every(function(elem, idx) {
      if (ordered) return cmp ? cmp(elem, superset[idx]) : elem === superset[idx];

      if (!cmp) {
        var matchIdx = superset.indexOf(elem);
        if (matchIdx === -1) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      }

      return superset.some(function(elem2, matchIdx) {
        if (!cmp(elem, elem2)) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      });
    });
  }

  /**
   * ### .members(set[, msg])
   *
   * Asserts that the target array has the same members as the given array
   * `set`.
   *
   *     expect([1, 2, 3]).to.have.members([2, 1, 3]);
   *     expect([1, 2, 2]).to.have.members([2, 1, 2]);
   *
   * By default, members are compared using strict (`===`) equality. Add `.deep`
   * earlier in the chain to use deep equality instead. See the `deep-eql`
   * project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   * By default, order doesn't matter. Add `.ordered` earlier in the chain to
   * require that members appear in the same order.
   *
   *     expect([1, 2, 3]).to.have.ordered.members([1, 2, 3]);
   *     expect([1, 2, 3]).to.have.members([2, 1, 3])
   *       .but.not.ordered.members([2, 1, 3]);
   *
   * By default, both arrays must be the same size. Add `.include` earlier in
   * the chain to require that the target's members be a superset of the
   * expected members. Note that duplicates are ignored in the subset when
   * `.include` is added.
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * `.deep`, `.ordered`, and `.include` can all be combined. However, if
   * `.include` and `.ordered` are combined, the ordering begins at the start of
   * both arrays.
   *
   *     expect([{a: 1}, {b: 2}, {c: 3}])
   *       .to.include.deep.ordered.members([{a: 1}, {b: 2}])
   *       .but.not.include.deep.ordered.members([{b: 2}, {c: 3}]);
   *
   * Add `.not` earlier in the chain to negate `.members`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the target array doesn't have all of the same members as
   * the given array `set` but may or may not have some of them. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     expect([1, 2]).to.not.include(3).and.not.include(4); // Recommended
   *     expect([1, 2]).to.not.have.members([3, 4]); // Not recommended
   *
   * `.members` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2]).to.have.members([1, 2, 3], 'nooo why fail??');
   *     expect([1, 2], 'nooo why fail??').to.have.members([1, 2, 3]);
   *
   * @name members
   * @param {Array} set
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).to.be.an('array');
    new Assertion(subset, flagMsg, ssfi, true).to.be.an('array');

    var contains = flag(this, 'contains');
    var ordered = flag(this, 'ordered');

    var subject, failMsg, failNegateMsg;

    if (contains) {
      subject = ordered ? 'an ordered superset' : 'a superset';
      failMsg = 'expected #{this} to be ' + subject + ' of #{exp}';
      failNegateMsg = 'expected #{this} to not be ' + subject + ' of #{exp}';
    } else {
      subject = ordered ? 'ordered members' : 'members';
      failMsg = 'expected #{this} to have the same ' + subject + ' as #{exp}';
      failNegateMsg = 'expected #{this} to not have the same ' + subject + ' as #{exp}';
    }

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    this.assert(
        isSubsetOf(subset, obj, cmp, contains, ordered)
      , failMsg
      , failNegateMsg
      , subset
      , obj
      , true
    );
  });

  /**
   * ### .oneOf(list[, msg])
   *
   * Asserts that the target is a member of the given array `list`. However,
   * it's often best to assert that the target is equal to its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.oneOf([1, 2, 3]); // Not recommended
   *
   * Comparisons are performed using strict (`===`) equality.
   *
   * Add `.not` earlier in the chain to negate `.oneOf`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.oneOf([2, 3, 4]); // Not recommended
   *
   * It can also be chained with `.contain` or `.include`, which will work with
   * both arrays and strings:
   *
   *     expect('Today is sunny').to.contain.oneOf(['sunny', 'cloudy'])
   *     expect('Today is rainy').to.not.contain.oneOf(['sunny', 'cloudy'])
   *     expect([1,2,3]).to.contain.oneOf([3,4,5])
   *     expect([1,2,3]).to.not.contain.oneOf([4,5,6])
   *
   * `.oneOf` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.oneOf([2, 3, 4], 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.oneOf([2, 3, 4]);
   *
   * @name oneOf
   * @param {Array<*>} list
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function oneOf (list, msg) {
    if (msg) flag(this, 'message', msg);
    var expected = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi')
      , contains = flag(this, 'contains')
      , isDeep = flag(this, 'deep');
    new Assertion(list, flagMsg, ssfi, true).to.be.an('array');

    if (contains) {
      this.assert(
        list.some(function(possibility) { return expected.indexOf(possibility) > -1 })
        , 'expected #{this} to contain one of #{exp}'
        , 'expected #{this} to not contain one of #{exp}'
        , list
        , expected
      );
    } else {
      if (isDeep) {
        this.assert(
          list.some(function(possibility) { return _.eql(expected, possibility) })
          , 'expected #{this} to deeply equal one of #{exp}'
          , 'expected #{this} to deeply equal one of #{exp}'
          , list
          , expected
        );
      } else {
        this.assert(
          list.indexOf(expected) > -1
          , 'expected #{this} to be one of #{exp}'
          , 'expected #{this} to not be one of #{exp}'
          , list
          , expected
        );
      }
    }
  }

  Assertion.addMethod('oneOf', oneOf);

  /**
   * ### .change(subject[, prop[, msg]])
   *
   * When one argument is provided, `.change` asserts that the given function
   * `subject` returns a different value when it's invoked before the target
   * function compared to when it's invoked afterward. However, it's often best
   * to assert that `subject` is equal to its expected value.
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     // Recommended
   *     expect(getDots()).to.equal('');
   *     addDot();
   *     expect(getDots()).to.equal('.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(getDots);
   *
   * When two arguments are provided, `.change` asserts that the value of the
   * given object `subject`'s `prop` property is different before invoking the
   * target function compared to afterward.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     // Recommended
   *     expect(myObj).to.have.property('dots', '');
   *     addDot();
   *     expect(myObj).to.have.property('dots', '.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(myObj, 'dots');
   *
   * Strict (`===`) equality is used to compare before and after values.
   *
   * Add `.not` earlier in the chain to negate `.change`.
   *
   *     var dots = ''
   *       , noop = function () {}
   *       , getDots = function () { return dots; };
   *
   *     expect(noop).to.not.change(getDots);
   *
   *     var myObj = {dots: ''}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'dots');
   *
   * `.change` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     expect(addDot).to.not.change(myObj, 'dots', 'nooo why fail??');
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     expect(addDot, 'nooo why fail??').to.not.change(getDots);
   *
   * `.change` also causes all `.by` assertions that follow in the chain to
   * assert how much a numeric subject was increased or decreased by. However,
   * it's dangerous to use `.change.by`. The problem is that it creates
   * uncertain expectations by asserting that the subject either increases by
   * the given delta, or that it decreases by the given delta. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * The alias `.changes` can be used interchangeably with `.change`.
   *
   * @name change
   * @alias changes
   * @param {String} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertChanges (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    // This gets flagged because of the .by(delta) assertion
    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'change');
    flag(this, 'realDelta', final !== initial);

    this.assert(
      initial !== final
      , 'expected ' + msgObj + ' to change'
      , 'expected ' + msgObj + ' to not change'
    );
  }

  Assertion.addMethod('change', assertChanges);
  Assertion.addMethod('changes', assertChanges);

  /**
   * ### .increase(subject[, prop[, msg]])
   *
   * When one argument is provided, `.increase` asserts that the given function
   * `subject` returns a greater number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.increase` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * greater of a number is returned. It's often best to assert that the return
   * value increased by the expected amount, rather than asserting it increased
   * by any amount.
   *
   *     var val = 1
   *       , addTwo = function () { val += 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(addTwo).to.increase(getVal).by(2); // Recommended
   *     expect(addTwo).to.increase(getVal); // Not recommended
   *
   * When two arguments are provided, `.increase` asserts that the value of the
   * given object `subject`'s `prop` property is greater after invoking the
   * target function compared to beforehand.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.increase(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.increase`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either decreases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to decrease, it's often best to assert that it
   * decreased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.not.increase(myObj, 'val'); // Not recommended
   *
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.increase(myObj, 'val'); // Not recommended
   *
   * `.increase` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.increase(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.increase(getVal);
   *
   * The alias `.increases` can be used interchangeably with `.increase`.
   *
   * @name increase
   * @alias increases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertIncreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'increase');
    flag(this, 'realDelta', final - initial);

    this.assert(
      final - initial > 0
      , 'expected ' + msgObj + ' to increase'
      , 'expected ' + msgObj + ' to not increase'
    );
  }

  Assertion.addMethod('increase', assertIncreases);
  Assertion.addMethod('increases', assertIncreases);

  /**
   * ### .decrease(subject[, prop[, msg]])
   *
   * When one argument is provided, `.decrease` asserts that the given function
   * `subject` returns a lesser number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.decrease` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * lesser of a number is returned. It's often best to assert that the return
   * value decreased by the expected amount, rather than asserting it decreased
   * by any amount.
   *
   *     var val = 1
   *       , subtractTwo = function () { val -= 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(subtractTwo).to.decrease(getVal).by(2); // Recommended
   *     expect(subtractTwo).to.decrease(getVal); // Not recommended
   *
   * When two arguments are provided, `.decrease` asserts that the value of the
   * given object `subject`'s `prop` property is lesser after invoking the
   * target function compared to beforehand.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.decrease(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.decrease`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either increases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to increase, it's often best to assert that it
   * increased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.not.decrease(myObj, 'val'); // Not recommended
   *
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.decrease(myObj, 'val'); // Not recommended
   *
   * `.decrease` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.decrease(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.decrease(getVal);
   *
   * The alias `.decreases` can be used interchangeably with `.decrease`.
   *
   * @name decrease
   * @alias decreases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDecreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'decrease');
    flag(this, 'realDelta', initial - final);

    this.assert(
      final - initial < 0
      , 'expected ' + msgObj + ' to decrease'
      , 'expected ' + msgObj + ' to not decrease'
    );
  }

  Assertion.addMethod('decrease', assertDecreases);
  Assertion.addMethod('decreases', assertDecreases);

  /**
   * ### .by(delta[, msg])
   *
   * When following an `.increase` assertion in the chain, `.by` asserts that
   * the subject of the `.increase` assertion increased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   * When following a `.decrease` assertion in the chain, `.by` asserts that the
   * subject of the `.decrease` assertion decreased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2);
   *
   * When following a `.change` assertion in the chain, `.by` asserts that the
   * subject of the `.change` assertion either increased or decreased by the
   * given `delta`. However, it's dangerous to use `.change.by`. The problem is
   * that it creates uncertain expectations. It's often best to identify the
   * exact output that's expected, and then write an assertion that only accepts
   * that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.by`. However, it's often best
   * to assert that the subject changed by its expected delta, rather than
   * asserting that it didn't change by one of countless unexpected deltas.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     // Recommended
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   *     // Not recommended
   *     expect(addTwo).to.increase(myObj, 'val').but.not.by(3);
   *
   * `.by` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(3, 'nooo why fail??');
   *     expect(addTwo, 'nooo why fail??').to.increase(myObj, 'val').by(3);
   *
   * @name by
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDelta(delta, msg) {
    if (msg) flag(this, 'message', msg);

    var msgObj = flag(this, 'deltaMsgObj');
    var initial = flag(this, 'initialDeltaValue');
    var final = flag(this, 'finalDeltaValue');
    var behavior = flag(this, 'deltaBehavior');
    var realDelta = flag(this, 'realDelta');

    var expression;
    if (behavior === 'change') {
      expression = Math.abs(final - initial) === Math.abs(delta);
    } else {
      expression = realDelta === Math.abs(delta);
    }

    this.assert(
      expression
      , 'expected ' + msgObj + ' to ' + behavior + ' by ' + delta
      , 'expected ' + msgObj + ' to not ' + behavior + ' by ' + delta
    );
  }

  Assertion.addMethod('by', assertDelta);

  /**
   * ### .extensible
   *
   * Asserts that the target is extensible, which means that new properties can
   * be added to it. Primitives are never extensible.
   *
   *     expect({a: 1}).to.be.extensible;
   *
   * Add `.not` earlier in the chain to negate `.extensible`.
   *
   *     var nonExtensibleObject = Object.preventExtensions({})
   *       , sealedObject = Object.seal({})
   *       , frozenObject = Object.freeze({});
   *
   *     expect(nonExtensibleObject).to.not.be.extensible;
   *     expect(sealedObject).to.not.be.extensible;
   *     expect(frozenObject).to.not.be.extensible;
   *     expect(1).to.not.be.extensible;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(1, 'nooo why fail??').to.be.extensible;
   *
   * @name extensible
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('extensible', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a non-extensible ordinary object, simply return false.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
    // The following provides ES6 behavior for ES5 environments.

    var isExtensible = obj === Object(obj) && Object.isExtensible(obj);

    this.assert(
      isExtensible
      , 'expected #{this} to be extensible'
      , 'expected #{this} to not be extensible'
    );
  });

  /**
   * ### .sealed
   *
   * Asserts that the target is sealed, which means that new properties can't be
   * added to it, and its existing properties can't be reconfigured or deleted.
   * However, it's possible that its existing properties can still be reassigned
   * to different values. Primitives are always sealed.
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect(sealedObject).to.be.sealed;
   *     expect(frozenObject).to.be.sealed;
   *     expect(1).to.be.sealed;
   *
   * Add `.not` earlier in the chain to negate `.sealed`.
   *
   *     expect({a: 1}).to.not.be.sealed;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.sealed;
   *
   * @name sealed
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('sealed', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a sealed ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
    // The following provides ES6 behavior for ES5 environments.

    var isSealed = obj === Object(obj) ? Object.isSealed(obj) : true;

    this.assert(
      isSealed
      , 'expected #{this} to be sealed'
      , 'expected #{this} to not be sealed'
    );
  });

  /**
   * ### .frozen
   *
   * Asserts that the target is frozen, which means that new properties can't be
   * added to it, and its existing properties can't be reassigned to different
   * values, reconfigured, or deleted. Primitives are always frozen.
   *
   *     var frozenObject = Object.freeze({});
   *
   *     expect(frozenObject).to.be.frozen;
   *     expect(1).to.be.frozen;
   *
   * Add `.not` earlier in the chain to negate `.frozen`.
   *
   *     expect({a: 1}).to.not.be.frozen;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.frozen;
   *
   * @name frozen
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('frozen', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a frozen ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
    // The following provides ES6 behavior for ES5 environments.

    var isFrozen = obj === Object(obj) ? Object.isFrozen(obj) : true;

    this.assert(
      isFrozen
      , 'expected #{this} to be frozen'
      , 'expected #{this} to not be frozen'
    );
  });

  /**
   * ### .finite
   *
   * Asserts that the target is a number, and isn't `NaN` or positive/negative
   * `Infinity`.
   *
   *     expect(1).to.be.finite;
   *
   * Add `.not` earlier in the chain to negate `.finite`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either isn't a number, or that it's `NaN`, or
   * that it's positive `Infinity`, or that it's negative `Infinity`. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to be a number, it's often best to assert
   * that it's the expected type, rather than asserting that it isn't one of
   * many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.finite; // Not recommended
   *
   * When the target is expected to be `NaN`, it's often best to assert exactly
   * that.
   *
   *     expect(NaN).to.be.NaN; // Recommended
   *     expect(NaN).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be positive infinity, it's often best to
   * assert exactly that.
   *
   *     expect(Infinity).to.equal(Infinity); // Recommended
   *     expect(Infinity).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be negative infinity, it's often best to
   * assert exactly that.
   *
   *     expect(-Infinity).to.equal(-Infinity); // Recommended
   *     expect(-Infinity).to.not.be.finite; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect('foo', 'nooo why fail??').to.be.finite;
   *
   * @name finite
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('finite', function(msg) {
    var obj = flag(this, 'object');

    this.assert(
        typeof obj === 'number' && isFinite(obj)
      , 'expected #{this} to be a finite number'
      , 'expected #{this} to not be a finite number'
    );
  });
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/interface/assert.js":
/*!********************************************************!*\
  !*** ./node_modules/chai/lib/chai/interface/assert.js ***!
  \********************************************************/
/***/ ((module) => {

/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @namespace Assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert, true);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail([message])
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   *     assert.fail();
   *     assert.fail("custom error message");
   *     assert.fail(1, 2);
   *     assert.fail(1, 2, "custom error message");
   *     assert.fail(1, 2, "custom error message", ">");
   *     assert.fail(1, 2, undefined, ">");
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Assert
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    if (arguments.length < 2) {
        // Comply with Node's fail([message]) interface

        message = actual;
        actual = undefined;
    }

    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .isOk(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.isOk('everything', 'everything is ok');
   *     assert.isOk(false, 'this will fail');
   *
   * @name isOk
   * @alias ok
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isOk = function (val, msg) {
    new Assertion(val, msg, assert.isOk, true).is.ok;
  };

  /**
   * ### .isNotOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.isNotOk('everything', 'this will fail');
   *     assert.isNotOk(false, 'this will pass');
   *
   * @name isNotOk
   * @alias notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotOk = function (val, msg) {
    new Assertion(val, msg, assert.isNotOk, true).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal, true);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual, true);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.strictEqual, true).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.notStrictEqual, true).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @alias deepStrictEqual
   * @namespace Assert
   * @api public
   */

  assert.deepEqual = assert.deepStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.deepEqual, true).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.notDeepEqual, true).to.not.eql(exp);
  };

   /**
   * ### .isAbove(valueToCheck, valueToBeAbove, [message])
   *
   * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`.
   *
   *     assert.isAbove(5, 2, '5 is strictly greater than 2');
   *
   * @name isAbove
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAbove
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAbove = function (val, abv, msg) {
    new Assertion(val, msg, assert.isAbove, true).to.be.above(abv);
  };

   /**
   * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [message])
   *
   * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`.
   *
   *     assert.isAtLeast(5, 2, '5 is greater or equal to 2');
   *     assert.isAtLeast(3, 3, '3 is greater or equal to 3');
   *
   * @name isAtLeast
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtLeast
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtLeast = function (val, atlst, msg) {
    new Assertion(val, msg, assert.isAtLeast, true).to.be.least(atlst);
  };

   /**
   * ### .isBelow(valueToCheck, valueToBeBelow, [message])
   *
   * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`.
   *
   *     assert.isBelow(3, 6, '3 is strictly less than 6');
   *
   * @name isBelow
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeBelow
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBelow = function (val, blw, msg) {
    new Assertion(val, msg, assert.isBelow, true).to.be.below(blw);
  };

   /**
   * ### .isAtMost(valueToCheck, valueToBeAtMost, [message])
   *
   * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`.
   *
   *     assert.isAtMost(3, 6, '3 is less than or equal to 6');
   *     assert.isAtMost(4, 4, '4 is less than or equal to 4');
   *
   * @name isAtMost
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtMost
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtMost = function (val, atmst, msg) {
    new Assertion(val, msg, assert.isAtMost, true).to.be.most(atmst);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg, assert.isTrue, true).is['true'];
  };

  /**
   * ### .isNotTrue(value, [message])
   *
   * Asserts that `value` is not true.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotTrue(tea, 'great, time for tea!');
   *
   * @name isNotTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotTrue = function (val, msg) {
    new Assertion(val, msg, assert.isNotTrue, true).to.not.equal(true);
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg, assert.isFalse, true).is['false'];
  };

  /**
   * ### .isNotFalse(value, [message])
   *
   * Asserts that `value` is not false.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotFalse(tea, 'great, time for tea!');
   *
   * @name isNotFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFalse = function (val, msg) {
    new Assertion(val, msg, assert.isNotFalse, true).to.not.equal(false);
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg, assert.isNull, true).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg, assert.isNotNull, true).to.not.equal(null);
  };

  /**
   * ### .isNaN
   *
   * Asserts that value is NaN.
   *
   *     assert.isNaN(NaN, 'NaN is NaN');
   *
   * @name isNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNaN = function (val, msg) {
    new Assertion(val, msg, assert.isNaN, true).to.be.NaN;
  };

  /**
   * ### .isNotNaN
   *
   * Asserts that value is not NaN.
   *
   *     assert.isNotNaN(4, '4 is not NaN');
   *
   * @name isNotNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */
  assert.isNotNaN = function (val, msg) {
    new Assertion(val, msg, assert.isNotNaN, true).not.to.be.NaN;
  };

  /**
   * ### .exists
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi';
   *
   *     assert.exists(foo, 'foo is neither `null` nor `undefined`');
   *
   * @name exists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.exists = function (val, msg) {
    new Assertion(val, msg, assert.exists, true).to.exist;
  };

  /**
   * ### .notExists
   *
   * Asserts that the target is either `null` or `undefined`.
   *
   *     var bar = null
   *       , baz;
   *
   *     assert.notExists(bar);
   *     assert.notExists(baz, 'baz is either null or undefined');
   *
   * @name notExists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notExists = function (val, msg) {
    new Assertion(val, msg, assert.notExists, true).to.not.exist;
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg, assert.isUndefined, true).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg, assert.isDefined, true).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg, assert.isFunction, true).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg, assert.isNotFunction, true).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
   * _The assertion does not match subclassed objects._
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg, assert.isObject, true).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg, assert.isNotObject, true).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg, assert.isArray, true).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg, assert.isNotArray, true).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg, assert.isString, true).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg, assert.isNotString, true).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg, assert.isNumber, true).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg, assert.isNotNumber, true).to.not.be.a('number');
  };

   /**
   * ### .isFinite(value, [message])
   *
   * Asserts that `value` is a finite number. Unlike `.isNumber`, this will fail for `NaN` and `Infinity`.
   *
   *     var cups = 2;
   *     assert.isFinite(cups, 'how many cups');
   *
   *     assert.isFinite(NaN); // throws
   *
   * @name isFinite
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFinite = function (val, msg) {
    new Assertion(val, msg, assert.isFinite, true).to.be.finite;
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg, assert.isBoolean, true).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg, assert.isNotBoolean, true).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg, assert.typeOf, true).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg, assert.notTypeOf, true).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert.instanceOf, true).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert.notInstanceOf, true)
      .to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.include([1,2,3], 2, 'array contains value');
   *     assert.include('foobar', 'foo', 'string contains substring');
   *     assert.include({ foo: 'bar', hello: 'universe' }, { foo: 'bar' }, 'object contains property');
   *
   * Strict equality (===) is used. When asserting the inclusion of a value in
   * an array, the array is searched for an element that's strictly equal to the
   * given value. When asserting a subset of properties in an object, the object
   * is searched for the given property keys, checking that each one is present
   * and strictly equal to the given property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.include([obj1, obj2], obj1);
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1});
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1, bar: obj2});
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include, true).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.notInclude([1,2,3], 4, "array doesn't contain value");
   *     assert.notInclude('foobar', 'baz', "string doesn't contain substring");
   *     assert.notInclude({ foo: 'bar', hello: 'universe' }, { foo: 'baz' }, 'object doesn't contain property');
   *
   * Strict equality (===) is used. When asserting the absence of a value in an
   * array, the array is searched to confirm the absence of an element that's
   * strictly equal to the given value. When asserting a subset of properties in
   * an object, the object is searched to confirm that at least one of the given
   * property keys is either not present or not strictly equal to the given
   * property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notInclude([obj1, obj2], {a: 1});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: obj1, bar: {b: 2}});
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude, true).not.include(inc);
  };

  /**
   * ### .deepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.deepInclude([obj1, obj2], {a: 1});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 2}});
   *
   * @name deepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.deepInclude, true).deep.include(inc);
  };

  /**
   * ### .notDeepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notDeepInclude([obj1, obj2], {a: 9});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 9}});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 9}});
   *
   * @name notDeepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepInclude, true).not.deep.include(inc);
  };

  /**
   * ### .nestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.nestedInclude({'.a': {'b': 'x'}}, {'\\.a.[b]': 'x'});
   *     assert.nestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'x'});
   *
   * @name nestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.nestedInclude, true).nested.include(inc);
  };

  /**
   * ### .notNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' does not include 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.notNestedInclude({'.a': {'b': 'x'}}, {'\\.a.b': 'y'});
   *     assert.notNestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'y'});
   *
   * @name notNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notNestedInclude, true)
      .not.nested.include(inc);
  };

  /**
   * ### .deepNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.deepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {x: 1}});
   *     assert.deepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {x: 1}});
   *
   * @name deepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepNestedInclude, true)
      .deep.nested.include(inc);
  };

  /**
   * ### .notDeepNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' does not include 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.notDeepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {y: 1}})
   *     assert.notDeepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {y: 2}});
   *
   * @name notDeepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepNestedInclude, true)
      .not.deep.nested.include(inc);
  };

  /**
   * ### .ownInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while ignoring inherited properties.
   *
   *     assert.ownInclude({ a: 1 }, { a: 1 });
   *
   * @name ownInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.ownInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.ownInclude, true).own.include(inc);
  };

  /**
   * ### .notOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while ignoring inherited properties.
   *
   *     Object.prototype.b = 2;
   *
   *     assert.notOwnInclude({ a: 1 }, { b: 2 });
   *
   * @name notOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notOwnInclude, true).not.own.include(inc);
  };

  /**
   * ### .deepOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while ignoring inherited properties and checking for deep equality.
   *
   *      assert.deepOwnInclude({a: {b: 2}}, {a: {b: 2}});
   *
   * @name deepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepOwnInclude, true)
      .deep.own.include(inc);
  };

   /**
   * ### .notDeepOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while ignoring inherited properties and checking for deep equality.
   *
   *      assert.notDeepOwnInclude({a: {b: 2}}, {a: {c: 3}});
   *
   * @name notDeepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepOwnInclude, true)
      .not.deep.own.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg, assert.match, true).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg, assert.notMatch, true).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *     assert.property({ tea: { green: 'matcha' }}, 'toString');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.property, true).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notProperty, true)
      .to.not.have.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.propertyVal, true)
      .to.have.property(prop, val);
  };

  /**
   * ### .notPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.notPropertyVal({ tea: 'is good' }, 'tea', 'is bad');
   *     assert.notPropertyVal({ tea: 'is good' }, 'coffee', 'is good');
   *
   * @name notPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notPropertyVal, true)
      .to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a deep equality check.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.deepPropertyVal, true)
      .to.have.deep.property(prop, val);
  };

  /**
   * ### .notDeepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a deep equality check.
   *
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *
   * @name notDeepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notDeepPropertyVal, true)
      .to.not.have.deep.property(prop, val);
  };

  /**
   * ### .ownProperty(object, property, [message])
   *
   * Asserts that `object` has a direct property named by `property`. Inherited
   * properties aren't checked.
   *
   *     assert.ownProperty({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name ownProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.ownProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.ownProperty, true)
      .to.have.own.property(prop);
  };

  /**
   * ### .notOwnProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by
   * `property`. Inherited properties aren't checked.
   *
   *     assert.notOwnProperty({ tea: { green: 'matcha' }}, 'coffee');
   *     assert.notOwnProperty({}, 'toString');
   *
   * @name notOwnProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notOwnProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notOwnProperty, true)
      .to.not.have.own.property(prop);
  };

  /**
   * ### .ownPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a strict equality check (===).
   * Inherited properties aren't checked.
   *
   *     assert.ownPropertyVal({ coffee: 'is good'}, 'coffee', 'is good');
   *
   * @name ownPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.ownPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.ownPropertyVal, true)
      .to.have.own.property(prop, value);
  };

  /**
   * ### .notOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a strict equality check
   * (===). Inherited properties aren't checked.
   *
   *     assert.notOwnPropertyVal({ tea: 'is better'}, 'tea', 'is worse');
   *     assert.notOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.notOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.notOwnPropertyVal, true)
      .to.not.have.own.property(prop, value);
  };

  /**
   * ### .deepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a deep equality check. Inherited
   * properties aren't checked.
   *
   *     assert.deepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.deepOwnPropertyVal, true)
      .to.have.deep.own.property(prop, value);
  };

  /**
   * ### .notDeepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a deep equality check.
   * Inherited properties aren't checked.
   *
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *     assert.notDeepOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notDeepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.notDeepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.notDeepOwnPropertyVal, true)
      .to.not.have.deep.own.property(prop, value);
  };

  /**
   * ### .nestedProperty(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`, which can be a string using dot- and bracket-notation for
   * nested reference.
   *
   *     assert.nestedProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name nestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.nestedProperty, true)
      .to.have.nested.property(prop);
  };

  /**
   * ### .notNestedProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for nested reference. The
   * property cannot exist on the object nor anywhere in its prototype chain.
   *
   *     assert.notNestedProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notNestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notNestedProperty, true)
      .to.not.have.nested.property(prop);
  };

  /**
   * ### .nestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a strict equality check (===).
   *
   *     assert.nestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name nestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.nestedPropertyVal, true)
      .to.have.nested.property(prop, val);
  };

  /**
   * ### .notNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a strict equality check (===).
   *
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'coffee.green', 'matcha');
   *
   * @name notNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notNestedPropertyVal, true)
      .to.not.have.nested.property(prop, val);
  };

  /**
   * ### .deepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with a value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a deep equality check.
   *
   *     assert.deepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yum' });
   *
   * @name deepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.deepNestedPropertyVal, true)
      .to.have.deep.nested.property(prop, val);
  };

  /**
   * ### .notDeepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a deep equality check.
   *
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { oolong: 'yum' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yuck' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.black', { matcha: 'yum' });
   *
   * @name notDeepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notDeepNestedPropertyVal, true)
      .to.not.have.deep.nested.property(prop, val);
  }

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` or `size` with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 6, 'string has length of 6');
   *     assert.lengthOf(new Set([1,2,3]), 3, 'set has size of 3');
   *     assert.lengthOf(new Map([['a',1],['b',2],['c',3]]), 3, 'map has size of 3');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg, assert.lengthOf, true).to.have.lengthOf(len);
  };

  /**
   * ### .hasAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'iDontExist', 'baz']);
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, iDontExist: 99, baz: 1337});
   *     assert.hasAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAnyKeys(new Set([{foo: 'bar'}, 'anotherKey']), [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAnyKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyKeys, true).to.have.any.keys(keys);
  }

  /**
   * ### .hasAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337]);
   *     assert.hasAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllKeys, true).to.have.all.keys(keys);
  }

  /**
   * ### .containsAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all of the `keys` provided but may have more keys not listed.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, baz: 1337});
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337});
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}]);
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}]);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name containsAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.containsAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.containsAllKeys, true)
      .to.contain.all.keys(keys);
  }

  /**
   * ### .doesNotHaveAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAnyKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAnyKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAnyKeys, true)
      .to.not.have.any.keys(keys);
  }

  /**
   * ### .doesNotHaveAllKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAllKeys, true)
      .to.not.have.all.keys(keys);
  }

  /**
   * ### .hasAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {three: 'three'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name hasAnyDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyDeepKeys, true)
      .to.have.any.deep.keys(keys);
  }

 /**
   * ### .hasAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne']]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name hasAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllDeepKeys, true)
      .to.have.all.deep.keys(keys);
  }

 /**
   * ### .containsAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` contains all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name containsAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.containsAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.containsAllDeepKeys, true)
      .to.contain.all.deep.keys(keys);
  }

 /**
   * ### .doesNotHaveAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAnyDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAnyDeepKeys, true)
      .to.not.have.any.deep.keys(keys);
  }

 /**
   * ### .doesNotHaveAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {one: 'one'}]);
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAllDeepKeys, true)
      .to.not.have.all.deep.keys(keys);
  }

 /**
   * ### .throws(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will have a
   * message matching `errMsgMatcher`.
   *
   *     assert.throws(fn, 'Error thrown must have this msg');
   *     assert.throws(fn, /Error thrown must have a msg that matches this/);
   *     assert.throws(fn, ReferenceError);
   *     assert.throws(fn, errorInstance);
   *     assert.throws(fn, ReferenceError, 'Error thrown must be a ReferenceError and have this msg');
   *     assert.throws(fn, errorInstance, 'Error thrown must be the same errorInstance and have this msg');
   *     assert.throws(fn, ReferenceError, /Error thrown must be a ReferenceError and match this/);
   *     assert.throws(fn, errorInstance, /Error thrown must be the same errorInstance and match this/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} fn
   * @param {ErrorConstructor|Error} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.throws = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var assertErr = new Assertion(fn, msg, assert.throws, true)
      .to.throw(errorLike, errMsgMatcher);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will _not_ throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is _not_ the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will _not_ have a
   * message matching `errMsgMatcher`.
   *
   *     assert.doesNotThrow(fn, 'Any Error thrown must not have this message');
   *     assert.doesNotThrow(fn, /Any Error thrown must not match this/);
   *     assert.doesNotThrow(fn, Error);
   *     assert.doesNotThrow(fn, errorInstance);
   *     assert.doesNotThrow(fn, Error, 'Error must not have this message');
   *     assert.doesNotThrow(fn, errorInstance, 'Error must not have this message');
   *     assert.doesNotThrow(fn, Error, /Error must not match this/);
   *     assert.doesNotThrow(fn, errorInstance, /Error must not match this/);
   *
   * @name doesNotThrow
   * @param {Function} fn
   * @param {ErrorConstructor} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.doesNotThrow = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    new Assertion(fn, msg, assert.doesNotThrow, true)
      .to.not.throw(errorLike, errMsgMatcher);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    var ok;
    switch(operator) {
      case '==':
        ok = val == val2;
        break;
      case '===':
        ok = val === val2;
        break;
      case '>':
        ok = val > val2;
        break;
      case '>=':
        ok = val >= val2;
        break;
      case '<':
        ok = val < val2;
        break;
      case '<=':
        ok = val <= val2;
        break;
      case '!=':
        ok = val != val2;
        break;
      case '!==':
        ok = val !== val2;
        break;
      default:
        msg = msg ? msg + ': ' : msg;
        throw new chai.AssertionError(
          msg + 'Invalid operator "' + operator + '"',
          undefined,
          assert.operator
        );
    }
    var test = new Assertion(ok, msg, assert.operator, true);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert.closeTo, true).to.be.closeTo(exp, delta);
  };

  /**
   * ### .approximately(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.approximately(1.5, 1, 0.5, 'numbers are close');
   *
   * @name approximately
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.approximately = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert.approximately, true)
      .to.be.approximately(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * strict equality check (===).
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameMembers, true)
      .to.have.same.members(set2);
  }

  /**
   * ### .notSameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a strict equality check (===).
   *
   *     assert.notSameMembers([ 1, 2, 3 ], [ 5, 1, 3 ], 'not same members');
   *
   * @name notSameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameMembers, true)
      .to.not.have.same.members(set2);
  }

  /**
   * ### .sameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * deep equality check.
   *
   *     assert.sameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { c: 3 }], 'same deep members');
   *
   * @name sameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameDeepMembers, true)
      .to.have.same.deep.members(set2);
  }

  /**
   * ### .notSameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a deep equality check.
   *
   *     assert.notSameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { f: 5 }], 'not same deep members');
   *
   * @name notSameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameDeepMembers, true)
      .to.not.have.same.deep.members(set2);
  }

  /**
   * ### .sameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a strict equality check (===).
   *
   *     assert.sameOrderedMembers([ 1, 2, 3 ], [ 1, 2, 3 ], 'same ordered members');
   *
   * @name sameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameOrderedMembers, true)
      .to.have.same.ordered.members(set2);
  }

  /**
   * ### .notSameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a strict equality check (===).
   *
   *     assert.notSameOrderedMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'not same ordered members');
   *
   * @name notSameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameOrderedMembers, true)
      .to.not.have.same.ordered.members(set2);
  }

  /**
   * ### .sameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a deep equality check.
   *
   *     assert.sameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { c: 3 } ], 'same deep ordered members');
   *
   * @name sameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameDeepOrderedMembers, true)
      .to.have.same.deep.ordered.members(set2);
  }

  /**
   * ### .notSameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a deep equality check.
   *
   *     assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { z: 5 } ], 'not same deep ordered members');
   *     assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { c: 3 } ], 'not same deep ordered members');
   *
   * @name notSameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameDeepOrderedMembers, true)
      .to.not.have.same.deep.ordered.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1, 2 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeMembers, true)
      .to.include.members(subset);
  }

  /**
   * ### .notIncludeMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.notIncludeMembers([ 1, 2, 3 ], [ 5, 1 ], 'not include members');
   *
   * @name notIncludeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeMembers, true)
      .to.not.include.members(subset);
  }

  /**
   * ### .includeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a deep
   * equality check. Duplicates are ignored.
   *
   *     assert.includeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { b: 2 } ], 'include deep members');
   *
   * @name includeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeDeepMembers, true)
      .to.include.deep.members(subset);
  }

  /**
   * ### .notIncludeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * deep equality check. Duplicates are ignored.
   *
   *     assert.notIncludeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { f: 5 } ], 'not include deep members');
   *
   * @name notIncludeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeDeepMembers, true)
      .to.not.include.deep.members(subset);
  }

  /**
   * ### .includeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.includeOrderedMembers([ 1, 2, 3 ], [ 1, 2 ], 'include ordered members');
   *
   * @name includeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeOrderedMembers, true)
      .to.include.ordered.members(subset);
  }

  /**
   * ### .notIncludeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 1 ], 'not include ordered members');
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 3 ], 'not include ordered members');
   *
   * @name notIncludeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeOrderedMembers, true)
      .to.not.include.ordered.members(subset);
  }

  /**
   * ### .includeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.includeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 } ], 'include deep ordered members');
   *
   * @name includeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeDeepOrderedMembers, true)
      .to.include.deep.ordered.members(subset);
  }

  /**
   * ### .notIncludeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { f: 5 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { c: 3 } ], 'not include deep ordered members');
   *
   * @name notIncludeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeDeepOrderedMembers, true)
      .to.not.include.deep.ordered.members(subset);
  }

  /**
   * ### .oneOf(inList, list, [message])
   *
   * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
   *
   *     assert.oneOf(1, [ 2, 1 ], 'Not found in list');
   *
   * @name oneOf
   * @param {*} inList
   * @param {Array<*>} list
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.oneOf = function (inList, list, msg) {
    new Assertion(inList, msg, assert.oneOf, true).to.be.oneOf(list);
  }

  /**
   * ### .changes(function, object, property, [message])
   *
   * Asserts that a function changes the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 22 };
   *     assert.changes(fn, obj, 'val');
   *
   * @name changes
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changes = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changes, true).to.change(obj, prop);
  }

   /**
   * ### .changesBy(function, object, property, delta, [message])
   *
   * Asserts that a function changes the value of a property by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 2 };
   *     assert.changesBy(fn, obj, 'val', 2);
   *
   * @name changesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changesBy, true)
      .to.change(obj, prop).by(delta);
  }

   /**
   * ### .doesNotChange(function, object, property, [message])
   *
   * Asserts that a function does not change the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { console.log('foo'); };
   *     assert.doesNotChange(fn, obj, 'val');
   *
   * @name doesNotChange
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotChange = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotChange, true)
      .to.not.change(obj, prop);
  }

  /**
   * ### .changesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not change the value of a property or of a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.changesButNotBy(fn, obj, 'val', 5);
   *
   * @name changesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changesButNotBy, true)
      .to.change(obj, prop).but.not.by(delta);
  }

  /**
   * ### .increases(function, object, property, [message])
   *
   * Asserts that a function increases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 13 };
   *     assert.increases(fn, obj, 'val');
   *
   * @name increases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.increases, true)
      .to.increase(obj, prop);
  }

  /**
   * ### .increasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function increases a numeric object property or a function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.increasesBy(fn, obj, 'val', 10);
   *
   * @name increasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.increasesBy, true)
      .to.increase(obj, prop).by(delta);
  }

  /**
   * ### .doesNotIncrease(function, object, property, [message])
   *
   * Asserts that a function does not increase a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 8 };
   *     assert.doesNotIncrease(fn, obj, 'val');
   *
   * @name doesNotIncrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotIncrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotIncrease, true)
      .to.not.increase(obj, prop);
  }

  /**
   * ### .increasesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not increase a numeric object property or function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.increasesButNotBy(fn, obj, 'val', 10);
   *
   * @name increasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.increasesButNotBy, true)
      .to.increase(obj, prop).but.not.by(delta);
  }

  /**
   * ### .decreases(function, object, property, [message])
   *
   * Asserts that a function decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreases(fn, obj, 'val');
   *
   * @name decreases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.decreases, true)
      .to.decrease(obj, prop);
  }

  /**
   * ### .decreasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val -= 5 };
   *     assert.decreasesBy(fn, obj, 'val', 5);
   *
   * @name decreasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.decreasesBy, true)
      .to.decrease(obj, prop).by(delta);
  }

  /**
   * ### .doesNotDecrease(function, object, property, [message])
   *
   * Asserts that a function does not decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.doesNotDecrease(fn, obj, 'val');
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotDecrease, true)
      .to.not.decrease(obj, prop);
  }

  /**
   * ### .doesNotDecreaseBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.doesNotDecreaseBy(fn, obj, 'val', 1);
   *
   * @name doesNotDecreaseBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecreaseBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotDecreaseBy, true)
      .to.not.decrease(obj, prop).by(delta);
  }

  /**
   * ### .decreasesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreasesButNotBy(fn, obj, 'val', 1);
   *
   * @name decreasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.decreasesButNotBy, true)
      .to.decrease(obj, prop).but.not.by(delta);
  }

  /*!
   * ### .ifError(object)
   *
   * Asserts if value is not a false value, and throws if it is a true value.
   * This is added to allow for chai to be a drop-in replacement for Node's
   * assert class.
   *
   *     var err = new Error('I am a custom error');
   *     assert.ifError(err); // Rethrows err!
   *
   * @name ifError
   * @param {Object} object
   * @namespace Assert
   * @api public
   */

  assert.ifError = function (val) {
    if (val) {
      throw(val);
    }
  };

  /**
   * ### .isExtensible(object)
   *
   * Asserts that `object` is extensible (can have new properties added to it).
   *
   *     assert.isExtensible({});
   *
   * @name isExtensible
   * @alias extensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert.isExtensible, true).to.be.extensible;
  };

  /**
   * ### .isNotExtensible(object)
   *
   * Asserts that `object` is _not_ extensible.
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     assert.isNotExtensible(nonExtensibleObject);
   *     assert.isNotExtensible(sealedObject);
   *     assert.isNotExtensible(frozenObject);
   *
   * @name isNotExtensible
   * @alias notExtensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotExtensible, true).to.not.be.extensible;
  };

  /**
   * ### .isSealed(object)
   *
   * Asserts that `object` is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.seal({});
   *
   *     assert.isSealed(sealedObject);
   *     assert.isSealed(frozenObject);
   *
   * @name isSealed
   * @alias sealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isSealed = function (obj, msg) {
    new Assertion(obj, msg, assert.isSealed, true).to.be.sealed;
  };

  /**
   * ### .isNotSealed(object)
   *
   * Asserts that `object` is _not_ sealed.
   *
   *     assert.isNotSealed({});
   *
   * @name isNotSealed
   * @alias notSealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotSealed = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotSealed, true).to.not.be.sealed;
  };

  /**
   * ### .isFrozen(object)
   *
   * Asserts that `object` is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *     assert.frozen(frozenObject);
   *
   * @name isFrozen
   * @alias frozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert.isFrozen, true).to.be.frozen;
  };

  /**
   * ### .isNotFrozen(object)
   *
   * Asserts that `object` is _not_ frozen.
   *
   *     assert.isNotFrozen({});
   *
   * @name isNotFrozen
   * @alias notFrozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotFrozen, true).to.not.be.frozen;
  };

  /**
   * ### .isEmpty(target)
   *
   * Asserts that the target does not contain any values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isEmpty([]);
   *     assert.isEmpty('');
   *     assert.isEmpty(new Map);
   *     assert.isEmpty({});
   *
   * @name isEmpty
   * @alias empty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isEmpty, true).to.be.empty;
  };

  /**
   * ### .isNotEmpty(target)
   *
   * Asserts that the target contains values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isNotEmpty([1, 2]);
   *     assert.isNotEmpty('34');
   *     assert.isNotEmpty(new Set([5, 6]));
   *     assert.isNotEmpty({ key: 7 });
   *
   * @name isNotEmpty
   * @alias notEmpty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isNotEmpty, true).to.not.be.empty;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('isOk', 'ok')
  ('isNotOk', 'notOk')
  ('throws', 'throw')
  ('throws', 'Throw')
  ('isExtensible', 'extensible')
  ('isNotExtensible', 'notExtensible')
  ('isSealed', 'sealed')
  ('isNotSealed', 'notSealed')
  ('isFrozen', 'frozen')
  ('isNotFrozen', 'notFrozen')
  ('isEmpty', 'empty')
  ('isNotEmpty', 'notEmpty');
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/interface/expect.js":
/*!********************************************************!*\
  !*** ./node_modules/chai/lib/chai/interface/expect.js ***!
  \********************************************************/
/***/ ((module) => {

/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };

  /**
   * ### .fail([message])
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure.
   *
   *     expect.fail();
   *     expect.fail("custom error message");
   *     expect.fail(1, 2);
   *     expect.fail(1, 2, "custom error message");
   *     expect.fail(1, 2, "custom error message", ">");
   *     expect.fail(1, 2, undefined, ">");
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace BDD
   * @api public
   */

  chai.expect.fail = function (actual, expected, message, operator) {
    if (arguments.length < 2) {
        message = actual;
        actual = undefined;
    }

    message = message || 'expect.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, chai.expect.fail);
  };
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/interface/should.js":
/*!********************************************************!*\
  !*** ./node_modules/chai/lib/chai/interface/should.js ***!
  \********************************************************/
/***/ ((module) => {

/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String
          || this instanceof Number
          || this instanceof Boolean
          || typeof Symbol === 'function' && this instanceof Symbol
          || typeof BigInt === 'function' && this instanceof BigInt) {
        return new Assertion(this.valueOf(), null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    /**
     * ### .fail([message])
     * ### .fail(actual, expected, [message], [operator])
     *
     * Throw a failure.
     *
     *     should.fail();
     *     should.fail("custom error message");
     *     should.fail(1, 2);
     *     should.fail(1, 2, "custom error message");
     *     should.fail(1, 2, "custom error message", ">");
     *     should.fail(1, 2, undefined, ">");
     *
     *
     * @name fail
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @param {String} operator
     * @namespace BDD
     * @api public
     */

    should.fail = function (actual, expected, message, operator) {
      if (arguments.length < 2) {
          message = actual;
          actual = undefined;
      }

      message = message || 'should.fail()';
      throw new chai.AssertionError(message, {
          actual: actual
        , expected: expected
        , operator: operator
      }, should.fail);
    };

    /**
     * ### .equal(actual, expected, [message])
     *
     * Asserts non-strict equality (`==`) of `actual` and `expected`.
     *
     *     should.equal(3, '3', '== coerces values to strings');
     *
     * @name equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
     *
     * Asserts that `function` will throw an error that is an instance of
     * `constructor`, or alternately that it will throw an error with message
     * matching `regexp`.
     *
     *     should.throw(fn, 'function throws a reference error');
     *     should.throw(fn, /function throws a reference error/);
     *     should.throw(fn, ReferenceError);
     *     should.throw(fn, ReferenceError, 'function throws a reference error');
     *     should.throw(fn, ReferenceError, /function throws a reference error/);
     *
     * @name throw
     * @alias Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    /**
     * ### .exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var foo = 'hi';
     *
     *     should.exist(foo, 'foo exists');
     *
     * @name exist
     * @namespace Should
     * @api public
     */

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    /**
     * ### .not.equal(actual, expected, [message])
     *
     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
     *
     *     should.not.equal(3, 4, 'these numbers are not equal');
     *
     * @name not.equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/regexp], [message])
     *
     * Asserts that `function` will _not_ throw an error that is an instance of
     * `constructor`, or alternately that it will not throw an error with message
     * matching `regexp`.
     *
     *     should.not.throw(fn, Error, 'function does not throw');
     *
     * @name not.throw
     * @alias not.Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    /**
     * ### .not.exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var bar = null;
     *
     *     should.not.exist(bar, 'bar does not exist');
     *
     * @name not.exist
     * @namespace Should
     * @api public
     */

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/addChainableMethod.js":
/*!****************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/addChainableMethod.js ***!
  \****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var addLengthGuard = __webpack_require__(/*! ./addLengthGuard */ "./node_modules/chai/lib/chai/utils/addLengthGuard.js");
var chai = __webpack_require__(/*! ../../chai */ "./node_modules/chai/lib/chai.js");
var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");
var proxify = __webpack_require__(/*! ./proxify */ "./node_modules/chai/lib/chai/utils/proxify.js");
var transferFlags = __webpack_require__(/*! ./transferFlags */ "./node_modules/chai/lib/chai/utils/transferFlags.js");

/*!
 * Module variables
 */

// Check whether `Object.setPrototypeOf` is supported
var canSetPrototype = typeof Object.setPrototypeOf === 'function';

// Without `Object.setPrototypeOf` support, this module will need to add properties to a function.
// However, some of functions' own props are not configurable and should be skipped.
var testFn = function() {};
var excludeNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
  var propDesc = Object.getOwnPropertyDescriptor(testFn, name);

  // Note: PhantomJS 1.x includes `callee` as one of `testFn`'s own properties,
  // but then returns `undefined` as the property descriptor for `callee`. As a
  // workaround, we perform an otherwise unnecessary type-check for `propDesc`,
  // and then filter it out if it's not an object as it should be.
  if (typeof propDesc !== 'object')
    return true;

  return !propDesc.configurable;
});

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### .addChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

module.exports = function addChainableMethod(ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function chainableMethodGetter() {
        chainableBehavior.chainingBehavior.call(this);

        var chainableMethodWrapper = function () {
          // Setting the `ssfi` flag to `chainableMethodWrapper` causes this
          // function to be the starting point for removing implementation
          // frames from the stack trace of a failed assertion.
          //
          // However, we only want to use this function as the starting point if
          // the `lockSsfi` flag isn't set.
          //
          // If the `lockSsfi` flag is set, then this assertion is being
          // invoked from inside of another assertion. In this case, the `ssfi`
          // flag has already been set by the outer assertion.
          //
          // Note that overwriting a chainable method merely replaces the saved
          // methods in `ctx.__methods` instead of completely replacing the
          // overwritten assertion. Therefore, an overwriting assertion won't
          // set the `ssfi` or `lockSsfi` flags.
          if (!flag(this, 'lockSsfi')) {
            flag(this, 'ssfi', chainableMethodWrapper);
          }

          var result = chainableBehavior.method.apply(this, arguments);
          if (result !== undefined) {
            return result;
          }

          var newAssertion = new chai.Assertion();
          transferFlags(this, newAssertion);
          return newAssertion;
        };

        addLengthGuard(chainableMethodWrapper, name, true);

        // Use `Object.setPrototypeOf` if available
        if (canSetPrototype) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
          Object.setPrototypeOf(chainableMethodWrapper, prototype);
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (excludeNames.indexOf(asserterName) !== -1) {
              return;
            }

            var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
            Object.defineProperty(chainableMethodWrapper, asserterName, pd);
          });
        }

        transferFlags(this, chainableMethodWrapper);
        return proxify(chainableMethodWrapper);
      }
    , configurable: true
  });
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/addLengthGuard.js":
/*!************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/addLengthGuard.js ***!
  \************************************************************/
/***/ ((module) => {

var fnLengthDesc = Object.getOwnPropertyDescriptor(function () {}, 'length');

/*!
 * Chai - addLengthGuard utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .addLengthGuard(fn, assertionName, isChainable)
 *
 * Define `length` as a getter on the given uninvoked method assertion. The
 * getter acts as a guard against chaining `length` directly off of an uninvoked
 * method assertion, which is a problem because it references `function`'s
 * built-in `length` property instead of Chai's `length` assertion. When the
 * getter catches the user making this mistake, it throws an error with a
 * helpful message.
 *
 * There are two ways in which this mistake can be made. The first way is by
 * chaining the `length` assertion directly off of an uninvoked chainable
 * method. In this case, Chai suggests that the user use `lengthOf` instead. The
 * second way is by chaining the `length` assertion directly off of an uninvoked
 * non-chainable method. Non-chainable methods must be invoked prior to
 * chaining. In this case, Chai suggests that the user consult the docs for the
 * given assertion.
 *
 * If the `length` property of functions is unconfigurable, then return `fn`
 * without modification.
 *
 * Note that in ES6, the function's `length` property is configurable, so once
 * support for legacy environments is dropped, Chai's `length` property can
 * replace the built-in function's `length` property, and this length guard will
 * no longer be necessary. In the mean time, maintaining consistency across all
 * environments is the priority.
 *
 * @param {Function} fn
 * @param {String} assertionName
 * @param {Boolean} isChainable
 * @namespace Utils
 * @name addLengthGuard
 */

module.exports = function addLengthGuard (fn, assertionName, isChainable) {
  if (!fnLengthDesc.configurable) return fn;

  Object.defineProperty(fn, 'length', {
    get: function () {
      if (isChainable) {
        throw Error('Invalid Chai property: ' + assertionName + '.length. Due' +
          ' to a compatibility issue, "length" cannot directly follow "' +
          assertionName + '". Use "' + assertionName + '.lengthOf" instead.');
      }

      throw Error('Invalid Chai property: ' + assertionName + '.length. See' +
        ' docs for proper usage of "' + assertionName + '".');
    }
  });

  return fn;
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/addMethod.js":
/*!*******************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/addMethod.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var addLengthGuard = __webpack_require__(/*! ./addLengthGuard */ "./node_modules/chai/lib/chai/utils/addLengthGuard.js");
var chai = __webpack_require__(/*! ../../chai */ "./node_modules/chai/lib/chai.js");
var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");
var proxify = __webpack_require__(/*! ./proxify */ "./node_modules/chai/lib/chai/utils/proxify.js");
var transferFlags = __webpack_require__(/*! ./transferFlags */ "./node_modules/chai/lib/chai/utils/transferFlags.js");

/**
 * ### .addMethod(ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @namespace Utils
 * @name addMethod
 * @api public
 */

module.exports = function addMethod(ctx, name, method) {
  var methodWrapper = function () {
    // Setting the `ssfi` flag to `methodWrapper` causes this function to be the
    // starting point for removing implementation frames from the stack trace of
    // a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', methodWrapper);
    }

    var result = method.apply(this, arguments);
    if (result !== undefined)
      return result;

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  addLengthGuard(methodWrapper, name, false);
  ctx[name] = proxify(methodWrapper, name);
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/addProperty.js":
/*!*********************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/addProperty.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = __webpack_require__(/*! ../../chai */ "./node_modules/chai/lib/chai.js");
var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");
var isProxyEnabled = __webpack_require__(/*! ./isProxyEnabled */ "./node_modules/chai/lib/chai/utils/isProxyEnabled.js");
var transferFlags = __webpack_require__(/*! ./transferFlags */ "./node_modules/chai/lib/chai/utils/transferFlags.js");

/**
 * ### .addProperty(ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @namespace Utils
 * @name addProperty
 * @api public
 */

module.exports = function addProperty(ctx, name, getter) {
  getter = getter === undefined ? function () {} : getter;

  Object.defineProperty(ctx, name,
    { get: function propertyGetter() {
        // Setting the `ssfi` flag to `propertyGetter` causes this function to
        // be the starting point for removing implementation frames from the
        // stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', propertyGetter);
        }

        var result = getter.call(this);
        if (result !== undefined)
          return result;

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/compareByInspect.js":
/*!**************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/compareByInspect.js ***!
  \**************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - compareByInspect utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var inspect = __webpack_require__(/*! ./inspect */ "./node_modules/chai/lib/chai/utils/inspect.js");

/**
 * ### .compareByInspect(mixed, mixed)
 *
 * To be used as a compareFunction with Array.prototype.sort. Compares elements
 * using inspect instead of default behavior of using toString so that Symbols
 * and objects with irregular/missing toString can still be sorted without a
 * TypeError.
 *
 * @param {Mixed} first element to compare
 * @param {Mixed} second element to compare
 * @returns {Number} -1 if 'a' should come before 'b'; otherwise 1
 * @name compareByInspect
 * @namespace Utils
 * @api public
 */

module.exports = function compareByInspect(a, b) {
  return inspect(a) < inspect(b) ? -1 : 1;
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/expectTypes.js":
/*!*********************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/expectTypes.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - expectTypes utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .expectTypes(obj, types)
 *
 * Ensures that the object being tested against is of a valid type.
 *
 *     utils.expectTypes(this, ['array', 'object', 'string']);
 *
 * @param {Mixed} obj constructed Assertion
 * @param {Array} type A list of allowed types for this assertion
 * @namespace Utils
 * @name expectTypes
 * @api public
 */

var AssertionError = __webpack_require__(/*! assertion-error */ "./node_modules/assertion-error/index.js");
var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");
var type = __webpack_require__(/*! type-detect */ "./node_modules/type-detect/type-detect.js");

module.exports = function expectTypes(obj, types) {
  var flagMsg = flag(obj, 'message');
  var ssfi = flag(obj, 'ssfi');

  flagMsg = flagMsg ? flagMsg + ': ' : '';

  obj = flag(obj, 'object');
  types = types.map(function (t) { return t.toLowerCase(); });
  types.sort();

  // Transforms ['lorem', 'ipsum'] into 'a lorem, or an ipsum'
  var str = types.map(function (t, index) {
    var art = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(t.charAt(0)) ? 'an' : 'a';
    var or = types.length > 1 && index === types.length - 1 ? 'or ' : '';
    return or + art + ' ' + t;
  }).join(', ');

  var objType = type(obj).toLowerCase();

  if (!types.some(function (expected) { return objType === expected; })) {
    throw new AssertionError(
      flagMsg + 'object tested must be ' + str + ', but ' + objType + ' given',
      undefined,
      ssfi
    );
  }
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/flag.js":
/*!**************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/flag.js ***!
  \**************************************************/
/***/ ((module) => {

/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .flag(object, key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @namespace Utils
 * @name flag
 * @api private
 */

module.exports = function flag(obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/getActual.js":
/*!*******************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/getActual.js ***!
  \*******************************************************/
/***/ ((module) => {

/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getActual
 */

module.exports = function getActual(obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/getMessage.js":
/*!********************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/getMessage.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js")
  , getActual = __webpack_require__(/*! ./getActual */ "./node_modules/chai/lib/chai/utils/getActual.js")
  , objDisplay = __webpack_require__(/*! ./objDisplay */ "./node_modules/chai/lib/chai/utils/objDisplay.js");

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getMessage
 * @api public
 */

module.exports = function getMessage(obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#\{this\}/g, function () { return objDisplay(val); })
    .replace(/#\{act\}/g, function () { return objDisplay(actual); })
    .replace(/#\{exp\}/g, function () { return objDisplay(expected); });

  return flagMsg ? flagMsg + ': ' + msg : msg;
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/getOperator.js":
/*!*********************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/getOperator.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var type = __webpack_require__(/*! type-detect */ "./node_modules/type-detect/type-detect.js");

var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");

function isObjectType(obj) {
  var objectType = type(obj);
  var objectTypes = ['Array', 'Object', 'function'];

  return objectTypes.indexOf(objectType) !== -1;
}

/**
 * ### .getOperator(message)
 *
 * Extract the operator from error message.
 * Operator defined is based on below link
 * https://nodejs.org/api/assert.html#assert_assert.
 *
 * Returns the `operator` or `undefined` value for an Assertion.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getOperator
 * @api public
 */

module.exports = function getOperator(obj, args) {
  var operator = flag(obj, 'operator');
  var negate = flag(obj, 'negate');
  var expected = args[3];
  var msg = negate ? args[2] : args[1];

  if (operator) {
    return operator;
  }

  if (typeof msg === 'function') msg = msg();

  msg = msg || '';
  if (!msg) {
    return undefined;
  }

  if (/\shave\s/.test(msg)) {
    return undefined;
  }

  var isObject = isObjectType(expected);
  if (/\snot\s/.test(msg)) {
    return isObject ? 'notDeepStrictEqual' : 'notStrictEqual';
  }

  return isObject ? 'deepStrictEqual' : 'strictEqual';
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/getOwnEnumerableProperties.js":
/*!************************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/getOwnEnumerableProperties.js ***!
  \************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - getOwnEnumerableProperties utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var getOwnEnumerablePropertySymbols = __webpack_require__(/*! ./getOwnEnumerablePropertySymbols */ "./node_modules/chai/lib/chai/utils/getOwnEnumerablePropertySymbols.js");

/**
 * ### .getOwnEnumerableProperties(object)
 *
 * This allows the retrieval of directly-owned enumerable property names and
 * symbols of an object. This function is necessary because Object.keys only
 * returns enumerable property names, not enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerableProperties
 * @api public
 */

module.exports = function getOwnEnumerableProperties(obj) {
  return Object.keys(obj).concat(getOwnEnumerablePropertySymbols(obj));
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/getOwnEnumerablePropertySymbols.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/getOwnEnumerablePropertySymbols.js ***!
  \*****************************************************************************/
/***/ ((module) => {

/*!
 * Chai - getOwnEnumerablePropertySymbols utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getOwnEnumerablePropertySymbols(object)
 *
 * This allows the retrieval of directly-owned enumerable property symbols of an
 * object. This function is necessary because Object.getOwnPropertySymbols
 * returns both enumerable and non-enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerablePropertySymbols
 * @api public
 */

module.exports = function getOwnEnumerablePropertySymbols(obj) {
  if (typeof Object.getOwnPropertySymbols !== 'function') return [];

  return Object.getOwnPropertySymbols(obj).filter(function (sym) {
    return Object.getOwnPropertyDescriptor(obj, sym).enumerable;
  });
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/getProperties.js":
/*!***********************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/getProperties.js ***!
  \***********************************************************/
/***/ ((module) => {

/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(object);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(object);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/index.js":
/*!***************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/index.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Dependencies that are used for multiple exports are required here only once
 */

var pathval = __webpack_require__(/*! pathval */ "./node_modules/pathval/index.js");

/*!
 * test utility
 */

exports.test = __webpack_require__(/*! ./test */ "./node_modules/chai/lib/chai/utils/test.js");

/*!
 * type utility
 */

exports.type = __webpack_require__(/*! type-detect */ "./node_modules/type-detect/type-detect.js");

/*!
 * expectTypes utility
 */
exports.expectTypes = __webpack_require__(/*! ./expectTypes */ "./node_modules/chai/lib/chai/utils/expectTypes.js");

/*!
 * message utility
 */

exports.getMessage = __webpack_require__(/*! ./getMessage */ "./node_modules/chai/lib/chai/utils/getMessage.js");

/*!
 * actual utility
 */

exports.getActual = __webpack_require__(/*! ./getActual */ "./node_modules/chai/lib/chai/utils/getActual.js");

/*!
 * Inspect util
 */

exports.inspect = __webpack_require__(/*! ./inspect */ "./node_modules/chai/lib/chai/utils/inspect.js");

/*!
 * Object Display util
 */

exports.objDisplay = __webpack_require__(/*! ./objDisplay */ "./node_modules/chai/lib/chai/utils/objDisplay.js");

/*!
 * Flag utility
 */

exports.flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");

/*!
 * Flag transferring utility
 */

exports.transferFlags = __webpack_require__(/*! ./transferFlags */ "./node_modules/chai/lib/chai/utils/transferFlags.js");

/*!
 * Deep equal utility
 */

exports.eql = __webpack_require__(/*! deep-eql */ "./node_modules/deep-eql/index.js");

/*!
 * Deep path info
 */

exports.getPathInfo = pathval.getPathInfo;

/*!
 * Check if a property exists
 */

exports.hasProperty = pathval.hasProperty;

/*!
 * Function name
 */

exports.getName = __webpack_require__(/*! get-func-name */ "./node_modules/get-func-name/index.js");

/*!
 * add Property
 */

exports.addProperty = __webpack_require__(/*! ./addProperty */ "./node_modules/chai/lib/chai/utils/addProperty.js");

/*!
 * add Method
 */

exports.addMethod = __webpack_require__(/*! ./addMethod */ "./node_modules/chai/lib/chai/utils/addMethod.js");

/*!
 * overwrite Property
 */

exports.overwriteProperty = __webpack_require__(/*! ./overwriteProperty */ "./node_modules/chai/lib/chai/utils/overwriteProperty.js");

/*!
 * overwrite Method
 */

exports.overwriteMethod = __webpack_require__(/*! ./overwriteMethod */ "./node_modules/chai/lib/chai/utils/overwriteMethod.js");

/*!
 * Add a chainable method
 */

exports.addChainableMethod = __webpack_require__(/*! ./addChainableMethod */ "./node_modules/chai/lib/chai/utils/addChainableMethod.js");

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = __webpack_require__(/*! ./overwriteChainableMethod */ "./node_modules/chai/lib/chai/utils/overwriteChainableMethod.js");

/*!
 * Compare by inspect method
 */

exports.compareByInspect = __webpack_require__(/*! ./compareByInspect */ "./node_modules/chai/lib/chai/utils/compareByInspect.js");

/*!
 * Get own enumerable property symbols method
 */

exports.getOwnEnumerablePropertySymbols = __webpack_require__(/*! ./getOwnEnumerablePropertySymbols */ "./node_modules/chai/lib/chai/utils/getOwnEnumerablePropertySymbols.js");

/*!
 * Get own enumerable properties method
 */

exports.getOwnEnumerableProperties = __webpack_require__(/*! ./getOwnEnumerableProperties */ "./node_modules/chai/lib/chai/utils/getOwnEnumerableProperties.js");

/*!
 * Checks error against a given set of criteria
 */

exports.checkError = __webpack_require__(/*! check-error */ "./node_modules/check-error/index.js");

/*!
 * Proxify util
 */

exports.proxify = __webpack_require__(/*! ./proxify */ "./node_modules/chai/lib/chai/utils/proxify.js");

/*!
 * addLengthGuard util
 */

exports.addLengthGuard = __webpack_require__(/*! ./addLengthGuard */ "./node_modules/chai/lib/chai/utils/addLengthGuard.js");

/*!
 * isProxyEnabled helper
 */

exports.isProxyEnabled = __webpack_require__(/*! ./isProxyEnabled */ "./node_modules/chai/lib/chai/utils/isProxyEnabled.js");

/*!
 * isNaN method
 */

exports.isNaN = __webpack_require__(/*! ./isNaN */ "./node_modules/chai/lib/chai/utils/isNaN.js");

/*!
 * getOperator method
 */

exports.getOperator = __webpack_require__(/*! ./getOperator */ "./node_modules/chai/lib/chai/utils/getOperator.js");

/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/inspect.js":
/*!*****************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/inspect.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = __webpack_require__(/*! get-func-name */ "./node_modules/get-func-name/index.js");
var loupe = __webpack_require__(/*! loupe */ "./node_modules/loupe/loupe.js");
var config = __webpack_require__(/*! ../config */ "./node_modules/chai/lib/chai/config.js");

module.exports = inspect;

/**
 * ### .inspect(obj, [showHidden], [depth], [colors])
 *
 * Echoes the value of a value. Tries to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects. Default is false.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 * @namespace Utils
 * @name inspect
 */
function inspect(obj, showHidden, depth, colors) {
  var options = {
    colors: colors,
    depth: (typeof depth === 'undefined' ? 2 : depth),
    showHidden: showHidden,
    truncate: config.truncateThreshold ? config.truncateThreshold : Infinity,
  };
  return loupe.inspect(obj, options);
}


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/isNaN.js":
/*!***************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/isNaN.js ***!
  \***************************************************/
/***/ ((module) => {

/*!
 * Chai - isNaN utility
 * Copyright(c) 2012-2015 Sakthipriyan Vairamani <thechargingvolcano@gmail.com>
 * MIT Licensed
 */

/**
 * ### .isNaN(value)
 *
 * Checks if the given value is NaN or not.
 *
 *     utils.isNaN(NaN); // true
 *
 * @param {Value} The value which has to be checked if it is NaN
 * @name isNaN
 * @api private
 */

function isNaN(value) {
  // Refer http://www.ecma-international.org/ecma-262/6.0/#sec-isnan-number
  // section's NOTE.
  return value !== value;
}

// If ECMAScript 6's Number.isNaN is present, prefer that.
module.exports = Number.isNaN || isNaN;


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/isProxyEnabled.js":
/*!************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/isProxyEnabled.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var config = __webpack_require__(/*! ../config */ "./node_modules/chai/lib/chai/config.js");

/*!
 * Chai - isProxyEnabled helper
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .isProxyEnabled()
 *
 * Helper function to check if Chai's proxy protection feature is enabled. If
 * proxies are unsupported or disabled via the user's Chai config, then return
 * false. Otherwise, return true.
 *
 * @namespace Utils
 * @name isProxyEnabled
 */

module.exports = function isProxyEnabled() {
  return config.useProxy &&
    typeof Proxy !== 'undefined' &&
    typeof Reflect !== 'undefined';
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/objDisplay.js":
/*!********************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/objDisplay.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var inspect = __webpack_require__(/*! ./inspect */ "./node_modules/chai/lib/chai/utils/inspect.js");
var config = __webpack_require__(/*! ../config */ "./node_modules/chai/lib/chai/config.js");

/**
 * ### .objDisplay(object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @namespace Utils
 * @api public
 */

module.exports = function objDisplay(obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/overwriteChainableMethod.js":
/*!**********************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/overwriteChainableMethod.js ***!
  \**********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = __webpack_require__(/*! ../../chai */ "./node_modules/chai/lib/chai.js");
var transferFlags = __webpack_require__(/*! ./transferFlags */ "./node_modules/chai/lib/chai/utils/transferFlags.js");

/**
 * ### .overwriteChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Overwrites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'lengthOf',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.lengthOf(3);
 *     expect(myFoo).to.have.lengthOf.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @namespace Utils
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function overwriteChainableMethod(ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function overwritingChainableMethodGetter() {
    var result = chainingBehavior(_chainingBehavior).call(this);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function overwritingChainableMethodWrapper() {
    var result = method(_method).apply(this, arguments);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/overwriteMethod.js":
/*!*************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/overwriteMethod.js ***!
  \*************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var addLengthGuard = __webpack_require__(/*! ./addLengthGuard */ "./node_modules/chai/lib/chai/utils/addLengthGuard.js");
var chai = __webpack_require__(/*! ../../chai */ "./node_modules/chai/lib/chai.js");
var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");
var proxify = __webpack_require__(/*! ./proxify */ "./node_modules/chai/lib/chai/utils/proxify.js");
var transferFlags = __webpack_require__(/*! ./transferFlags */ "./node_modules/chai/lib/chai/utils/transferFlags.js");

/**
 * ### .overwriteMethod(ctx, name, fn)
 *
 * Overwrites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @namespace Utils
 * @name overwriteMethod
 * @api public
 */

module.exports = function overwriteMethod(ctx, name, method) {
  var _method = ctx[name]
    , _super = function () {
      throw new Error(name + ' is not a function');
    };

  if (_method && 'function' === typeof _method)
    _super = _method;

  var overwritingMethodWrapper = function () {
    // Setting the `ssfi` flag to `overwritingMethodWrapper` causes this
    // function to be the starting point for removing implementation frames from
    // the stack trace of a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', overwritingMethodWrapper);
    }

    // Setting the `lockSsfi` flag to `true` prevents the overwritten assertion
    // from changing the `ssfi` flag. By this point, the `ssfi` flag is already
    // set to the correct starting point for this assertion.
    var origLockSsfi = flag(this, 'lockSsfi');
    flag(this, 'lockSsfi', true);
    var result = method(_super).apply(this, arguments);
    flag(this, 'lockSsfi', origLockSsfi);

    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  }

  addLengthGuard(overwritingMethodWrapper, name, false);
  ctx[name] = proxify(overwritingMethodWrapper, name);
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/overwriteProperty.js":
/*!***************************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/overwriteProperty.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = __webpack_require__(/*! ../../chai */ "./node_modules/chai/lib/chai.js");
var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");
var isProxyEnabled = __webpack_require__(/*! ./isProxyEnabled */ "./node_modules/chai/lib/chai/utils/isProxyEnabled.js");
var transferFlags = __webpack_require__(/*! ./transferFlags */ "./node_modules/chai/lib/chai/utils/transferFlags.js");

/**
 * ### .overwriteProperty(ctx, name, fn)
 *
 * Overwrites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @namespace Utils
 * @name overwriteProperty
 * @api public
 */

module.exports = function overwriteProperty(ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function overwritingPropertyGetter() {
        // Setting the `ssfi` flag to `overwritingPropertyGetter` causes this
        // function to be the starting point for removing implementation frames
        // from the stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', overwritingPropertyGetter);
        }

        // Setting the `lockSsfi` flag to `true` prevents the overwritten
        // assertion from changing the `ssfi` flag. By this point, the `ssfi`
        // flag is already set to the correct starting point for this assertion.
        var origLockSsfi = flag(this, 'lockSsfi');
        flag(this, 'lockSsfi', true);
        var result = getter(_super).call(this);
        flag(this, 'lockSsfi', origLockSsfi);

        if (result !== undefined) {
          return result;
        }

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/proxify.js":
/*!*****************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/proxify.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var config = __webpack_require__(/*! ../config */ "./node_modules/chai/lib/chai/config.js");
var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");
var getProperties = __webpack_require__(/*! ./getProperties */ "./node_modules/chai/lib/chai/utils/getProperties.js");
var isProxyEnabled = __webpack_require__(/*! ./isProxyEnabled */ "./node_modules/chai/lib/chai/utils/isProxyEnabled.js");

/*!
 * Chai - proxify utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .proxify(object)
 *
 * Return a proxy of given object that throws an error when a non-existent
 * property is read. By default, the root cause is assumed to be a misspelled
 * property, and thus an attempt is made to offer a reasonable suggestion from
 * the list of existing properties. However, if a nonChainableMethodName is
 * provided, then the root cause is instead a failure to invoke a non-chainable
 * method prior to reading the non-existent property.
 *
 * If proxies are unsupported or disabled via the user's Chai config, then
 * return object without modification.
 *
 * @param {Object} obj
 * @param {String} nonChainableMethodName
 * @namespace Utils
 * @name proxify
 */

var builtins = ['__flags', '__methods', '_obj', 'assert'];

module.exports = function proxify(obj, nonChainableMethodName) {
  if (!isProxyEnabled()) return obj;

  return new Proxy(obj, {
    get: function proxyGetter(target, property) {
      // This check is here because we should not throw errors on Symbol properties
      // such as `Symbol.toStringTag`.
      // The values for which an error should be thrown can be configured using
      // the `config.proxyExcludedKeys` setting.
      if (typeof property === 'string' &&
          config.proxyExcludedKeys.indexOf(property) === -1 &&
          !Reflect.has(target, property)) {
        // Special message for invalid property access of non-chainable methods.
        if (nonChainableMethodName) {
          throw Error('Invalid Chai property: ' + nonChainableMethodName + '.' +
            property + '. See docs for proper usage of "' +
            nonChainableMethodName + '".');
        }

        // If the property is reasonably close to an existing Chai property,
        // suggest that property to the user. Only suggest properties with a
        // distance less than 4.
        var suggestion = null;
        var suggestionDistance = 4;
        getProperties(target).forEach(function(prop) {
          if (
            !Object.prototype.hasOwnProperty(prop) &&
            builtins.indexOf(prop) === -1
          ) {
            var dist = stringDistanceCapped(
              property,
              prop,
              suggestionDistance
            );
            if (dist < suggestionDistance) {
              suggestion = prop;
              suggestionDistance = dist;
            }
          }
        });

        if (suggestion !== null) {
          throw Error('Invalid Chai property: ' + property +
            '. Did you mean "' + suggestion + '"?');
        } else {
          throw Error('Invalid Chai property: ' + property);
        }
      }

      // Use this proxy getter as the starting point for removing implementation
      // frames from the stack trace of a failed assertion. For property
      // assertions, this prevents the proxy getter from showing up in the stack
      // trace since it's invoked before the property getter. For method and
      // chainable method assertions, this flag will end up getting changed to
      // the method wrapper, which is good since this frame will no longer be in
      // the stack once the method is invoked. Note that Chai builtin assertion
      // properties such as `__flags` are skipped since this is only meant to
      // capture the starting point of an assertion. This step is also skipped
      // if the `lockSsfi` flag is set, thus indicating that this assertion is
      // being called from within another assertion. In that case, the `ssfi`
      // flag is already set to the outer assertion's starting point.
      if (builtins.indexOf(property) === -1 && !flag(target, 'lockSsfi')) {
        flag(target, 'ssfi', proxyGetter);
      }

      return Reflect.get(target, property);
    }
  });
};

/**
 * # stringDistanceCapped(strA, strB, cap)
 * Return the Levenshtein distance between two strings, but no more than cap.
 * @param {string} strA
 * @param {string} strB
 * @param {number} number
 * @return {number} min(string distance between strA and strB, cap)
 * @api private
 */

function stringDistanceCapped(strA, strB, cap) {
  if (Math.abs(strA.length - strB.length) >= cap) {
    return cap;
  }

  var memo = [];
  // `memo` is a two-dimensional array containing distances.
  // memo[i][j] is the distance between strA.slice(0, i) and
  // strB.slice(0, j).
  for (var i = 0; i <= strA.length; i++) {
    memo[i] = Array(strB.length + 1).fill(0);
    memo[i][0] = i;
  }
  for (var j = 0; j < strB.length; j++) {
    memo[0][j] = j;
  }

  for (var i = 1; i <= strA.length; i++) {
    var ch = strA.charCodeAt(i - 1);
    for (var j = 1; j <= strB.length; j++) {
      if (Math.abs(i - j) >= cap) {
        memo[i][j] = cap;
        continue;
      }
      memo[i][j] = Math.min(
        memo[i - 1][j] + 1,
        memo[i][j - 1] + 1,
        memo[i - 1][j - 1] +
          (ch === strB.charCodeAt(j - 1) ? 0 : 1)
      );
    }
  }

  return memo[strA.length][strB.length];
}


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/test.js":
/*!**************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/test.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var flag = __webpack_require__(/*! ./flag */ "./node_modules/chai/lib/chai/utils/flag.js");

/**
 * ### .test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name test
 */

module.exports = function test(obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};


/***/ }),

/***/ "./node_modules/chai/lib/chai/utils/transferFlags.js":
/*!***********************************************************!*\
  !*** ./node_modules/chai/lib/chai/utils/transferFlags.js ***!
  \***********************************************************/
/***/ ((module) => {

/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, `lockSsfi`,
 * and `message`) will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAssertion = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags to; usually a new assertion
 * @param {Boolean} includeAll
 * @namespace Utils
 * @name transferFlags
 * @api private
 */

module.exports = function transferFlags(assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag !== 'lockSsfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};


/***/ }),

/***/ "./node_modules/check-error/index.js":
/*!*******************************************!*\
  !*** ./node_modules/check-error/index.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";


/* !
 * Chai - checkError utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .checkError
 *
 * Checks that an error conforms to a given set of criteria and/or retrieves information about it.
 *
 * @api public
 */

/**
 * ### .compatibleInstance(thrown, errorLike)
 *
 * Checks if two instances are compatible (strict equal).
 * Returns false if errorLike is not an instance of Error, because instances
 * can only be compatible if they're both error instances.
 *
 * @name compatibleInstance
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleInstance(thrown, errorLike) {
  return errorLike instanceof Error && thrown === errorLike;
}

/**
 * ### .compatibleConstructor(thrown, errorLike)
 *
 * Checks if two constructors are compatible.
 * This function can receive either an error constructor or
 * an error instance as the `errorLike` argument.
 * Constructors are compatible if they're the same or if one is
 * an instance of another.
 *
 * @name compatibleConstructor
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleConstructor(thrown, errorLike) {
  if (errorLike instanceof Error) {
    // If `errorLike` is an instance of any error we compare their constructors
    return thrown.constructor === errorLike.constructor || thrown instanceof errorLike.constructor;
  } else if (errorLike.prototype instanceof Error || errorLike === Error) {
    // If `errorLike` is a constructor that inherits from Error, we compare `thrown` to `errorLike` directly
    return thrown.constructor === errorLike || thrown instanceof errorLike;
  }

  return false;
}

/**
 * ### .compatibleMessage(thrown, errMatcher)
 *
 * Checks if an error's message is compatible with a matcher (String or RegExp).
 * If the message contains the String or passes the RegExp test,
 * it is considered compatible.
 *
 * @name compatibleMessage
 * @param {Error} thrown error
 * @param {String|RegExp} errMatcher to look for into the message
 * @namespace Utils
 * @api public
 */

function compatibleMessage(thrown, errMatcher) {
  var comparisonString = typeof thrown === 'string' ? thrown : thrown.message;
  if (errMatcher instanceof RegExp) {
    return errMatcher.test(comparisonString);
  } else if (typeof errMatcher === 'string') {
    return comparisonString.indexOf(errMatcher) !== -1; // eslint-disable-line no-magic-numbers
  }

  return false;
}

/**
 * ### .getFunctionName(constructorFn)
 *
 * Returns the name of a function.
 * This also includes a polyfill function if `constructorFn.name` is not defined.
 *
 * @name getFunctionName
 * @param {Function} constructorFn
 * @namespace Utils
 * @api private
 */

var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\(\/]+)/;
function getFunctionName(constructorFn) {
  var name = '';
  if (typeof constructorFn.name === 'undefined') {
    // Here we run a polyfill if constructorFn.name is not defined
    var match = String(constructorFn).match(functionNameMatch);
    if (match) {
      name = match[1];
    }
  } else {
    name = constructorFn.name;
  }

  return name;
}

/**
 * ### .getConstructorName(errorLike)
 *
 * Gets the constructor name for an Error instance or constructor itself.
 *
 * @name getConstructorName
 * @param {Error|ErrorConstructor} errorLike
 * @namespace Utils
 * @api public
 */

function getConstructorName(errorLike) {
  var constructorName = errorLike;
  if (errorLike instanceof Error) {
    constructorName = getFunctionName(errorLike.constructor);
  } else if (typeof errorLike === 'function') {
    // If `err` is not an instance of Error it is an error constructor itself or another function.
    // If we've got a common function we get its name, otherwise we may need to create a new instance
    // of the error just in case it's a poorly-constructed error. Please see chaijs/chai/issues/45 to know more.
    constructorName = getFunctionName(errorLike).trim() ||
        getFunctionName(new errorLike()); // eslint-disable-line new-cap
  }

  return constructorName;
}

/**
 * ### .getMessage(errorLike)
 *
 * Gets the error message from an error.
 * If `err` is a String itself, we return it.
 * If the error has no message, we return an empty string.
 *
 * @name getMessage
 * @param {Error|String} errorLike
 * @namespace Utils
 * @api public
 */

function getMessage(errorLike) {
  var msg = '';
  if (errorLike && errorLike.message) {
    msg = errorLike.message;
  } else if (typeof errorLike === 'string') {
    msg = errorLike;
  }

  return msg;
}

module.exports = {
  compatibleInstance: compatibleInstance,
  compatibleConstructor: compatibleConstructor,
  compatibleMessage: compatibleMessage,
  getMessage: getMessage,
  getConstructorName: getConstructorName,
};


/***/ }),

/***/ "./node_modules/deep-eql/index.js":
/*!****************************************!*\
  !*** ./node_modules/deep-eql/index.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

/* globals Symbol: false, Uint8Array: false, WeakMap: false */
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var type = __webpack_require__(/*! type-detect */ "./node_modules/type-detect/type-detect.js");
function FakeMap() {
  this._key = 'chai/deep-eql__' + Math.random() + Date.now();
}

FakeMap.prototype = {
  get: function getMap(key) {
    return key[this._key];
  },
  set: function setMap(key, value) {
    if (Object.isExtensible(key)) {
      Object.defineProperty(key, this._key, {
        value: value,
        configurable: true,
      });
    }
  },
};

var MemoizeMap = typeof WeakMap === 'function' ? WeakMap : FakeMap;
/*!
 * Check to see if the MemoizeMap has recorded a result of the two operands
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @returns {Boolean|null} result
*/
function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return null;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    var result = leftHandMap.get(rightHandOperand);
    if (typeof result === 'boolean') {
      return result;
    }
  }
  return null;
}

/*!
 * Set the result of the equality into the MemoizeMap
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @param {Boolean} result
*/
function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    leftHandMap.set(rightHandOperand, result);
  } else {
    leftHandMap = new MemoizeMap();
    leftHandMap.set(rightHandOperand, result);
    memoizeMap.set(leftHandOperand, leftHandMap);
  }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;
module.exports.MemoizeMap = MemoizeMap;

/**
 * Assert deeply nested sameValue equality between two objects of any type.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
 */
function deepEqual(leftHandOperand, rightHandOperand, options) {
  // If we have a comparator, we can't assume anything; so bail to its check first.
  if (options && options.comparator) {
    return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
  }

  var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
  if (simpleResult !== null) {
    return simpleResult;
  }

  // Deeper comparisons are pushed through to a larger function
  return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
}

/**
 * Many comparisons can be canceled out early via simple equality or primitive checks.
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @return {Boolean|null} equal match
 */
function simpleEqual(leftHandOperand, rightHandOperand) {
  // Equal references (except for Numbers) can be returned early
  if (leftHandOperand === rightHandOperand) {
    // Handle +-0 cases
    return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
  }

  // handle NaN cases
  if (
    leftHandOperand !== leftHandOperand && // eslint-disable-line no-self-compare
    rightHandOperand !== rightHandOperand // eslint-disable-line no-self-compare
  ) {
    return true;
  }

  // Anything that is not an 'object', i.e. symbols, functions, booleans, numbers,
  // strings, and undefined, can be compared by reference.
  if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    // Easy out b/c it would have passed the first equality check
    return false;
  }
  return null;
}

/*!
 * The main logic of the `deepEqual` function.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
*/
function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
  options = options || {};
  options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
  var comparator = options && options.comparator;

  // Check if a memoized result exists.
  var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
  if (memoizeResultLeft !== null) {
    return memoizeResultLeft;
  }
  var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
  if (memoizeResultRight !== null) {
    return memoizeResultRight;
  }

  // If a comparator is present, use it.
  if (comparator) {
    var comparatorResult = comparator(leftHandOperand, rightHandOperand);
    // Comparators may return null, in which case we want to go back to default behavior.
    if (comparatorResult === false || comparatorResult === true) {
      memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
      return comparatorResult;
    }
    // To allow comparators to override *any* behavior, we ran them first. Since it didn't decide
    // what to do, we need to make sure to return the basic tests first before we move on.
    var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
    if (simpleResult !== null) {
      // Don't memoize this, it takes longer to set/retrieve than to just compare.
      return simpleResult;
    }
  }

  var leftHandType = type(leftHandOperand);
  if (leftHandType !== type(rightHandOperand)) {
    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
    return false;
  }

  // Temporarily set the operands in the memoize object to prevent blowing the stack
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);

  var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
  return result;
}

function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
  switch (leftHandType) {
    case 'String':
    case 'Number':
    case 'Boolean':
    case 'Date':
      // If these types are their instance types (e.g. `new Number`) then re-deepEqual against their values
      return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
    case 'Promise':
    case 'Symbol':
    case 'function':
    case 'WeakMap':
    case 'WeakSet':
    case 'Error':
      return leftHandOperand === rightHandOperand;
    case 'Arguments':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'Array':
      return iterableEqual(leftHandOperand, rightHandOperand, options);
    case 'RegExp':
      return regexpEqual(leftHandOperand, rightHandOperand);
    case 'Generator':
      return generatorEqual(leftHandOperand, rightHandOperand, options);
    case 'DataView':
      return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
    case 'ArrayBuffer':
      return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
    case 'Set':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    case 'Map':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    default:
      return objectEqual(leftHandOperand, rightHandOperand, options);
  }
}

/*!
 * Compare two Regular Expressions for equality.
 *
 * @param {RegExp} leftHandOperand
 * @param {RegExp} rightHandOperand
 * @return {Boolean} result
 */

function regexpEqual(leftHandOperand, rightHandOperand) {
  return leftHandOperand.toString() === rightHandOperand.toString();
}

/*!
 * Compare two Sets/Maps for equality. Faster than other equality functions.
 *
 * @param {Set} leftHandOperand
 * @param {Set} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function entriesEqual(leftHandOperand, rightHandOperand, options) {
  // IE11 doesn't support Set#entries or Set#@@iterator, so we need manually populate using Set#forEach
  if (leftHandOperand.size !== rightHandOperand.size) {
    return false;
  }
  if (leftHandOperand.size === 0) {
    return true;
  }
  var leftHandItems = [];
  var rightHandItems = [];
  leftHandOperand.forEach(function gatherEntries(key, value) {
    leftHandItems.push([ key, value ]);
  });
  rightHandOperand.forEach(function gatherEntries(key, value) {
    rightHandItems.push([ key, value ]);
  });
  return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
}

/*!
 * Simple equality for flat iterable objects such as Arrays, TypedArrays or Node.js buffers.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function iterableEqual(leftHandOperand, rightHandOperand, options) {
  var length = leftHandOperand.length;
  if (length !== rightHandOperand.length) {
    return false;
  }
  if (length === 0) {
    return true;
  }
  var index = -1;
  while (++index < length) {
    if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Simple equality for generator objects such as those returned by generator functions.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function generatorEqual(leftHandOperand, rightHandOperand, options) {
  return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
}

/*!
 * Determine if the given object has an @@iterator function.
 *
 * @param {Object} target
 * @return {Boolean} `true` if the object has an @@iterator function.
 */
function hasIteratorFunction(target) {
  return typeof Symbol !== 'undefined' &&
    typeof target === 'object' &&
    typeof Symbol.iterator !== 'undefined' &&
    typeof target[Symbol.iterator] === 'function';
}

/*!
 * Gets all iterator entries from the given Object. If the Object has no @@iterator function, returns an empty array.
 * This will consume the iterator - which could have side effects depending on the @@iterator implementation.
 *
 * @param {Object} target
 * @returns {Array} an array of entries from the @@iterator function
 */
function getIteratorEntries(target) {
  if (hasIteratorFunction(target)) {
    try {
      return getGeneratorEntries(target[Symbol.iterator]());
    } catch (iteratorError) {
      return [];
    }
  }
  return [];
}

/*!
 * Gets all entries from a Generator. This will consume the generator - which could have side effects.
 *
 * @param {Generator} target
 * @returns {Array} an array of entries from the Generator.
 */
function getGeneratorEntries(generator) {
  var generatorResult = generator.next();
  var accumulator = [ generatorResult.value ];
  while (generatorResult.done === false) {
    generatorResult = generator.next();
    accumulator.push(generatorResult.value);
  }
  return accumulator;
}

/*!
 * Gets all own and inherited enumerable keys from a target.
 *
 * @param {Object} target
 * @returns {Array} an array of own and inherited enumerable keys from the target.
 */
function getEnumerableKeys(target) {
  var keys = [];
  for (var key in target) {
    keys.push(key);
  }
  return keys;
}

/*!
 * Determines if two objects have matching values, given a set of keys. Defers to deepEqual for the equality check of
 * each key. If any value of the given key is not equal, the function will return false (early).
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Array} keys An array of keys to compare the values of leftHandOperand and rightHandOperand against
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */
function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
  var length = keys.length;
  if (length === 0) {
    return true;
  }
  for (var i = 0; i < length; i += 1) {
    if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Recursively check the equality of two Objects. Once basic sameness has been established it will defer to `deepEqual`
 * for each enumerable key in the object.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function objectEqual(leftHandOperand, rightHandOperand, options) {
  var leftHandKeys = getEnumerableKeys(leftHandOperand);
  var rightHandKeys = getEnumerableKeys(rightHandOperand);
  if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
    leftHandKeys.sort();
    rightHandKeys.sort();
    if (iterableEqual(leftHandKeys, rightHandKeys) === false) {
      return false;
    }
    return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
  }

  var leftHandEntries = getIteratorEntries(leftHandOperand);
  var rightHandEntries = getIteratorEntries(rightHandOperand);
  if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
    leftHandEntries.sort();
    rightHandEntries.sort();
    return iterableEqual(leftHandEntries, rightHandEntries, options);
  }

  if (leftHandKeys.length === 0 &&
      leftHandEntries.length === 0 &&
      rightHandKeys.length === 0 &&
      rightHandEntries.length === 0) {
    return true;
  }

  return false;
}

/*!
 * Returns true if the argument is a primitive.
 *
 * This intentionally returns true for all objects that can be compared by reference,
 * including functions and symbols.
 *
 * @param {Mixed} value
 * @return {Boolean} result
 */
function isPrimitive(value) {
  return value === null || typeof value !== 'object';
}


/***/ }),

/***/ "./node_modules/foreach/index.js":
/*!***************************************!*\
  !*** ./node_modules/foreach/index.js ***!
  \***************************************/
/***/ ((module) => {


var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};



/***/ }),

/***/ "./node_modules/function-bind/implementation.js":
/*!******************************************************!*\
  !*** ./node_modules/function-bind/implementation.js ***!
  \******************************************************/
/***/ ((module) => {

"use strict";


/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};


/***/ }),

/***/ "./node_modules/function-bind/index.js":
/*!*********************************************!*\
  !*** ./node_modules/function-bind/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var implementation = __webpack_require__(/*! ./implementation */ "./node_modules/function-bind/implementation.js");

module.exports = Function.prototype.bind || implementation;


/***/ }),

/***/ "./node_modules/get-func-name/index.js":
/*!*********************************************!*\
  !*** ./node_modules/get-func-name/index.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


/* !
 * Chai - getFuncName utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getFuncName(constructorFn)
 *
 * Returns the name of a function.
 * When a non-function instance is passed, returns `null`.
 * This also includes a polyfill function if `aFunc.name` is not defined.
 *
 * @name getFuncName
 * @param {Function} funct
 * @namespace Utils
 * @api public
 */

var toString = Function.prototype.toString;
var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
function getFuncName(aFunc) {
  if (typeof aFunc !== 'function') {
    return null;
  }

  var name = '';
  if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
    // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
    var match = toString.call(aFunc).match(functionNameMatch);
    if (match) {
      name = match[1];
    }
  } else {
    // If we've got a `name` property we just use it
    name = aFunc.name;
  }

  return name;
}

module.exports = getFuncName;


/***/ }),

/***/ "./node_modules/get-intrinsic/index.js":
/*!*********************************************!*\
  !*** ./node_modules/get-intrinsic/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = __webpack_require__(/*! has-symbols */ "./node_modules/has-symbols/index.js")();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var hasOwn = __webpack_require__(/*! has */ "./node_modules/has/src/index.js");
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};


/***/ }),

/***/ "./node_modules/has-symbols/index.js":
/*!*******************************************!*\
  !*** ./node_modules/has-symbols/index.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = __webpack_require__(/*! ./shams */ "./node_modules/has-symbols/shams.js");

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};


/***/ }),

/***/ "./node_modules/has-symbols/shams.js":
/*!*******************************************!*\
  !*** ./node_modules/has-symbols/shams.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";


/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};


/***/ }),

/***/ "./node_modules/has-tostringtag/shams.js":
/*!***********************************************!*\
  !*** ./node_modules/has-tostringtag/shams.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var hasSymbols = __webpack_require__(/*! has-symbols/shams */ "./node_modules/has-symbols/shams.js");

module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};


/***/ }),

/***/ "./node_modules/has/src/index.js":
/*!***************************************!*\
  !*** ./node_modules/has/src/index.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);


/***/ }),

/***/ "./node_modules/inherits/inherits_browser.js":
/*!***************************************************!*\
  !*** ./node_modules/inherits/inherits_browser.js ***!
  \***************************************************/
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),

/***/ "./node_modules/is-arguments/index.js":
/*!********************************************!*\
  !*** ./node_modules/is-arguments/index.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();
var callBound = __webpack_require__(/*! call-bind/callBound */ "./node_modules/call-bind/callBound.js");

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;


/***/ }),

/***/ "./node_modules/is-generator-function/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/is-generator-function/index.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var GeneratorFunction;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	if (!getProto) {
		return false;
	}
	if (typeof GeneratorFunction === 'undefined') {
		var generatorFunc = getGeneratorFunc();
		GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
	}
	return getProto(fn) === GeneratorFunction;
};


/***/ }),

/***/ "./node_modules/is-typed-array/index.js":
/*!**********************************************!*\
  !*** ./node_modules/is-typed-array/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var forEach = __webpack_require__(/*! foreach */ "./node_modules/foreach/index.js");
var availableTypedArrays = __webpack_require__(/*! available-typed-arrays */ "./node_modules/available-typed-arrays/index.js");
var callBound = __webpack_require__(/*! call-bind/callBound */ "./node_modules/call-bind/callBound.js");

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();

var g = typeof globalThis === 'undefined' ? __webpack_require__.g : globalThis;
var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = __webpack_require__(/*! es-abstract/helpers/getOwnPropertyDescriptor */ "./node_modules/es-abstract/helpers/getOwnPropertyDescriptor.js");
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new g[typedArray]();
		if (Symbol.toStringTag in arr) {
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};


/***/ }),

/***/ "./node_modules/loupe/loupe.js":
/*!*************************************!*\
  !*** ./node_modules/loupe/loupe.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

(function (global, factory) {
   true ? factory(exports) :
  0;
}(this, (function (exports) { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var ansiColors = {
    bold: ['1', '22'],
    dim: ['2', '22'],
    italic: ['3', '23'],
    underline: ['4', '24'],
    // 5 & 6 are blinking
    inverse: ['7', '27'],
    hidden: ['8', '28'],
    strike: ['9', '29'],
    // 10-20 are fonts
    // 21-29 are resets for 1-9
    black: ['30', '39'],
    red: ['31', '39'],
    green: ['32', '39'],
    yellow: ['33', '39'],
    blue: ['34', '39'],
    magenta: ['35', '39'],
    cyan: ['36', '39'],
    white: ['37', '39'],
    brightblack: ['30;1', '39'],
    brightred: ['31;1', '39'],
    brightgreen: ['32;1', '39'],
    brightyellow: ['33;1', '39'],
    brightblue: ['34;1', '39'],
    brightmagenta: ['35;1', '39'],
    brightcyan: ['36;1', '39'],
    brightwhite: ['37;1', '39'],
    grey: ['90', '39']
  };
  var styles = {
    special: 'cyan',
    number: 'yellow',
    bigint: 'yellow',
    boolean: 'yellow',
    undefined: 'grey',
    null: 'bold',
    string: 'green',
    symbol: 'green',
    date: 'magenta',
    regexp: 'red'
  };
  var truncator = '…';

  function colorise(value, styleType) {
    var color = ansiColors[styles[styleType]] || ansiColors[styleType];

    if (!color) {
      return String(value);
    }

    return "\x1B[".concat(color[0], "m").concat(String(value), "\x1B[").concat(color[1], "m");
  }

  function normaliseOptions() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$showHidden = _ref.showHidden,
        showHidden = _ref$showHidden === void 0 ? false : _ref$showHidden,
        _ref$depth = _ref.depth,
        depth = _ref$depth === void 0 ? 2 : _ref$depth,
        _ref$colors = _ref.colors,
        colors = _ref$colors === void 0 ? false : _ref$colors,
        _ref$customInspect = _ref.customInspect,
        customInspect = _ref$customInspect === void 0 ? true : _ref$customInspect,
        _ref$showProxy = _ref.showProxy,
        showProxy = _ref$showProxy === void 0 ? false : _ref$showProxy,
        _ref$maxArrayLength = _ref.maxArrayLength,
        maxArrayLength = _ref$maxArrayLength === void 0 ? Infinity : _ref$maxArrayLength,
        _ref$breakLength = _ref.breakLength,
        breakLength = _ref$breakLength === void 0 ? Infinity : _ref$breakLength,
        _ref$seen = _ref.seen,
        seen = _ref$seen === void 0 ? [] : _ref$seen,
        _ref$truncate = _ref.truncate,
        truncate = _ref$truncate === void 0 ? Infinity : _ref$truncate,
        _ref$stylize = _ref.stylize,
        stylize = _ref$stylize === void 0 ? String : _ref$stylize;

    var options = {
      showHidden: Boolean(showHidden),
      depth: Number(depth),
      colors: Boolean(colors),
      customInspect: Boolean(customInspect),
      showProxy: Boolean(showProxy),
      maxArrayLength: Number(maxArrayLength),
      breakLength: Number(breakLength),
      truncate: Number(truncate),
      seen: seen,
      stylize: stylize
    };

    if (options.colors) {
      options.stylize = colorise;
    }

    return options;
  }
  function truncate(string, length) {
    var tail = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : truncator;
    string = String(string);
    var tailLength = tail.length;
    var stringLength = string.length;

    if (tailLength > length && stringLength > tailLength) {
      return tail;
    }

    if (stringLength > length && stringLength > tailLength) {
      return "".concat(string.slice(0, length - tailLength)).concat(tail);
    }

    return string;
  } // eslint-disable-next-line complexity

  function inspectList(list, options, inspectItem) {
    var separator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ', ';
    inspectItem = inspectItem || options.inspect;
    var size = list.length;
    if (size === 0) return '';
    var originalLength = options.truncate;
    var output = '';
    var peek = '';
    var truncated = '';

    for (var i = 0; i < size; i += 1) {
      var last = i + 1 === list.length;
      var secondToLast = i + 2 === list.length;
      truncated = "".concat(truncator, "(").concat(list.length - i, ")");
      var value = list[i]; // If there is more than one remaining we need to account for a separator of `, `

      options.truncate = originalLength - output.length - (last ? 0 : separator.length);
      var string = peek || inspectItem(value, options) + (last ? '' : separator);
      var nextLength = output.length + string.length;
      var truncatedLength = nextLength + truncated.length; // If this is the last element, and adding it would
      // take us over length, but adding the truncator wouldn't - then break now

      if (last && nextLength > originalLength && output.length + truncated.length <= originalLength) {
        break;
      } // If this isn't the last or second to last element to scan,
      // but the string is already over length then break here


      if (!last && !secondToLast && truncatedLength > originalLength) {
        break;
      } // Peek at the next string to determine if we should
      // break early before adding this item to the output


      peek = last ? '' : inspectItem(list[i + 1], options) + (secondToLast ? '' : separator); // If we have one element left, but this element and
      // the next takes over length, the break early

      if (!last && secondToLast && truncatedLength > originalLength && nextLength + peek.length > originalLength) {
        break;
      }

      output += string; // If the next element takes us to length -
      // but there are more after that, then we should truncate now

      if (!last && !secondToLast && nextLength + peek.length >= originalLength) {
        truncated = "".concat(truncator, "(").concat(list.length - i - 1, ")");
        break;
      }

      truncated = '';
    }

    return "".concat(output).concat(truncated);
  }

  function quoteComplexKey(key) {
    if (key.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)) {
      return key;
    }

    return JSON.stringify(key).replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
  }

  function inspectProperty(_ref2, options) {
    var _ref3 = _slicedToArray(_ref2, 2),
        key = _ref3[0],
        value = _ref3[1];

    options.truncate -= 2;

    if (typeof key === 'string') {
      key = quoteComplexKey(key);
    } else if (typeof key !== 'number') {
      key = "[".concat(options.inspect(key, options), "]");
    }

    options.truncate -= key.length;
    value = options.inspect(value, options);
    return "".concat(key, ": ").concat(value);
  }

  function inspectArray(array, options) {
    // Object.keys will always output the Array indices first, so we can slice by
    // `array.length` to get non-index properties
    var nonIndexProperties = Object.keys(array).slice(array.length);
    if (!array.length && !nonIndexProperties.length) return '[]';
    options.truncate -= 4;
    var listContents = inspectList(array, options);
    options.truncate -= listContents.length;
    var propertyContents = '';

    if (nonIndexProperties.length) {
      propertyContents = inspectList(nonIndexProperties.map(function (key) {
        return [key, array[key]];
      }), options, inspectProperty);
    }

    return "[ ".concat(listContents).concat(propertyContents ? ", ".concat(propertyContents) : '', " ]");
  }

  /* !
   * Chai - getFuncName utility
   * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
   * MIT Licensed
   */

  /**
   * ### .getFuncName(constructorFn)
   *
   * Returns the name of a function.
   * When a non-function instance is passed, returns `null`.
   * This also includes a polyfill function if `aFunc.name` is not defined.
   *
   * @name getFuncName
   * @param {Function} funct
   * @namespace Utils
   * @api public
   */

  var toString = Function.prototype.toString;
  var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
  function getFuncName(aFunc) {
    if (typeof aFunc !== 'function') {
      return null;
    }

    var name = '';
    if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
      // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
      var match = toString.call(aFunc).match(functionNameMatch);
      if (match) {
        name = match[1];
      }
    } else {
      // If we've got a `name` property we just use it
      name = aFunc.name;
    }

    return name;
  }

  var getFuncName_1 = getFuncName;

  var getArrayName = function getArrayName(array) {
    // We need to special case Node.js' Buffers, which report to be Uint8Array
    if (typeof Buffer === 'function' && array instanceof Buffer) {
      return 'Buffer';
    }

    if (array[Symbol.toStringTag]) {
      return array[Symbol.toStringTag];
    }

    return getFuncName_1(array.constructor);
  };

  function inspectTypedArray(array, options) {
    var name = getArrayName(array);
    options.truncate -= name.length + 4; // Object.keys will always output the Array indices first, so we can slice by
    // `array.length` to get non-index properties

    var nonIndexProperties = Object.keys(array).slice(array.length);
    if (!array.length && !nonIndexProperties.length) return "".concat(name, "[]"); // As we know TypedArrays only contain Unsigned Integers, we can skip inspecting each one and simply
    // stylise the toString() value of them

    var output = '';

    for (var i = 0; i < array.length; i++) {
      var string = "".concat(options.stylize(truncate(array[i], options.truncate), 'number')).concat(i === array.length - 1 ? '' : ', ');
      options.truncate -= string.length;

      if (array[i] !== array.length && options.truncate <= 3) {
        output += "".concat(truncator, "(").concat(array.length - array[i] + 1, ")");
        break;
      }

      output += string;
    }

    var propertyContents = '';

    if (nonIndexProperties.length) {
      propertyContents = inspectList(nonIndexProperties.map(function (key) {
        return [key, array[key]];
      }), options, inspectProperty);
    }

    return "".concat(name, "[ ").concat(output).concat(propertyContents ? ", ".concat(propertyContents) : '', " ]");
  }

  function inspectDate(dateObject, options) {
    // If we need to - truncate the time portion, but never the date
    var split = dateObject.toJSON().split('T');
    var date = split[0];
    return options.stylize("".concat(date, "T").concat(truncate(split[1], options.truncate - date.length - 1)), 'date');
  }

  function inspectFunction(func, options) {
    var name = getFuncName_1(func);

    if (!name) {
      return options.stylize('[Function]', 'special');
    }

    return options.stylize("[Function ".concat(truncate(name, options.truncate - 11), "]"), 'special');
  }

  function inspectMapEntry(_ref, options) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    options.truncate -= 4;
    key = options.inspect(key, options);
    options.truncate -= key.length;
    value = options.inspect(value, options);
    return "".concat(key, " => ").concat(value);
  } // IE11 doesn't support `map.entries()`


  function mapToEntries(map) {
    var entries = [];
    map.forEach(function (value, key) {
      entries.push([key, value]);
    });
    return entries;
  }

  function inspectMap(map, options) {
    var size = map.size - 1;

    if (size <= 0) {
      return 'Map{}';
    }

    options.truncate -= 7;
    return "Map{ ".concat(inspectList(mapToEntries(map), options, inspectMapEntry), " }");
  }

  var isNaN = Number.isNaN || function (i) {
    return i !== i;
  }; // eslint-disable-line no-self-compare


  function inspectNumber(number, options) {
    if (isNaN(number)) {
      return options.stylize('NaN', 'number');
    }

    if (number === Infinity) {
      return options.stylize('Infinity', 'number');
    }

    if (number === -Infinity) {
      return options.stylize('-Infinity', 'number');
    }

    if (number === 0) {
      return options.stylize(1 / number === Infinity ? '+0' : '-0', 'number');
    }

    return options.stylize(truncate(number, options.truncate), 'number');
  }

  function inspectBigInt(number, options) {
    var nums = truncate(number.toString(), options.truncate - 1);
    if (nums !== truncator) nums += 'n';
    return options.stylize(nums, 'bigint');
  }

  function inspectRegExp(value, options) {
    var flags = value.toString().split('/')[2];
    var sourceLength = options.truncate - (2 + flags.length);
    var source = value.source;
    return options.stylize("/".concat(truncate(source, sourceLength), "/").concat(flags), 'regexp');
  }

  function arrayFromSet(set) {
    var values = [];
    set.forEach(function (value) {
      values.push(value);
    });
    return values;
  }

  function inspectSet(set, options) {
    if (set.size === 0) return 'Set{}';
    options.truncate -= 7;
    return "Set{ ".concat(inspectList(arrayFromSet(set), options), " }");
  }

  var stringEscapeChars = new RegExp("['\\u0000-\\u001f\\u007f-\\u009f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5" + "\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]", 'g');
  var escapeCharacters = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    "'": "\\'",
    '\\': '\\\\'
  };
  var hex = 16;
  var unicodeLength = 4;

  function escape(char) {
    return escapeCharacters[char] || "\\u".concat("0000".concat(char.charCodeAt(0).toString(hex)).slice(-unicodeLength));
  }

  function inspectString(string, options) {
    if (stringEscapeChars.test(string)) {
      string = string.replace(stringEscapeChars, escape);
    }

    return options.stylize("'".concat(truncate(string, options.truncate - 2), "'"), 'string');
  }

  function inspectSymbol(value) {
    if ('description' in Symbol.prototype) {
      return value.description ? "Symbol(".concat(value.description, ")") : 'Symbol()';
    }

    return value.toString();
  }

  var getPromiseValue = function getPromiseValue() {
    return 'Promise{…}';
  };

  try {
    var _process$binding = process.binding('util'),
        getPromiseDetails = _process$binding.getPromiseDetails,
        kPending = _process$binding.kPending,
        kRejected = _process$binding.kRejected;

    if (Array.isArray(getPromiseDetails(Promise.resolve()))) {
      getPromiseValue = function getPromiseValue(value, options) {
        var _getPromiseDetails = getPromiseDetails(value),
            _getPromiseDetails2 = _slicedToArray(_getPromiseDetails, 2),
            state = _getPromiseDetails2[0],
            innerValue = _getPromiseDetails2[1];

        if (state === kPending) {
          return 'Promise{<pending>}';
        }

        return "Promise".concat(state === kRejected ? '!' : '', "{").concat(options.inspect(innerValue, options), "}");
      };
    }
  } catch (notNode) {
    /* ignore */
  }

  var inspectPromise = getPromiseValue;

  function inspectObject(object, options) {
    var properties = Object.getOwnPropertyNames(object);
    var symbols = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(object) : [];

    if (properties.length === 0 && symbols.length === 0) {
      return '{}';
    }

    options.truncate -= 4;
    options.seen = options.seen || [];

    if (options.seen.indexOf(object) >= 0) {
      return '[Circular]';
    }

    options.seen.push(object);
    var propertyContents = inspectList(properties.map(function (key) {
      return [key, object[key]];
    }), options, inspectProperty);
    var symbolContents = inspectList(symbols.map(function (key) {
      return [key, object[key]];
    }), options, inspectProperty);
    options.seen.pop();
    var sep = '';

    if (propertyContents && symbolContents) {
      sep = ', ';
    }

    return "{ ".concat(propertyContents).concat(sep).concat(symbolContents, " }");
  }

  var toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag ? Symbol.toStringTag : false;
  function inspectClass(value, options) {
    var name = '';

    if (toStringTag && toStringTag in value) {
      name = value[toStringTag];
    }

    name = name || getFuncName_1(value.constructor); // Babel transforms anonymous classes to the name `_class`

    if (!name || name === '_class') {
      name = '<Anonymous Class>';
    }

    options.truncate -= name.length;
    return "".concat(name).concat(inspectObject(value, options));
  }

  function inspectArguments(args, options) {
    if (args.length === 0) return 'Arguments[]';
    options.truncate -= 13;
    return "Arguments[ ".concat(inspectList(args, options), " ]");
  }

  var errorKeys = ['stack', 'line', 'column', 'name', 'message', 'fileName', 'lineNumber', 'columnNumber', 'number', 'description'];
  function inspectObject$1(error, options) {
    var properties = Object.getOwnPropertyNames(error).filter(function (key) {
      return errorKeys.indexOf(key) === -1;
    });
    var name = error.name;
    options.truncate -= name.length;
    var message = '';

    if (typeof error.message === 'string') {
      message = truncate(error.message, options.truncate);
    } else {
      properties.unshift('message');
    }

    message = message ? ": ".concat(message) : '';
    options.truncate -= message.length + 5;
    var propertyContents = inspectList(properties.map(function (key) {
      return [key, error[key]];
    }), options, inspectProperty);
    return "".concat(name).concat(message).concat(propertyContents ? " { ".concat(propertyContents, " }") : '');
  }

  function inspectAttribute(_ref, options) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    options.truncate -= 3;

    if (!value) {
      return "".concat(options.stylize(key, 'yellow'));
    }

    return "".concat(options.stylize(key, 'yellow'), "=").concat(options.stylize("\"".concat(value, "\""), 'string'));
  }
  function inspectHTMLCollection(collection, options) {
    // eslint-disable-next-line no-use-before-define
    return inspectList(collection, options, inspectHTML, '\n');
  }
  function inspectHTML(element, options) {
    var properties = element.getAttributeNames();
    var name = element.tagName.toLowerCase();
    var head = options.stylize("<".concat(name), 'special');
    var headClose = options.stylize(">", 'special');
    var tail = options.stylize("</".concat(name, ">"), 'special');
    options.truncate -= name.length * 2 + 5;
    var propertyContents = '';

    if (properties.length > 0) {
      propertyContents += ' ';
      propertyContents += inspectList(properties.map(function (key) {
        return [key, element.getAttribute(key)];
      }), options, inspectAttribute, ' ');
    }

    options.truncate -= propertyContents.length;
    var truncate = options.truncate;
    var children = inspectHTMLCollection(element.children, options);

    if (children && children.length > truncate) {
      children = "".concat(truncator, "(").concat(element.children.length, ")");
    }

    return "".concat(head).concat(propertyContents).concat(headClose).concat(children).concat(tail);
  }

  var symbolsSupported = typeof Symbol === 'function' && typeof Symbol.for === 'function';
  var chaiInspect = symbolsSupported ? Symbol.for('chai/inspect') : '@@chai/inspect';
  var nodeInspect = false;

  try {
    // eslint-disable-next-line global-require
    var nodeUtil = __webpack_require__(/*! util */ "./node_modules/util/util.js");

    nodeInspect = nodeUtil.inspect ? nodeUtil.inspect.custom : false;
  } catch (noNodeInspect) {
    nodeInspect = false;
  }

  var constructorMap = new WeakMap();
  var stringTagMap = {};
  var baseTypesMap = {
    undefined: function undefined$1(value, options) {
      return options.stylize('undefined', 'undefined');
    },
    null: function _null(value, options) {
      return options.stylize(null, 'null');
    },
    boolean: function boolean(value, options) {
      return options.stylize(value, 'boolean');
    },
    Boolean: function Boolean(value, options) {
      return options.stylize(value, 'boolean');
    },
    number: inspectNumber,
    Number: inspectNumber,
    bigint: inspectBigInt,
    BigInt: inspectBigInt,
    string: inspectString,
    String: inspectString,
    function: inspectFunction,
    Function: inspectFunction,
    symbol: inspectSymbol,
    // A Symbol polyfill will return `Symbol` not `symbol` from typedetect
    Symbol: inspectSymbol,
    Array: inspectArray,
    Date: inspectDate,
    Map: inspectMap,
    Set: inspectSet,
    RegExp: inspectRegExp,
    Promise: inspectPromise,
    // WeakSet, WeakMap are totally opaque to us
    WeakSet: function WeakSet(value, options) {
      return options.stylize('WeakSet{…}', 'special');
    },
    WeakMap: function WeakMap(value, options) {
      return options.stylize('WeakMap{…}', 'special');
    },
    Arguments: inspectArguments,
    Int8Array: inspectTypedArray,
    Uint8Array: inspectTypedArray,
    Uint8ClampedArray: inspectTypedArray,
    Int16Array: inspectTypedArray,
    Uint16Array: inspectTypedArray,
    Int32Array: inspectTypedArray,
    Uint32Array: inspectTypedArray,
    Float32Array: inspectTypedArray,
    Float64Array: inspectTypedArray,
    Generator: function Generator() {
      return '';
    },
    DataView: function DataView() {
      return '';
    },
    ArrayBuffer: function ArrayBuffer() {
      return '';
    },
    Error: inspectObject$1,
    HTMLCollection: inspectHTMLCollection,
    NodeList: inspectHTMLCollection
  }; // eslint-disable-next-line complexity

  var inspectCustom = function inspectCustom(value, options, type) {
    if (chaiInspect in value && typeof value[chaiInspect] === 'function') {
      return value[chaiInspect](options);
    }

    if (nodeInspect && nodeInspect in value && typeof value[nodeInspect] === 'function') {
      return value[nodeInspect](options.depth, options);
    }

    if ('inspect' in value && typeof value.inspect === 'function') {
      return value.inspect(options.depth, options);
    }

    if ('constructor' in value && constructorMap.has(value.constructor)) {
      return constructorMap.get(value.constructor)(value, options);
    }

    if (stringTagMap[type]) {
      return stringTagMap[type](value, options);
    }

    return '';
  };

  var toString$1 = Object.prototype.toString; // eslint-disable-next-line complexity

  function inspect(value, options) {
    options = normaliseOptions(options);
    options.inspect = inspect;
    var _options = options,
        customInspect = _options.customInspect;
    var type = value === null ? 'null' : _typeof(value);

    if (type === 'object') {
      type = toString$1.call(value).slice(8, -1);
    } // If it is a base value that we already support, then use Loupe's inspector


    if (baseTypesMap[type]) {
      return baseTypesMap[type](value, options);
    } // If `options.customInspect` is set to true then try to use the custom inspector


    if (customInspect && value) {
      var output = inspectCustom(value, options, type);

      if (output) {
        if (typeof output === 'string') return output;
        return inspect(output, options);
      }
    }

    var proto = value ? Object.getPrototypeOf(value) : false; // If it's a plain Object then use Loupe's inspector

    if (proto === Object.prototype || proto === null) {
      return inspectObject(value, options);
    } // Specifically account for HTMLElements
    // eslint-disable-next-line no-undef


    if (value && typeof HTMLElement === 'function' && value instanceof HTMLElement) {
      return inspectHTML(value, options);
    }

    if ('constructor' in value) {
      // If it is a class, inspect it like an object but add the constructor name
      if (value.constructor !== Object) {
        return inspectClass(value, options);
      } // If it is an object with an anonymous prototype, display it as an object.


      return inspectObject(value, options);
    } // We have run out of options! Just stringify the value


    return options.stylize(String(value), type);
  }
  function registerConstructor(constructor, inspector) {
    if (constructorMap.has(constructor)) {
      return false;
    }

    constructorMap.add(constructor, inspector);
    return true;
  }
  function registerStringTag(stringTag, inspector) {
    if (stringTag in stringTagMap) {
      return false;
    }

    stringTagMap[stringTag] = inspector;
    return true;
  }
  var custom = chaiInspect;

  exports.custom = custom;
  exports.default = inspect;
  exports.inspect = inspect;
  exports.registerConstructor = registerConstructor;
  exports.registerStringTag = registerStringTag;

  Object.defineProperty(exports, '__esModule', { value: true });

})));


/***/ }),

/***/ "./node_modules/pathval/index.js":
/*!***************************************!*\
  !*** ./node_modules/pathval/index.js ***!
  \***************************************/
/***/ ((module) => {

"use strict";


/* !
 * Chai - pathval utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

/**
 * ### .hasProperty(object, name)
 *
 * This allows checking whether an object has own
 * or inherited from prototype chain named property.
 *
 * Basically does the same thing as the `in`
 * operator but works properly with null/undefined values
 * and other primitives.
 *
 *     var obj = {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *
 * The following would be the results.
 *
 *     hasProperty(obj, 'str');  // true
 *     hasProperty(obj, 'constructor');  // true
 *     hasProperty(obj, 'bar');  // false
 *
 *     hasProperty(obj.str, 'length'); // true
 *     hasProperty(obj.str, 1);  // true
 *     hasProperty(obj.str, 5);  // false
 *
 *     hasProperty(obj.arr, 'length');  // true
 *     hasProperty(obj.arr, 2);  // true
 *     hasProperty(obj.arr, 3);  // false
 *
 * @param {Object} object
 * @param {String|Symbol} name
 * @returns {Boolean} whether it exists
 * @namespace Utils
 * @name hasProperty
 * @api public
 */

function hasProperty(obj, name) {
  if (typeof obj === 'undefined' || obj === null) {
    return false;
  }

  // The `in` operator does not work with primitives.
  return name in Object(obj);
}

/* !
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `internalGetPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be infinitely deep and nested.
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 * * Literal dots and brackets (not delimiter) must be backslash-escaped.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath(path) {
  var str = path.replace(/([^\\])\[/g, '$1.[');
  var parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function mapMatches(value) {
    if (
      value === 'constructor' ||
      value === '__proto__' ||
      value === 'prototype'
    ) {
      return {};
    }
    var regexp = /^\[(\d+)\]$/;
    var mArr = regexp.exec(value);
    var parsed = null;
    if (mArr) {
      parsed = { i: parseFloat(mArr[1]) };
    } else {
      parsed = { p: value.replace(/\\([.[\]])/g, '$1') };
    }

    return parsed;
  });
}

/* !
 * ## internalGetPathValue(obj, parsed[, pathDepth])
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(obj, parsed);
 *
 * @param {Object} object to search against
 * @param {Object} parsed definition from `parsePath`.
 * @param {Number} depth (nesting level) of the property we want to retrieve
 * @returns {Object|Undefined} value
 * @api private
 */

function internalGetPathValue(obj, parsed, pathDepth) {
  var temporaryValue = obj;
  var res = null;
  pathDepth = typeof pathDepth === 'undefined' ? parsed.length : pathDepth;

  for (var i = 0; i < pathDepth; i++) {
    var part = parsed[i];
    if (temporaryValue) {
      if (typeof part.p === 'undefined') {
        temporaryValue = temporaryValue[part.i];
      } else {
        temporaryValue = temporaryValue[part.p];
      }

      if (i === pathDepth - 1) {
        res = temporaryValue;
      }
    }
  }

  return res;
}

/* !
 * ## internalSetPathValue(obj, value, parsed)
 *
 * Companion function for `parsePath` that sets
 * the value located at a parsed address.
 *
 *  internalSetPathValue(obj, 'value', parsed);
 *
 * @param {Object} object to search and define on
 * @param {*} value to use upon set
 * @param {Object} parsed definition from `parsePath`
 * @api private
 */

function internalSetPathValue(obj, val, parsed) {
  var tempObj = obj;
  var pathDepth = parsed.length;
  var part = null;
  // Here we iterate through every part of the path
  for (var i = 0; i < pathDepth; i++) {
    var propName = null;
    var propVal = null;
    part = parsed[i];

    // If it's the last part of the path, we set the 'propName' value with the property name
    if (i === pathDepth - 1) {
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Now we set the property with the name held by 'propName' on object with the desired val
      tempObj[propName] = val;
    } else if (typeof part.p !== 'undefined' && tempObj[part.p]) {
      tempObj = tempObj[part.p];
    } else if (typeof part.i !== 'undefined' && tempObj[part.i]) {
      tempObj = tempObj[part.i];
    } else {
      // If the obj doesn't have the property we create one with that name to define it
      var next = parsed[i + 1];
      // Here we set the name of the property which will be defined
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Here we decide if this property will be an array or a new object
      propVal = typeof next.p === 'undefined' ? [] : {};
      tempObj[propName] = propVal;
      tempObj = tempObj[propName];
    }
  }
}

/**
 * ### .getPathInfo(object, path)
 *
 * This allows the retrieval of property info in an
 * object given a string path.
 *
 * The path info consists of an object with the
 * following properties:
 *
 * * parent - The parent object of the property referenced by `path`
 * * name - The name of the final property, a number if it was an array indexer
 * * value - The value of the property, if it exists, otherwise `undefined`
 * * exists - Whether the property exists or not
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} info
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

function getPathInfo(obj, path) {
  var parsed = parsePath(path);
  var last = parsed[parsed.length - 1];
  var info = {
    parent:
      parsed.length > 1 ?
        internalGetPathValue(obj, parsed, parsed.length - 1) :
        obj,
    name: last.p || last.i,
    value: internalGetPathValue(obj, parsed),
  };
  info.exists = hasProperty(info.parent, info.name);

  return info;
}

/**
 * ### .getPathValue(object, path)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue(obj, 'prop1.str'); // Hello
 *     getPathValue(obj, 'prop1.att[2]'); // b
 *     getPathValue(obj, 'prop2.arr[0].nested'); // Universe
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} value or `undefined`
 * @namespace Utils
 * @name getPathValue
 * @api public
 */

function getPathValue(obj, path) {
  var info = getPathInfo(obj, path);
  return info.value;
}

/**
 * ### .setPathValue(object, path, value)
 *
 * Define the value in an object at a given string path.
 *
 * ```js
 * var obj = {
 *     prop1: {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *   , prop2: {
 *         arr: [ { nested: 'Universe' } ]
 *       , str: 'Hello again!'
 *     }
 * };
 * ```
 *
 * The following would be acceptable.
 *
 * ```js
 * var properties = require('tea-properties');
 * properties.set(obj, 'prop1.str', 'Hello Universe!');
 * properties.set(obj, 'prop1.arr[2]', 'B');
 * properties.set(obj, 'prop2.arr[0].nested.value', { hello: 'universe' });
 * ```
 *
 * @param {Object} object
 * @param {String} path
 * @param {Mixed} value
 * @api private
 */

function setPathValue(obj, path, val) {
  var parsed = parsePath(path);
  internalSetPathValue(obj, val, parsed);
  return obj;
}

module.exports = {
  hasProperty: hasProperty,
  getPathInfo: getPathInfo,
  getPathValue: getPathValue,
  setPathValue: setPathValue,
};


/***/ }),

/***/ "./src/__tests__/pointer.spec.ts":
/*!***************************************!*\
  !*** ./src/__tests__/pointer.spec.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var chai__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! chai */ "./node_modules/chai/index.mjs");
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! util */ "./node_modules/util/util.js");
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(util__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! .. */ "./src/index.ts");
/**
 * @hidden
 * @packageDocumentation
 */



var rand = function (min, max) {
    return Math.random() * (max - min) + min;
};
describe('JsonPointer', function () {
    var data0 = {
        has: 'data',
        arr: ['data', { nested: 'object with data' }, null],
        nested: { even: { further: 'hello' } },
    };
    // list paths in order so the .set method can work in reverse order
    var tests0 = [
        ['', data0],
        ['/has', data0.has],
        ['/arr', data0.arr],
        ['/arr/0', data0.arr[0]],
        ['/arr/1', data0.arr[1]],
        ['/arr/1/nested', data0.arr[1].nested],
        ['/arr/2', data0.arr[2]],
        ['/nested', data0.nested],
        ['/nested/even', data0.nested.even],
        ['/nested/even/further', data0.nested.even.further],
        ['/hasnot', undefined],
    ];
    var data1 = {
        foo: 'bar',
        baz: [
            'qux',
            'quux',
            {
                garply: { waldo: ['fred', 'plugh'] },
            },
        ],
    };
    var tests1 = [
        ['', data1],
        ['/foo', data1.foo],
        ['/baz', data1.baz],
        ['/baz/0', data1.baz[0]],
        ['/baz/1', data1.baz[1]],
        ['/baz/2', data1.baz[2]],
        ['/baz/2/garply', data1.baz[2].garply],
        [
            '/baz/2/garply/waldo',
            data1.baz[2].garply
                .waldo,
        ],
        [
            '/baz/2/garply/waldo/0',
            data1.baz[2].garply
                .waldo[0],
        ],
        [
            '/baz/2/garply/waldo/1',
            data1.baz[2].garply
                .waldo[1],
        ],
    ];
    var tests1f = [
        ['#', data1],
        ['#/foo', data1.foo],
        ['#/baz', data1.baz],
        ['#/baz/0', data1.baz[0]],
        ['#/baz/1', data1.baz[1]],
        ['#/baz/2', data1.baz[2]],
        ['#/baz/2/garply', data1.baz[2].garply],
        [
            '#/baz/2/garply/waldo',
            data1.baz[2].garply
                .waldo,
        ],
        [
            '#/baz/2/garply/waldo/0',
            data1.baz[2].garply
                .waldo[0],
        ],
        [
            '#/baz/2/garply/waldo/1',
            data1.baz[2].garply
                .waldo[1],
        ],
    ];
    describe('static .create()', function () {
        it('throws on undefined', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.create(undefined); }).to.throw('Invalid type: JSON Pointers are represented as strings.');
        });
        it('succeeds when pointer is string', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.create('')).to.be.a('object');
        });
        it('succeeds when pointer is PathSegment', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.create([])).to.be.a('object');
        });
    });
    describe('.ctor()', function () {
        it('throws on undefined', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(undefined); }).to.throw('Invalid type: JSON Pointers are represented as strings.');
        });
        it('succeeds when pointer is string', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('')).to.be.a('object');
        });
        it('succeeds when pointer is PathSegment', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer([])).to.be.a('object');
        });
    });
    describe('static .has()', function () {
        var _loop_1 = function (p, expected) {
            it("static .has(data, '".concat(p, "') = ").concat(expected !== undefined), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.has(data0, p)).to.be.eql(expected !== undefined);
            });
            it("static .has(data, '".concat(JSON.stringify(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p)), "') = ").concat(expected !== undefined), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.has(data0, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p))).to.be.eql(expected !== undefined);
            });
            it("static .has(data, p'".concat(p, "') = ").concat(expected !== undefined), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.has(data0, new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(p))).to.be.eql(expected !== undefined);
            });
        };
        for (var _i = 0, tests0_1 = tests0; _i < tests0_1.length; _i++) {
            var _a = tests0_1[_i], p = _a[0], expected = _a[1];
            _loop_1(p, expected);
        }
    });
    describe('.has()', function () {
        var _loop_2 = function (p, expected) {
            it(".has('".concat(p, "') = ").concat(expected !== undefined), function () {
                var ptr = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(p);
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(ptr.has(data0)).to.be.eql(expected !== undefined);
            });
        };
        for (var _i = 0, tests0_2 = tests0; _i < tests0_2.length; _i++) {
            var _a = tests0_2[_i], p = _a[0], expected = _a[1];
            _loop_2(p, expected);
        }
    });
    describe('static .get()', function () {
        var _loop_3 = function (p, expected) {
            it("static .get(data, '".concat(p, "') = ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(data0, p)).to.be.eql(expected);
            });
            it("static .get(data, '".concat(JSON.stringify(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p)), "') = ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(data0, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p))).to.be.eql(expected);
            });
            it("static .get(data, p'".concat(p, "') = ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(data0, new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(p))).to.be.eql(expected);
            });
        };
        for (var _i = 0, tests0_3 = tests0; _i < tests0_3.length; _i++) {
            var _a = tests0_3[_i], p = _a[0], expected = _a[1];
            _loop_3(p, expected);
        }
    });
    describe('static .set() unforced', function () {
        var dataCopy0 = JSON.parse(JSON.stringify(data0));
        var dataCopy1 = JSON.parse(JSON.stringify(data0));
        var dataCopy2 = JSON.parse(JSON.stringify(data0));
        var _loop_4 = function (p, expected) {
            var r = rand(1, 99999);
            it("static .set(data, '".concat(p, "', ").concat(r, ")"), function () {
                if (p === '') {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.set(dataCopy0, p, r); }).to.throw('Cannot set the root object; assign it directly.');
                    return;
                }
                ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.set(dataCopy0, p, r);
                if (expected === undefined) {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy0, p)).to.be.eql(expected);
                }
                else {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy0, p)).to.be.eql(r);
                }
            });
            it("static .set(data, ".concat(JSON.stringify(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p)), ", ").concat(r, ")"), function () {
                if (p.length === 0) {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                        return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.set(dataCopy1, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p), r);
                    }).to.throw('Cannot set the root object; assign it directly.');
                    return;
                }
                ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.set(dataCopy1, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p), r);
                if (expected === undefined) {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy1, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p))).to.be.eql(expected);
                }
                else {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy1, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p))).to.be.eql(r);
                }
            });
            it("static .set(data, p'".concat(p, "', ").concat(r, ")"), function () {
                if (p === '') {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                        return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.set(dataCopy2, new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(p), r);
                    }).to.throw('Cannot set the root object; assign it directly.');
                    return;
                }
                ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.set(dataCopy2, new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(p), r);
                if (expected === undefined) {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy2, p)).to.be.eql(expected);
                }
                else {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy2, p)).to.be.eql(r);
                }
            });
        };
        for (var _i = 0, _a = tests0.reverse(); _i < _a.length; _i++) {
            var _b = _a[_i], p = _b[0], expected = _b[1];
            _loop_4(p, expected);
        }
        it('throws on attempted prototype pollution', function () {
            var subject = { my: 'subject' };
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.set(subject, new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/__proto__/polluted'), "Yes! It's polluted");
            }).to.throw('Attempted prototype pollution disallowed.');
        });
    });
    describe('static .unset()', function () {
        var dataCopy0 = JSON.parse(JSON.stringify(data0));
        var dataCopy1 = JSON.parse(JSON.stringify(data0));
        var dataCopy2 = JSON.parse(JSON.stringify(data0));
        var _loop_5 = function (p) {
            it("static .unset(data, '".concat(p, "')"), function () {
                if (p === '') {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.unset(dataCopy0, p); }).to.throw('Cannot unset the root object; assign it directly.');
                    return;
                }
                // values are changing! get it so we know what to expect
                var updatedExpected = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy0, p);
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.unset(dataCopy0, p)).to.be.eql(updatedExpected);
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy0, p)).to.be.undefined;
            });
            it("static .unset(data, ".concat(JSON.stringify(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p)), ")"), function () {
                if (p.length === 0) {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                        return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.unset(dataCopy1, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p));
                    }).to.throw('Cannot unset the root object; assign it directly.');
                    return;
                }
                // values are changing! get it so we know what to expect
                var updatedExpected = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy1, p);
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.unset(dataCopy1, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p))).to.be.eql(updatedExpected);
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy1, ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p))).to.be
                    .undefined;
            });
            it("static .unset(data, p'".concat(p, "')"), function () {
                if (p === '') {
                    (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                        return ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.unset(dataCopy2, new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(p));
                    }).to.throw('Cannot unset the root object; assign it directly.');
                    return;
                }
                // values are changing! get it so we know what to expect
                var updatedExpected = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy2, p);
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.unset(dataCopy2, new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer(p))).to.be.eql(updatedExpected);
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.get(dataCopy2, p)).to.be.undefined;
            });
        };
        for (var _i = 0, _a = tests0.reverse(); _i < _a.length; _i++) {
            var p = _a[_i][0];
            _loop_5(p);
        }
    });
    describe('static .visit()', function () {
        it("static .visit(data)", function () {
            var sequence = [];
            ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.visit(data1, function (p, v) {
                var path = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p);
                if (path.length) {
                    sequence.push(path[path.length - 1]);
                    if (typeof v === 'string') {
                        sequence.push(v);
                    }
                }
            });
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(sequence).to.eql([
                'foo',
                'bar',
                'baz',
                '0',
                'qux',
                '1',
                'quux',
                '2',
                'garply',
                'waldo',
                '0',
                'fred',
                '1',
                'plugh',
            ]);
        });
        it("static .visit(data) fragments", function () {
            var sequence = [];
            ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.visit(data1, function (p, v) {
                var path = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p);
                if (path.length) {
                    sequence.push(path[path.length - 1]);
                    if (typeof v === 'string') {
                        sequence.push(v);
                    }
                }
            }, true);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(sequence).to.eql([
                'foo',
                'bar',
                'baz',
                '0',
                'qux',
                '1',
                'quux',
                '2',
                'garply',
                'waldo',
                '0',
                'fred',
                '1',
                'plugh',
            ]);
        });
        var obj = { my: { obj: 'with nested data' } };
        var objWithReferences = {
            your: { obj: { refers_to: obj } },
            my: obj,
        };
        objWithReferences.self = {
            nested: [objWithReferences, obj],
        };
        it('handles references', function () {
            var pointers = {};
            ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.visit(objWithReferences, function (p, v) {
                pointers[p] = v;
            });
            console.log((0,util__WEBPACK_IMPORTED_MODULE_1__.inspect)(pointers, false, 9));
        });
    });
    describe('static .flatten()', function () {
        var data = {
            foo: 'bar',
            baz: [
                'qux',
                'quux',
                {
                    garply: { waldo: ['fred', 'plugh'] },
                },
            ],
        };
        var obj = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.flatten(data);
        var objf = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.flatten(data, true);
        it('obj to # of items', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(Object.keys(obj).length).to.eql(tests1.length);
        });
        var _loop_6 = function (p, expected) {
            it("obj['".concat(p, "'] === ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(obj[p]).to.eql(expected);
            });
        };
        for (var _i = 0, tests1_1 = tests1; _i < tests1_1.length; _i++) {
            var _a = tests1_1[_i], p = _a[0], expected = _a[1];
            _loop_6(p, expected);
        }
        var _loop_7 = function (p, expected) {
            it("obj['".concat(p, "'] === ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(objf[p]).to.eql(expected);
            });
        };
        for (var _b = 0, tests1f_1 = tests1f; _b < tests1f_1.length; _b++) {
            var _c = tests1f_1[_b], p = _c[0], expected = _c[1];
            _loop_7(p, expected);
        }
    });
    describe('static .map()', function () {
        var data = {
            foo: 'bar',
            baz: [
                'qux',
                'quux',
                {
                    garply: { waldo: ['fred', 'plugh'] },
                },
            ],
        };
        var map = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.map(data);
        var mapf = ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.map(data, true);
        it('map to # of items', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(Array.from(map.keys()).length).to.eql(tests1.length);
        });
        var _loop_8 = function (p, expected) {
            it("map.get('".concat(p, "') === ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(map.get(p)).to.eql(expected);
            });
        };
        for (var _i = 0, tests1_2 = tests1; _i < tests1_2.length; _i++) {
            var _a = tests1_2[_i], p = _a[0], expected = _a[1];
            _loop_8(p, expected);
        }
        var _loop_9 = function (p, expected) {
            it("map.get('".concat(p, "') === ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(mapf.get(p)).to.eql(expected);
            });
        };
        for (var _b = 0, tests1f_2 = tests1f; _b < tests1f_2.length; _b++) {
            var _c = tests1f_2[_b], p = _c[0], expected = _c[1];
            _loop_9(p, expected);
        }
    });
    describe('static .decode()', function () {
        var tests = [
            ['', []],
            ['/foo', ['foo']],
            ['/foo/0', ['foo', '0']],
            ['/', ['']],
            ['/a~1b', ['a/b']],
            ['/c%d', ['c%d']],
            ['/e^f', ['e^f']],
            ['/g|h', ['g|h']],
            ['/i\\j', ['i\\j']],
            ['/k"l', ['k"l']],
            ['/ ', [' ']],
            ['/m~0n', ['m~n']],
            ['/foo/bar/baz', ['foo', 'bar', 'baz']],
            ['#/foo/bar/baz', ['foo', 'bar', 'baz']],
        ];
        var _loop_10 = function (p, expected) {
            it(".decode('".concat(p, "') = ").concat(JSON.stringify(expected)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_2__.JsonPointer.decode(p)).to.be.eql(expected);
            });
        };
        for (var _i = 0, tests_1 = tests; _i < tests_1.length; _i++) {
            var _a = tests_1[_i], p = _a[0], expected = _a[1];
            _loop_10(p, expected);
        }
    });
    describe('.pointer property', function () {
        it('encodes pointer', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/foo');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.pointer).to.eql('/foo');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.pointer).to.eql(p.pointer);
        });
        it('encodes fragment', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('#/foo');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.pointer).to.eql('/foo');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.pointer).to.eql(p.pointer);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.uriFragmentIdentifier).to.eql('#/foo');
        });
    });
    describe('.relative method', function () {
        var doc = {
            foo: ['bar', 'baz'],
            highly: {
                nested: {
                    objects: true,
                },
            },
        };
        it('throws when relative pointer unspecified', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.rel(doc, undefined); }).to.throw('Invalid type: Relative JSON Pointers are represented as strings.');
        });
        it('throws when relative pointer empty', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.rel(doc, ''); }).to.throw('Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.');
        });
        it('throws when relative pointer invalid [0](NaN)', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.rel(doc, 'b/z'); }).to.throw('Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.');
        });
        it('throws when relative pointer invalid 1#/z', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.rel(doc, '1#/z'); }).to.throw('Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.');
        });
        it('Spec examples 1', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/foo/1');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '0')).to.eql('baz');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '1/0')).to.eql('bar');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '2/highly/nested/objects')).to.eql(true);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '0#')).to.eql(1);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '1#')).to.eql('foo');
        });
        it('Spec examples 2', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '0/objects')).to.eql(true);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '1/nested/objects')).to.eql(true);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '2/foo/0')).to.eql('bar');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '0#')).to.eql('nested');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '1#')).to.eql('highly');
        });
        it('returns undefined when relative location cannot exist', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(p.rel(doc, '5/not-here')).to.be.undefined;
        });
    });
    describe('.rel method', function () {
        var doc = {
            foo: ['bar', 'baz'],
            highly: {
                nested: {
                    objects: true,
                },
            },
        };
        it('throws when relative pointer unspecified', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.relative(undefined); }).to.throw('Invalid type: Relative JSON Pointers are represented as strings.');
        });
        it('throws when relative pointer empty', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.relative(''); }).to.throw('Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.');
        });
        it('throws when relative pointer invalid [0](NaN)', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.relative('b/z'); }).to.throw('Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.');
        });
        it('throws when relative pointer invalid 1#/z', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.relative('1#/z'); }).to.throw('Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.');
        });
        it('throws when relative pointer to name (#)', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.relative('1#'); }).to.throw("We won't compile a pointer that will always return 'nested'. Use JsonPointer.rel(target, ptr) instead.");
        });
        it('throws when relative location cannot exist', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return p.relative('5/not-here'); }).to.throw('Relative location does not exist.');
        });
        it('Spec example from 1', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/foo/1');
            var q = p.relative('2/highly/nested/objects');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(q.get(doc)).to.eql(true);
        });
        it('Spec example from 2', function () {
            var p = new ___WEBPACK_IMPORTED_MODULE_2__.JsonPointer('/highly/nested');
            var q = p.relative('2/foo/0');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(q.get(doc)).to.eql('bar');
        });
    });
});


/***/ }),

/***/ "./src/__tests__/ptr.spec.ts":
/*!***********************************!*\
  !*** ./src/__tests__/ptr.spec.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! .. */ "./src/index.ts");
/* harmony import */ var chai__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! chai */ "./node_modules/chai/index.mjs");
/**
 * @hidden
 * @packageDocumentation
 */


var create = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.create;
describe('JsonPointer', function () {
    describe('when working with the example data from the rfc', function () {
        var data = {
            foo: ['bar', 'baz'],
            '': 0,
            'a/b': 1,
            'c%d': 2,
            'e^f': 3,
            'g|h': 4,
            'i\\j': 5,
            'k"l': 6,
            ' ': 7,
            'm~n': 8,
        };
        describe('with a JSON pointer to the root ``', function () {
            var p = create('');
            it('#get should resolve to the object itself', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data);
            });
            it('#set should throw', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(function () {
                    p.set(data, {
                        this: 'should cause an exception',
                    });
                }).to.throw();
            });
            it('#unset should throw', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(function () {
                    p.unset(data);
                }).to.throw('Cannot unset the root object; assign it directly.');
            });
            it('should have an empty path', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.have.length(0);
            });
            it('should have a pointer that is empty', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('');
            });
            it('should have a URI fragment identifier that is empty', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#');
            });
        });
        describe('a URI fragment identifier to the root #', function () {
            var p = create('#');
            it('#get should resolve to the object itself', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data);
            });
            it('#set should throw', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(function () {
                    p.set(data, {
                        this: 'should cause an exception',
                    });
                }).to.throw();
            });
            it('should have an empty path', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.have.length(0);
            });
            it('should have a pointer that is empty', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('');
            });
            it('should have a URI fragment identifier that is empty', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#');
            });
        });
        describe('with a JSON pointer of `/foo`', function () {
            var p = create('/foo');
            it('#get should resolve to data["foo"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data.foo);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "foo" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['foo']);
            });
            it('should have the pointer `/foo`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/foo');
            });
            it('should have the URI fragment identifier `#/foo`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/foo');
            });
        });
        describe('a URI fragment identifier of `#/foo`', function () {
            var p = create('#/foo');
            it('#get should resolve to data["foo"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data.foo);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "foo" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['foo']);
            });
            it('should have the pointer `/foo`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/foo');
            });
            it('should have the URI fragment identifier `#/foo`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/foo');
            });
        });
        describe('with a JSON pointer of `/foo/0`', function () {
            var p = create('/foo/0');
            it('#get should resolve to data.foo[0]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data.foo[0]);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "foo", "0" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['foo', '0']);
            });
            it('should have the pointer `/foo/0`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/foo/0');
            });
            it('should have the URI fragment identifier `#/foo/0`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/foo/0');
            });
        });
        describe('a URI fragment identifier of `#/foo/0`', function () {
            var p = create('#/foo/0');
            it('#get should resolve to data.foo[0]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data.foo[0]);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "foo", "0" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['foo', '0']);
            });
            it('should have the pointer `/foo/0`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/foo/0');
            });
            it('should have the URI fragment identifier `#/foo/0`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/foo/0');
            });
        });
        describe('a URI fragment identifier of `#/newArray/0`', function () {
            var p = create('#/newArray/0');
            it('#get should resolve to undefined', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(undefined);
            });
            it('#set with force should succeed creating an array and setting the referenced value', function () {
                var blank = {};
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(blank, updated, true);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(Array.isArray(blank.newArray)).to.eql(true);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(blank)).to.eql(updated);
                p.set(blank, capture);
            });
            it('should have a path of [ "newArray", "0" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['newArray', '0']);
            });
            it('should have the pointer `/newArray/0`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/newArray/0');
            });
            it('should have the URI fragment identifier `#/newArray/0`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/newArray/0');
            });
        });
        describe('with a JSON pointer of `/`', function () {
            var p = create('/');
            it('#get should resolve to data[""]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['']);
            });
            it('should have the pointer `/`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/');
            });
            it('should have the URI fragment identifier `#/`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/');
            });
        });
        describe('a URI fragment identifier of `#/`', function () {
            var p = create('#/');
            it('#get should resolve to data[""]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['']);
            });
            it('should have the pointer `/`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/');
            });
            it('should have the URI fragment identifier `#/`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/');
            });
        });
        describe('with a JSON pointer of `/a~1b`', function () {
            var p = create('/a~1b');
            it('#get should resolve to data["a/b"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['a/b']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "a/b" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['a/b']);
            });
            it('should have the pointer `/a~1b`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/a~1b');
            });
            it('should have the URI fragment identifier `#/a~1b`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/a~1b');
            });
        });
        describe('a URI fragment identifier of `#/a~1b`', function () {
            var p = create('#/a~1b');
            it('#get should resolve to data["a/b"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['a/b']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "a/b" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['a/b']);
            });
            it('should have the pointer `/a~1b`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/a~1b');
            });
            it('should have the URI fragment identifier `#/a~1b`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/a~1b');
            });
        });
        describe('with a JSON pointer of `/c%d`', function () {
            var p = create('/c%d');
            it('#get should resolve to data["c%d"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['c%d']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "c%d" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['c%d']);
            });
            it('should have the pointer `/c%d`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/c%d');
            });
            it('should have the URI fragment identifier `#/c%25d`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/c%25d');
            });
        });
        describe('a URI fragment identifier of `#/c%25d`', function () {
            var p = create('#/c%25d');
            it('#get should resolve to data["c%d"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['c%d']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "c%d" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['c%d']);
            });
            it('should have the pointer `/c%d`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/c%d');
            });
            it('should have the URI fragment identifier `#/c%25d`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/c%25d');
            });
        });
        describe('with a JSON pointer of `/e^f`', function () {
            var p = create('/e^f');
            it('#get should resolve to data["e^f"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['e^f']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "e^f" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['e^f']);
            });
            it('should have the pointer `/e^f`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/e^f');
            });
            it('should have the URI fragment identifier `#/e%5Ef`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/e%5Ef');
            });
        });
        describe('a URI fragment identifier of `#/e%5Ef`', function () {
            var p = create('#/e%5Ef');
            it('#get should resolve to data["e^f"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['e^f']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "e^f" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['e^f']);
            });
            it('should have the pointer `/e^f`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/e^f');
            });
            it('should have the URI fragment identifier `#/e%5Ef`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/e%5Ef');
            });
        });
        describe('with a JSON pointer of `/g|h`', function () {
            var p = create('/g|h');
            it('#get should resolve to data["g|h"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['g|h']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "g|h" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['g|h']);
            });
            it('should have the pointer `/g|h`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/g|h');
            });
            it('should have the URI fragment identifier `#/g%7Ch`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/g%7Ch');
            });
        });
        describe('a URI fragment identifier of `#/g%7Ch`', function () {
            var p = create('#/g%7Ch');
            it('#get should resolve to data["g|h"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['g|h']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "g|h" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['g|h']);
            });
            it('should have the pointer `/g|h`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/g|h');
            });
            it('should have the URI fragment identifier `#/g%7Ch`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/g%7Ch');
            });
        });
        describe('with a JSON pointer of "/i\\j"', function () {
            var p = create('/i\\j');
            it('#get should resolve to data["i\\j"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['i\\j']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "i\\j" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['i\\j']);
            });
            it('should have the pointer `/i\\j`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/i\\j');
            });
            it('should have the URI fragment identifier `#/i%5Cj`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/i%5Cj');
            });
        });
        describe('a URI fragment identifier of `#/i%5Cj`', function () {
            var p = create('#/i%5Cj');
            it('#get should resolve to data["i\\j"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['i\\j']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "i\\j" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['i\\j']);
            });
            it('should have the pointer `/i\\j`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/i\\j');
            });
            it('should have the URI fragment identifier `#/i%5Cj`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/i%5Cj');
            });
        });
        describe("with a JSON pointer of '/k\\\"l'", function () {
            // eslint-disable-next-line no-useless-escape
            var p = create('/k"l');
            // eslint-disable-next-line no-useless-escape
            it('#get should resolve to data["k"l"]', function () {
                // eslint-disable-next-line no-useless-escape
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['k"l']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            // eslint-disable-next-line no-useless-escape
            it('should have a path of [ "k"l" ]', function () {
                // eslint-disable-next-line no-useless-escape
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['k"l']);
            });
            // eslint-disable-next-line no-useless-escape
            it('should have the pointer `/k"l`', function () {
                // eslint-disable-next-line no-useless-escape
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/k"l');
            });
            it('should have the URI fragment identifier `#/k%22l`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/k%22l');
            });
        });
        describe('a URI fragment identifier of `#/k%22l`', function () {
            var p = create('#/k%22l');
            // eslint-disable-next-line no-useless-escape
            it('#get should resolve to data["k"l"]', function () {
                // eslint-disable-next-line no-useless-escape
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['k"l']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            // eslint-disable-next-line no-useless-escape
            it('should have a path of [ "k"l" ]', function () {
                // eslint-disable-next-line no-useless-escape
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['k"l']);
            });
            // eslint-disable-next-line no-useless-escape
            it('should have the pointer `/k"l`', function () {
                // eslint-disable-next-line no-useless-escape
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/k"l');
            });
            it('should have the URI fragment identifier `#/k%22l`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/k%22l');
            });
        });
        describe('with a JSON pointer of `/ `', function () {
            var p = create('/ ');
            it('#get should resolve to data[" "]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data[' ']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ " " ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql([' ']);
            });
            it('should have the pointer `/ `', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/ ');
            });
            it('should have the URI fragment identifier `#/%20`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/%20');
            });
        });
        describe('a URI fragment identifier of `#/%20`', function () {
            var p = create('#/%20');
            it('#get should resolve to data[" "]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data[' ']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ " " ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql([' ']);
            });
            it('should have the pointer `/ `', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/ ');
            });
            it('should have the URI fragment identifier `#/%20`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/%20');
            });
        });
        describe('with a JSON pointer of `/m~0n`', function () {
            var p = create('/m~0n');
            it('#get should resolve to data["m~n"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['m~n']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "m~n" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['m~n']);
            });
            it('should have the pointer `/m~0n`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/m~0n');
            });
            it('should have the URI fragment identifier `#/m~0n`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/m~0n');
            });
        });
        describe('a URI fragment identifier of `#/m~0n`', function () {
            var p = create('#/m~0n');
            it('#get should resolve to data["m~n"]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(data['m~n']);
            });
            it('#set should succeed changing the referenced value', function () {
                var capture = p.get(data);
                var updated = {
                    this: 'should succeed',
                };
                p.set(data, updated);
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(updated);
                p.set(data, capture);
            });
            it('should have a path of [ "m~n" ]', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.path).to.eql(['m~n']);
            });
            it('should have the pointer `/m~0n`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.pointer).to.eql('/m~0n');
            });
            it('should have the URI fragment identifier `#/m~0n`', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.uriFragmentIdentifier).to.eql('#/m~0n');
            });
        });
        describe('a special array pointer from draft-ietf-appsawg-json-pointer-08 `/foo/-`', function () {
            var p = create('/foo/-');
            it('should not resolve via #get', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.be.undefined;
            });
            it('should set the next element of the array, repeatedly...', function () {
                p.set(data, 'qux');
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(data.foo[2]).to.eql('qux');
            });
            it('...3', function () {
                p.set(data, 'quux');
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(data.foo[3]).to.eql('quux');
            });
            it('...4', function () {
                p.set(data, 'corge');
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(data.foo[4]).to.eql('corge');
            });
            it('...5', function () {
                p.set(data, 'grault');
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(data.foo[5]).to.eql('grault');
            });
        });
        describe('an invalid pointer', function () {
            it('should fail to parse', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(function () {
                    create('a/');
                }).to.throw();
            });
        });
        describe('an invalid URI fragment identifier', function () {
            it('should fail to parse', function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(function () {
                    create('#a');
                }).to.throw();
            });
        });
    });
    describe('when working with complex data', function () {
        var data = {
            a: 1,
            b: {
                c: 2,
            },
            d: {
                e: [
                    {
                        a: 3,
                    },
                    {
                        b: 4,
                    },
                    {
                        c: 5,
                    },
                ],
            },
            f: null,
            'http://schema.org/name': 'Phillip',
        };
        it('#get should return `undefined` when the requested element is undefined (#/g/h)', function () {
            var unk = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get(data, '#/g/h');
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(unk).to.be.undefined;
        });
        it('#get should return null when the requested element has a null value (#/f)', function () {
            var unk = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get(data, '#/f');
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(unk).to.be.null;
        });
        it('#get should return the value of a prop named with multiple slahes (#/http:~1~1schema.org~1name)', function () {
            var unk = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get(data, '#/http:~1~1schema.org~1name');
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(unk).to.eql('Phillip');
        });
        it('#get should return the value of a prop named with multiple slahes (/http:~1~1schema.org~1name)', function () {
            var unk = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get(data, '/http:~1~1schema.org~1name');
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(unk).to.eql('Phillip');
        });
        it('#set should set the value of a prop named with multiple slahes (#/http:~1~1schema.org~1name)', function () {
            ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.set(data, '#/http:~1~1schema.org~1name', 'Phil');
            var unk = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get(data, '/http:~1~1schema.org~1name');
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(unk).to.eql('Phil');
        });
        it('#set should set the value of a prop named with multiple slahes (/http:~1~1schema.org~1name)', function () {
            ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.set(data, '/http:~1~1schema.org~1name', 'Phil');
            var unk = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get(data, '/http:~1~1schema.org~1name');
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(unk).to.eql('Phil');
        });
    });
    describe('given an sequence of property names ["d", "e~f", "2"]', function () {
        var path = ['d', 'e~f', '2'];
        it('#encodePointer should produce a pointer (/d/e~0f/2)', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)((0,___WEBPACK_IMPORTED_MODULE_0__.encodePointer)(path)).to.eql('/d/e~0f/2');
        });
        it('#encodeUriFragmentIdentifier should produce a pointer (#/d/e~0f/2)', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)((0,___WEBPACK_IMPORTED_MODULE_0__.encodeUriFragmentIdentifier)(path)).to.eql('#/d/e~0f/2');
        });
    });
    describe('#list...', function () {
        var data = {
            a: 1,
            b: { c: 2 },
            d: { e: [{ a: 3 }, { b: 4 }, { c: 5 }] },
            f: null,
        };
        var pointerList = [
            ['', data],
            ['/a', data.a],
            ['/b', data.b],
            ['/d', data.d],
            ['/f', data.f],
            ['/b/c', data.b.c],
            ['/d/e', data.d.e],
            ['/d/e/0', data.d.e[0]],
            ['/d/e/1', data.d.e[1]],
            ['/d/e/2', data.d.e[2]],
            ['/d/e/0/a', data.d.e[0].a],
            ['/d/e/1/b', data.d.e[1].b],
            ['/d/e/2/c', data.d.e[2].c],
        ];
        var fragmentList = [
            ['#', data],
            ['#/a', data.a],
            ['#/b', data.b],
            ['#/d', data.d],
            ['#/f', data.f],
            ['#/b/c', data.b.c],
            ['#/d/e', data.d.e],
            ['#/d/e/0', data.d.e[0]],
            ['#/d/e/1', data.d.e[1]],
            ['#/d/e/2', data.d.e[2]],
            ['#/d/e/0/a', data.d.e[0].a],
            ['#/d/e/1/b', data.d.e[1].b],
            ['#/d/e/2/c', data.d.e[2].c],
        ];
        describe('listPointers(target)', function () {
            var items = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.listPointers(data);
            pointerList.forEach(function (tt, n) {
                it("item ".concat(n, " has pointer ").concat(tt[0]), function () {
                    (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(items[n].pointer).to.eql(tt[0]);
                });
                it("item ".concat(n, " has value ").concat(tt[1]), function () {
                    (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(items[n].value).to.eql(tt[1]);
                });
            });
        });
        describe('listFragmentIds(target)', function () {
            var items = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.listFragmentIds(data);
            fragmentList.forEach(function (tt, n) {
                it("item ".concat(n, " has fragmentId ").concat(tt[0]), function () {
                    (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(items[n].fragmentId).to.eql(tt[0]);
                });
                it("item ".concat(n, " has value ").concat(tt[1]), function () {
                    (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(items[n].value).to.eql(tt[1]);
                });
            });
        });
    });
});
describe('when data contains an array early in the path', function () {
    var data = {
        foo: [],
    };
    it('#set(o, val, true) should create the path through the array #/foo/0/wilbur/idiocies', function () {
        var p = create('#/foo/0/wilbur/idiocies');
        p.set(data, 5, true);
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(p.get(data)).to.eql(5);
    });
});
describe('concat pointers', function () {
    var ptr1 = create('/a/b');
    var ptr2 = create('/c/d');
    var result = '/a/b/c/d';
    it('#concat JsonPointer("/a/b") with array ["a", "b"] should produce ' +
        result, function () {
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(ptr1.concat(Array.from(ptr2.path)).pointer).to.eql(result);
    });
    it('#concat JsonPointer("/a/b") with JsonPointer("/b/c") should produce ' +
        result, function () {
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(ptr1.concat(ptr2).pointer).to.eql(result);
    });
    it('#concat JsonPointer("/a/b") with string "/b/c" should produce ' + result, function () {
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(ptr1.concat(ptr2.pointer).pointer).to.eql(result);
    });
    it('#concat JsonPointer("/a/b") with string "#/b/c" should produce ' + result, function () {
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(ptr1.concat(ptr2.uriFragmentIdentifier).toString()).to.eql(result);
    });
});
describe('path segments containing single quote', function () {
    it('issue 28 proof of fix', function () {
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get({}, "/it's bad")).to.eql(undefined);
    });
    it('issue 30 proof of fix', function () {
        ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get({}, "/aaa'])) !== 'undefined') {return it;}; Number.hacked = true; if(((['a");
        var result = Number;
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(result.hacked).to.eql(undefined);
    });
});
describe('unreachable path across a null object in the graph', function () {
    it('issue 36 proof of fix', function () {
        var o = {
            id: 1234,
            employee: null,
            created_on: '2021-05-11',
        };
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.get(o, '/employee/st_price')).to.eql(undefined);
    });
});
describe('.set() ops, single char segment interpreted as number', function () {
    it('issue 48 proof of fix', function () {
        var _a;
        var obj = {};
        var ptr = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.create('/hi/e');
        ptr.set(obj, 'hello', true);
        (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)((_a = obj.hi) === null || _a === void 0 ? void 0 : _a.e).to.eql('hello');
    });
    it('issue 48 does not apply when path is an integer', function () {
        var obj = {};
        var ptr = ___WEBPACK_IMPORTED_MODULE_0__.JsonPointer.create('/arr/0');
        ptr.set(obj, 'hello', true);
        if (obj.arr) {
            (0,chai__WEBPACK_IMPORTED_MODULE_1__.expect)(obj.arr[0]).to.eql('hello');
        }
        else {
            chai__WEBPACK_IMPORTED_MODULE_1__.expect.fail('well hell, the array should have been created.');
        }
    });
});


/***/ }),

/***/ "./src/__tests__/reference.spec.ts":
/*!*****************************************!*\
  !*** ./src/__tests__/reference.spec.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var chai__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! chai */ "./node_modules/chai/index.mjs");
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! .. */ "./src/index.ts");
/**
 * @hidden
 * @packageDocumentation
 */


describe('JsonReference', function () {
    describe('.ctor()', function () {
        it('throws when pointer unspecified', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference(undefined); }).to.throw('Invalid type: JSON Pointers are represented as strings.');
        });
        it('succeeds when pointer specified as string', function () {
            var ref = new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference('');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(ref.pointer().path).to.eql([]);
        });
        it('succeeds when pointer specified as PathSegments', function () {
            var ref = new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference([]);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(ref.pointer().path).to.eql([]);
        });
        it('succeeds when pointer specified as JsonPointer', function () {
            var ref = new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference(new ___WEBPACK_IMPORTED_MODULE_1__.JsonPointer('/foo'));
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(ref.pointer().path).to.eql(['foo']);
        });
    });
    describe('static .isReference()', function () {
        it('returns false when reference unspecified', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_1__.JsonReference.isReference(undefined)).to.be.false;
        });
        it('returns false when reference specified as null', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_1__.JsonReference.isReference(null)).to.be.false;
        });
        it('returns false when reference specified is not a reference', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_1__.JsonReference.isReference(new Date())).to.be.false;
        });
        it('returns true when reference specified', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(___WEBPACK_IMPORTED_MODULE_1__.JsonReference.isReference(new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference(''))).to.be.true;
        });
    });
    describe('.resolve()', function () {
        var data = { foo: { bar: 'baz' } };
        it('resolves to referenced property', function () {
            var ref = new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference('/foo/bar');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(ref.resolve(data)).to.eql(data.foo.bar);
        });
        it('resolves to undefined when no such property', function () {
            var ref = new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference('/foo/baz');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(ref.resolve(data)).to.be.undefined;
        });
    });
    describe('.toString()', function () {
        it('is interpolated', function () {
            var ref = new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference('/foo/bar');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)("".concat(ref)).to.eql('#/foo/bar');
        });
        it('is coerced', function () {
            var ref = new ___WEBPACK_IMPORTED_MODULE_1__.JsonReference('/foo/bar');
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)('' + ref).to.eql('#/foo/bar');
        });
    });
});


/***/ }),

/***/ "./src/__tests__/utils.spec.ts":
/*!*************************************!*\
  !*** ./src/__tests__/utils.spec.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var chai__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! chai */ "./node_modules/chai/index.mjs");
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! .. */ "./src/index.ts");
/**
 * @hidden
 * @packageDocumentation
 */


describe('Utils', function () {
    var fragments = [
        [[], [], '#'],
        [[''], [''], '#/'],
        [['foo bar'], ['foo%20bar'], '#/foo%20bar'],
        [['foo bar', 0], ['foo%20bar', 0], '#/foo%20bar/0'],
    ];
    var pointers = [
        [[], [], ''],
        [[''], [''], '/'],
        [['foo bar'], ['foo bar'], '/foo bar'],
        [['foo bar', 0], ['foo bar', 0], '/foo bar/0'],
    ];
    describe('encodeFragmentSegments()', function () {
        var _loop_1 = function (decoded, encoded) {
            it("".concat(JSON.stringify(decoded), " encodes to ").concat(JSON.stringify(encoded)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.encodeFragmentSegments)(decoded)).to.eql(encoded);
            });
        };
        for (var _i = 0, fragments_1 = fragments; _i < fragments_1.length; _i++) {
            var _a = fragments_1[_i], decoded = _a[0], encoded = _a[1];
            _loop_1(decoded, encoded);
        }
    });
    describe('decodeFragmentSegments()', function () {
        var _loop_2 = function (decoded, encoded) {
            it("".concat(JSON.stringify(encoded), " encodes to ").concat(JSON.stringify(decoded)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.decodeFragmentSegments)(encoded)).to.eql(decoded);
            });
        };
        for (var _i = 0, fragments_2 = fragments; _i < fragments_2.length; _i++) {
            var _a = fragments_2[_i], decoded = _a[0], encoded = _a[1];
            _loop_2(decoded, encoded);
        }
    });
    describe('encodePointerSegments()', function () {
        var _loop_3 = function (decoded, encoded) {
            it("".concat(JSON.stringify(decoded), " encodes to ").concat(JSON.stringify(encoded)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.encodePointerSegments)(decoded)).to.eql(encoded);
            });
        };
        for (var _i = 0, pointers_1 = pointers; _i < pointers_1.length; _i++) {
            var _a = pointers_1[_i], decoded = _a[0], encoded = _a[1];
            _loop_3(decoded, encoded);
        }
    });
    describe('decodePointerSegments()', function () {
        var _loop_4 = function (decoded, encoded) {
            it("".concat(JSON.stringify(encoded), " encodes to ").concat(JSON.stringify(decoded)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.decodePointerSegments)(encoded)).to.eql(decoded);
            });
        };
        for (var _i = 0, pointers_2 = pointers; _i < pointers_2.length; _i++) {
            var _a = pointers_2[_i], decoded = _a[0], encoded = _a[1];
            _loop_4(decoded, encoded);
        }
    });
    describe('encodePointer()', function () {
        it('throws when segments unspecified', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                return (0,___WEBPACK_IMPORTED_MODULE_1__.encodePointer)(undefined);
            }).to.throw('Invalid type: path must be an array of segments.');
        });
        it('throws when segments specified wrong type', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return (0,___WEBPACK_IMPORTED_MODULE_1__.encodePointer)({}); }).to.throw('Invalid type: path must be an array of segments.');
        });
        var _loop_5 = function (encoded, p) {
            it("".concat(JSON.stringify(encoded), " = '").concat(p, "'"), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.encodePointer)(encoded)).to.eql(p);
            });
        };
        for (var _i = 0, pointers_3 = pointers; _i < pointers_3.length; _i++) {
            var _a = pointers_3[_i], encoded = _a[1], p = _a[2];
            _loop_5(encoded, p);
        }
    });
    describe('encodeUriFragmentIdentifier()', function () {
        it('throws when segments unspecified', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                return (0,___WEBPACK_IMPORTED_MODULE_1__.encodeUriFragmentIdentifier)(undefined);
            }).to.throw('Invalid type: path must be an array of segments.');
        });
        it('throws when segments specified wrong type', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                return (0,___WEBPACK_IMPORTED_MODULE_1__.encodeUriFragmentIdentifier)({});
            }).to.throw('Invalid type: path must be an array of segments.');
        });
        var _loop_6 = function (decoded, p) {
            it("".concat(JSON.stringify(decoded), " = '").concat(p, "'"), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.encodeUriFragmentIdentifier)(decoded)).to.eql(p);
            });
        };
        for (var _i = 0, fragments_3 = fragments; _i < fragments_3.length; _i++) {
            var _a = fragments_3[_i], decoded = _a[0], p = _a[2];
            _loop_6(decoded, p);
        }
    });
    describe('decodeUriFragmentIdentifier()', function () {
        it('throws when ptr unspecified', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                return (0,___WEBPACK_IMPORTED_MODULE_1__.decodeUriFragmentIdentifier)(undefined);
            }).to.throw('Invalid type: JSON Pointers are represented as strings.');
        });
        it('throws when ptr specified wrong type', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                return (0,___WEBPACK_IMPORTED_MODULE_1__.decodeUriFragmentIdentifier)({});
            }).to.throw('Invalid type: JSON Pointers are represented as strings.');
        });
        it('throws when invalid ptr specified', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return (0,___WEBPACK_IMPORTED_MODULE_1__.decodeUriFragmentIdentifier)(''); }).to.throw('Invalid JSON Pointer syntax; URI fragment identifiers must begin with a hash.');
        });
        var _loop_7 = function (decoded, p) {
            var d = decoded.map(function (v) { return v + ''; });
            it("'".concat(p, "' === ").concat(JSON.stringify(d)), function () {
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.decodeUriFragmentIdentifier)(p)).to.eql(d);
            });
        };
        for (var _i = 0, fragments_4 = fragments; _i < fragments_4.length; _i++) {
            var _a = fragments_4[_i], decoded = _a[0], p = _a[2];
            _loop_7(decoded, p);
        }
    });
    describe('toArrayIndexReference()', function () {
        it('returns idx when specified as number', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.toArrayIndexReference)([], 1000)).to.eql(1000);
        });
        it("returns 0 when array falsy and idx === '-'", function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.toArrayIndexReference)(undefined, '-')).to.eql(0);
        });
        it("returns length when idx === '-'", function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.toArrayIndexReference)(['one'], '-')).to.eql(1);
        });
        it('returns -1 when idx NAN', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.toArrayIndexReference)([], 'NaN')).to.eql(-1);
        });
        it('returns -1 when idx empty', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.toArrayIndexReference)([], '')).to.eql(-1);
        });
        it('returns -1 when idx large numeric string but NaN', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.toArrayIndexReference)([], '999s9')).to.eql(-1);
        });
    });
    describe('setValueAtPath()', function () {
        it('throws when target undefined', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return (0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)(undefined, 0, ['foo']); }).to.throw('Cannot set values on undefined');
        });
        var data = { one: ['two', { three: 'four' }] };
        it('does not set at end of array if not forced', function () {
            var expected = data.one.length;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)(data, 'VV', ['one', 2])).to.be.undefined;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(data.one.length).to.eql(expected);
        });
        it('will set at end of array if forced', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)(data, 'VV', ['one', 2], true)).to.be.undefined;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(data.one[2]).to.eql('VV');
        });
        it('does not set beyond end of array if not forced', function () {
            var expected = data.one.length;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)(data, 'VV', ['one', 5])).to.be.undefined;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(data.one.length).to.eql(expected);
        });
        it('will set beyond end of array if forced', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)(data, 'VV', ['one', 5], true)).to.be.undefined;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(data.one[5]).to.eql('VV');
        });
        it('will prevent __proto__ from being polluted', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)({}, 'yes', ['__proto__', 'polluted'], true);
            }).to.throw('Attempted prototype pollution disallowed.');
            var prototyped = {};
            if (!prototyped.__proto__)
                return;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(prototyped.__proto__.polluted).to.not.eql('yes');
        });
        it('will prevent .constructor from being polluted', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)({}, 'yes', ['constructor', 'polluted'], true);
            }).to.throw('Attempted prototype pollution disallowed.');
            var prototyped = {};
            if (!prototyped.constructor)
                return;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(prototyped.constructor.polluted).to.not.eql('yes');
        });
        it('will prevent .prototype from being polluted', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)({}, 'yes', ['prototype', 'polluted'], true);
            }).to.throw('Attempted prototype pollution disallowed.');
            var prototyped = {};
            if (!prototyped.prototype)
                return;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(prototyped.prototype.polluted).to.not.eql('yes');
        });
        it('will prevent __proto__ from being polluted by javascript', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.setValueAtPath)({}, 'yes', 
                // not allowed in TS depending on tsconfig, but hackable in JS:
                [['__proto__'], 'polluted'], true);
                var prototyped = {};
                (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(prototyped.__proto__).to.be.undefined;
            }).to.throw('PathSegments must be a string or a number.');
        });
    });
    describe('unsetValueAtPath()', function () {
        it('throws when target undefined', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () { return (0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)(undefined, ['foo']); }).to.throw('Cannot unset values on undefined');
        });
        var data = {
            a: ['one', { two: 'three' }, 'four', { five: { six: 'seven' } }],
        };
        it('can unset array elements', function () {
            var expected = data.a[0];
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)(data, (0,___WEBPACK_IMPORTED_MODULE_1__.decodePointer)('/a/0'))).to.eql(expected);
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(data.a[0]).to.be.undefined;
        });
        it('returns undefined if reference beyond array length', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)(data, (0,___WEBPACK_IMPORTED_MODULE_1__.decodePointer)('/a/7'))).to.undefined;
        });
        it('succeeds when path through array', function () {
            var expected = data.a[3].six;
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)((0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)(data, (0,___WEBPACK_IMPORTED_MODULE_1__.decodePointer)('/a/3/six'))).to.eql(expected);
        });
        it('will prevent __proto__ from being polluted', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)({}, ['__proto__', 'polluted']);
            }).to.throw('Attempted prototype pollution disallowed.');
        });
        it('will prevent .constructor from being polluted', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)({}, ['constructor', 'polluted']);
            }).to.throw('Attempted prototype pollution disallowed.');
        });
        it('will prevent .prototype from being polluted', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)({}, ['prototype', 'polluted']);
            }).to.throw('Attempted prototype pollution disallowed.');
        });
        it('will prevent __proto__ from being polluted by javascript', function () {
            (0,chai__WEBPACK_IMPORTED_MODULE_0__.expect)(function () {
                (0,___WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath)({}, 
                // not allowed in TS depending on tsconfig, but hackable in JS:
                [['__proto__'], 'polluted']);
            }).to.throw('PathSegments must be a string or a number.');
        });
    });
});


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "compilePointerDereference": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.compilePointerDereference),
/* harmony export */   "decodeFragmentSegments": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.decodeFragmentSegments),
/* harmony export */   "decodePointer": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.decodePointer),
/* harmony export */   "decodePointerSegments": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.decodePointerSegments),
/* harmony export */   "decodePtrInit": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.decodePtrInit),
/* harmony export */   "decodeRelativePointer": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.decodeRelativePointer),
/* harmony export */   "decodeUriFragmentIdentifier": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.decodeUriFragmentIdentifier),
/* harmony export */   "encodeFragmentSegments": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.encodeFragmentSegments),
/* harmony export */   "encodePointer": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.encodePointer),
/* harmony export */   "encodePointerSegments": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.encodePointerSegments),
/* harmony export */   "encodeUriFragmentIdentifier": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.encodeUriFragmentIdentifier),
/* harmony export */   "looksLikeFragment": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.looksLikeFragment),
/* harmony export */   "pickDecoder": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.pickDecoder),
/* harmony export */   "replace": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.replace),
/* harmony export */   "setValueAtPath": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.setValueAtPath),
/* harmony export */   "toArrayIndexReference": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.toArrayIndexReference),
/* harmony export */   "unsetValueAtPath": () => (/* reexport safe */ _util__WEBPACK_IMPORTED_MODULE_1__.unsetValueAtPath),
/* harmony export */   "JsonPointer": () => (/* reexport safe */ _pointer__WEBPACK_IMPORTED_MODULE_2__.JsonPointer),
/* harmony export */   "JsonReference": () => (/* reexport safe */ _pointer__WEBPACK_IMPORTED_MODULE_2__.JsonReference)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types */ "./src/types.ts");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util */ "./src/util.ts");
/* harmony import */ var _pointer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pointer */ "./src/pointer.ts");
/**
 * @packageDocumentation
 */





/***/ }),

/***/ "./src/pointer.ts":
/*!************************!*\
  !*** ./src/pointer.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JsonPointer": () => (/* binding */ JsonPointer),
/* harmony export */   "JsonReference": () => (/* binding */ JsonReference)
/* harmony export */ });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/util.ts");

/**
 * Determines if the value is an object (not null)
 * @param value the value
 * @returns true if the value is a non-null object; otherwise false.
 *
 * @hidden
 */
function isObject(value) {
    return typeof value === 'object' && value !== null;
}
/** @hidden */
function shouldDescend(obj) {
    return isObject(obj) && !JsonReference.isReference(obj);
}
/** @hidden */
function descendingVisit(target, visitor, encoder) {
    var distinctObjects = new Map();
    var q = [{ obj: target, path: [] }];
    while (q.length) {
        var _a = q.shift(), obj = _a.obj, path = _a.path;
        visitor(encoder(path), obj);
        if (shouldDescend(obj)) {
            distinctObjects.set(obj, new JsonPointer((0,_util__WEBPACK_IMPORTED_MODULE_0__.encodeUriFragmentIdentifier)(path)));
            if (!Array.isArray(obj)) {
                var keys = Object.keys(obj);
                var len = keys.length;
                var i = -1;
                while (++i < len) {
                    var it_1 = obj[keys[i]];
                    if (isObject(it_1) && distinctObjects.has(it_1)) {
                        q.push({
                            obj: new JsonReference(distinctObjects.get(it_1)),
                            path: path.concat(keys[i]),
                        });
                    }
                    else {
                        q.push({
                            obj: it_1,
                            path: path.concat(keys[i]),
                        });
                    }
                }
            }
            else {
                // handleArray
                var j = -1;
                var len = obj.length;
                while (++j < len) {
                    var it_2 = obj[j];
                    if (isObject(it_2) && distinctObjects.has(it_2)) {
                        q.push({
                            obj: new JsonReference(distinctObjects.get(it_2)),
                            path: path.concat([j + '']),
                        });
                    }
                    else {
                        q.push({
                            obj: it_2,
                            path: path.concat([j + '']),
                        });
                    }
                }
            }
        }
    }
}
/** @hidden */
var $ptr = Symbol('pointer');
/** @hidden */
var $frg = Symbol('fragmentId');
/** @hidden */
var $get = Symbol('getter');
/**
 * Represents a JSON Pointer, capable of getting and setting the value on target
 * objects at the pointer's location.
 *
 * While there are static variants for most operations, our recommendation is
 * to use the instance level methods, which enables you avoid repeated
 * compiling/emitting transient accessors. Take a look at the speed comparisons
 * for our justification.
 *
 * In most cases, you should create and reuse instances of JsonPointer within
 * scope that makes sense for your app. We often create constants for frequently
 * used pointers, but your use case may vary.
 *
 * The following is a contrived example showing a function that uses pointers to
 * deal with changes in the structure of data (a version independent function):
 *
 * ```ts
 * import { JsonPointer } from 'json-ptr';
 *
 * export type SupportedVersion = '1.0' | '1.1';
 *
 * interface PrimaryGuestNamePointers {
 *   name: JsonPointer;
 *   surname: JsonPointer;
 *   honorific: JsonPointer;
 * }
 * const versions: Record<SupportedVersion, PrimaryGuestNamePointers> = {
 *   '1.0': {
 *     name: JsonPointer.create('/guests/0/name'),
 *     surname: JsonPointer.create('/guests/0/surname'),
 *     honorific: JsonPointer.create('/guests/0/honorific'),
 *   },
 *   '1.1': {
 *     name: JsonPointer.create('/primary/primaryGuest/name'),
 *     surname: JsonPointer.create('/primary/primaryGuest/surname'),
 *     honorific: JsonPointer.create('/primary/primaryGuest/honorific'),
 *   }
 * };
 *
 * interface Reservation extends Record<string, unknown> {
 *   version?: SupportedVersion;
 * }
 *
 * function primaryGuestName(reservation: Reservation): string {
 *   const pointers = versions[reservation.version || '1.0'];
 *   const name = pointers.name.get(reservation) as string;
 *   const surname = pointers.surname.get(reservation) as string;
 *   const honorific = pointers.honorific.get(reservation) as string;
 *   const names: string[] = [];
 *   if (honorific) names.push(honorific);
 *   if (name) names.push(name);
 *   if (surname) names.push(surname);
 *   return names.join(' ');
 * }
 *
 * // The original layout of a reservation (only the parts relevant to our example)
 * const reservationV1: Reservation = {
 *   guests: [{
 *     name: 'Wilbur',
 *     surname: 'Finkle',
 *     honorific: 'Mr.'
 *   }, {
 *     name: 'Wanda',
 *     surname: 'Finkle',
 *     honorific: 'Mrs.'
 *   }, {
 *     name: 'Wilma',
 *     surname: 'Finkle',
 *     honorific: 'Miss',
 *     child: true,
 *     age: 12
 *   }]
 *   // ...
 * };
 *
 * // The new layout of a reservation (only the parts relevant to our example)
 * const reservationV1_1: Reservation = {
 *   version: '1.1',
 *   primary: {
 *     primaryGuest: {
 *       name: 'Wilbur',
 *       surname: 'Finkle',
 *       honorific: 'Mr.'
 *     },
 *     additionalGuests: [{
 *       name: 'Wanda',
 *       surname: 'Finkle',
 *       honorific: 'Mrs.'
 *     }, {
 *       name: 'Wilma',
 *       surname: 'Finkle',
 *       honorific: 'Miss',
 *       child: true,
 *       age: 12
 *     }]
 *     // ...
 *   }
 *   // ...
 * };
 *
 * console.log(primaryGuestName(reservationV1));
 * console.log(primaryGuestName(reservationV1_1));
 *
 * ```
 *
 * There are many uses for pointers.
 */
var JsonPointer = /** @class */ (function () {
    /**
     * Creates a new instance.
     * @param ptr a string representation of a JSON Pointer, or a decoded array of path segments.
     */
    function JsonPointer(ptr) {
        this.path = (0,_util__WEBPACK_IMPORTED_MODULE_0__.decodePtrInit)(ptr);
    }
    /**
     * Factory function that creates a JsonPointer instance.
     *
     * ```ts
     * const ptr = JsonPointer.create('/deeply/nested/data/0/here');
     * ```
     * _or_
     * ```ts
     * const ptr = JsonPointer.create(['deeply', 'nested', 'data', 0, 'here']);
     * ```
     * @param pointer the pointer or path.
     */
    JsonPointer.create = function (pointer) {
        return new JsonPointer(pointer);
    };
    /**
     * Determines if the specified `target`'s object graph has a value at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.has(target, '/third/0'));
     * // true
     * console.log(JsonPointer.has(target, '/tenth'));
     * // false
     * ```
     *
     * @param target the target of the operation
     * @param pointer the pointer or path
     */
    JsonPointer.has = function (target, pointer) {
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.has(target);
    };
    /**
     * Gets the `target` object's value at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.get(target, '/third/2/sixth'));
     * // seventh
     * console.log(JsonPointer.get(target, '/tenth'));
     * // undefined
     * ```
     *
     * @param target the target of the operation
     * @param pointer the pointer or path.
     */
    JsonPointer.get = function (target, pointer) {
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.get(target);
    };
    /**
     * Sets the `target` object's value, as specified, at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.set(target, '/third/2/sixth', 'tenth'));
     * // seventh
     * console.log(JsonPointer.set(target, '/tenth', 'eleventh', true));
     * // undefined
     * console.log(JSON.stringify(target, null, ' '));
     * // {
     * // "first": "second",
     * // "third": [
     * //  "fourth",
     * //  "fifth",
     * //  {
     * //   "sixth": "tenth"
     * //  }
     * // ],
     * // "eighth": "ninth",
     * // "tenth": "eleventh"
     * // }
     * ```
     *
     * @param target the target of the operation
     * @param pointer the pointer or path
     * @param val a value to write into the object graph at the specified pointer location
     * @param force indications whether the operation should force the pointer's location into existence in the object graph.
     *
     * @returns the prior value at the pointer's location in the object graph.
     */
    JsonPointer.set = function (target, pointer, val, force) {
        if (force === void 0) { force = false; }
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.set(target, val, force);
    };
    /**
     * Removes the `target` object's value at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.unset(target, '/third/2/sixth'));
     * // seventh
     * console.log(JsonPointer.unset(target, '/tenth'));
     * // undefined
     * console.log(JSON.stringify(target, null, ' '));
     * // {
     * // "first": "second",
     * // "third": [
     * //  "fourth",
     * //  "fifth",
     * //  {}
     * // ],
     * // "eighth": "ninth",
     * // }
     * ```
     * @param target the target of the operation
     * @param pointer the pointer or path
     *
     * @returns the value that was removed from the object graph.
     */
    JsonPointer.unset = function (target, pointer) {
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.unset(target);
    };
    /**
     * Decodes the specified pointer into path segments.
     * @param pointer a string representation of a JSON Pointer
     */
    JsonPointer.decode = function (pointer) {
        return (0,_util__WEBPACK_IMPORTED_MODULE_0__.pickDecoder)(pointer)(pointer);
    };
    /**
     * Evaluates the target's object graph, calling the specified visitor for every unique pointer location discovered while walking the graph.
     * @param target the target of the operation
     * @param visitor a callback function invoked for each unique pointer location in the object graph
     * @param fragmentId indicates whether the visitor should receive fragment identifiers or regular pointers
     */
    JsonPointer.visit = function (target, visitor, fragmentId) {
        if (fragmentId === void 0) { fragmentId = false; }
        descendingVisit(target, visitor, fragmentId ? _util__WEBPACK_IMPORTED_MODULE_0__.encodeUriFragmentIdentifier : _util__WEBPACK_IMPORTED_MODULE_0__.encodePointer);
    };
    /**
     * Evaluates the target's object graph, returning a [[JsonStringPointerListItem]] for each location in the graph.
     * @param target the target of the operation
     */
    JsonPointer.listPointers = function (target) {
        var res = [];
        descendingVisit(target, function (pointer, value) {
            res.push({ pointer: pointer, value: value });
        }, _util__WEBPACK_IMPORTED_MODULE_0__.encodePointer);
        return res;
    };
    /**
     * Evaluates the target's object graph, returning a [[UriFragmentIdentifierPointerListItem]] for each location in the graph.
     * @param target the target of the operation
     */
    JsonPointer.listFragmentIds = function (target) {
        var res = [];
        descendingVisit(target, function (fragmentId, value) {
            res.push({ fragmentId: fragmentId, value: value });
        }, _util__WEBPACK_IMPORTED_MODULE_0__.encodeUriFragmentIdentifier);
        return res;
    };
    /**
     * Evaluates the target's object graph, returning a Record&lt;Pointer, unknown> populated with pointers and the corresponding values from the graph.
     * @param target the target of the operation
     * @param fragmentId indicates whether the results are populated with fragment identifiers rather than regular pointers
     */
    JsonPointer.flatten = function (target, fragmentId) {
        if (fragmentId === void 0) { fragmentId = false; }
        var res = {};
        descendingVisit(target, function (p, v) {
            res[p] = v;
        }, fragmentId ? _util__WEBPACK_IMPORTED_MODULE_0__.encodeUriFragmentIdentifier : _util__WEBPACK_IMPORTED_MODULE_0__.encodePointer);
        return res;
    };
    /**
     * Evaluates the target's object graph, returning a Map&lt;Pointer,unknown>  populated with pointers and the corresponding values form the graph.
     * @param target the target of the operation
     * @param fragmentId indicates whether the results are populated with fragment identifiers rather than regular pointers
     */
    JsonPointer.map = function (target, fragmentId) {
        if (fragmentId === void 0) { fragmentId = false; }
        var res = new Map();
        descendingVisit(target, res.set.bind(res), fragmentId ? _util__WEBPACK_IMPORTED_MODULE_0__.encodeUriFragmentIdentifier : _util__WEBPACK_IMPORTED_MODULE_0__.encodePointer);
        return res;
    };
    /**
     * Gets the target object's value at the pointer's location.
     * @param target the target of the operation
     */
    JsonPointer.prototype.get = function (target) {
        if (!this[$get]) {
            this[$get] = (0,_util__WEBPACK_IMPORTED_MODULE_0__.compilePointerDereference)(this.path);
        }
        return this[$get](target);
    };
    /**
     * Sets the target object's value, as specified, at the pointer's location.
     *
     * If any part of the pointer's path does not exist, the operation aborts
     * without modification, unless the caller indicates that pointer's location
     * should be created.
     *
     * @param target the target of the operation
     * @param value the value to set
     * @param force indicates whether the pointer's location should be created if it doesn't already exist.
     */
    JsonPointer.prototype.set = function (target, value, force) {
        if (force === void 0) { force = false; }
        return (0,_util__WEBPACK_IMPORTED_MODULE_0__.setValueAtPath)(target, value, this.path, force);
    };
    /**
     * Removes the target object's value at the pointer's location.
     * @param target the target of the operation
     *
     * @returns the value that was removed from the object graph.
     */
    JsonPointer.prototype.unset = function (target) {
        return (0,_util__WEBPACK_IMPORTED_MODULE_0__.unsetValueAtPath)(target, this.path);
    };
    /**
     * Determines if the specified target's object graph has a value at the pointer's location.
     * @param target the target of the operation
     */
    JsonPointer.prototype.has = function (target) {
        return typeof this.get(target) !== 'undefined';
    };
    /**
     * Gets the value in the object graph that is the parent of the pointer location.
     * @param target the target of the operation
     */
    JsonPointer.prototype.parent = function (target) {
        var p = this.path;
        if (p.length == 1)
            return undefined;
        var parent = new JsonPointer(p.slice(0, p.length - 1));
        return parent.get(target);
    };
    /**
     * Creates a new JsonPointer instance, pointing to the specified relative location in the object graph.
     * @param ptr the relative pointer (relative to this)
     * @returns A new instance that points to the relative location.
     */
    JsonPointer.prototype.relative = function (ptr) {
        var p = this.path;
        var decoded = (0,_util__WEBPACK_IMPORTED_MODULE_0__.decodeRelativePointer)(ptr);
        var n = parseInt(decoded[0]);
        if (n > p.length)
            throw new Error('Relative location does not exist.');
        var r = p.slice(0, p.length - n).concat(decoded.slice(1));
        if (decoded[0][decoded[0].length - 1] == '#') {
            // It references the path segment/name, not the value
            var name_1 = r[r.length - 1];
            throw new Error("We won't compile a pointer that will always return '".concat(name_1, "'. Use JsonPointer.rel(target, ptr) instead."));
        }
        return new JsonPointer(r);
    };
    /**
     * Resolves the specified relative pointer path against the specified target object, and gets the target object's value at the relative pointer's location.
     * @param target the target of the operation
     * @param ptr the relative pointer (relative to this)
     * @returns the value at the relative pointer's resolved path; otherwise undefined.
     */
    JsonPointer.prototype.rel = function (target, ptr) {
        var p = this.path;
        var decoded = (0,_util__WEBPACK_IMPORTED_MODULE_0__.decodeRelativePointer)(ptr);
        var n = parseInt(decoded[0]);
        if (n > p.length) {
            // out of bounds
            return undefined;
        }
        var r = p.slice(0, p.length - n).concat(decoded.slice(1));
        var other = new JsonPointer(r);
        if (decoded[0][decoded[0].length - 1] == '#') {
            // It references the path segment/name, not the value
            var name_2 = r[r.length - 1];
            var parent_1 = other.parent(target);
            return Array.isArray(parent_1) ? parseInt(name_2, 10) : name_2;
        }
        return other.get(target);
    };
    /**
     * Creates a new instance by concatenating the specified pointer's path onto this pointer's path.
     * @param ptr the string representation of a pointer, it's decoded path, or an instance of JsonPointer indicating the additional path to concatenate onto the pointer.
     */
    JsonPointer.prototype.concat = function (ptr) {
        return new JsonPointer(this.path.concat(ptr instanceof JsonPointer ? ptr.path : (0,_util__WEBPACK_IMPORTED_MODULE_0__.decodePtrInit)(ptr)));
    };
    Object.defineProperty(JsonPointer.prototype, "pointer", {
        /**
         * This pointer's JSON Pointer encoded string representation.
         */
        get: function () {
            if (this[$ptr] === undefined) {
                this[$ptr] = (0,_util__WEBPACK_IMPORTED_MODULE_0__.encodePointer)(this.path);
            }
            return this[$ptr];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(JsonPointer.prototype, "uriFragmentIdentifier", {
        /**
         * This pointer's URI fragment identifier encoded string representation.
         */
        get: function () {
            if (!this[$frg]) {
                this[$frg] = (0,_util__WEBPACK_IMPORTED_MODULE_0__.encodeUriFragmentIdentifier)(this.path);
            }
            return this[$frg];
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Emits the JSON Pointer encoded string representation.
     */
    JsonPointer.prototype.toString = function () {
        return this.pointer;
    };
    return JsonPointer;
}());

/** @hidden */
var $pointer = Symbol('pointer');
/**
 * A reference to a location in an object graph.
 *
 * This type is used by this module to break cycles in an object graph and to
 * reference locations that have already been visited when enumerating pointers.
 */
var JsonReference = /** @class */ (function () {
    /**
     * Creates a new instance.
     * @param pointer a JSON Pointer for the reference.
     */
    function JsonReference(pointer) {
        this[$pointer] =
            pointer instanceof JsonPointer ? pointer : new JsonPointer(pointer);
        this.$ref = this[$pointer].uriFragmentIdentifier;
    }
    /**
     * Determines if the specified `candidate` is a JsonReference.
     * @param candidate the candidate
     */
    JsonReference.isReference = function (candidate) {
        if (!candidate)
            return false;
        var ref = candidate;
        return typeof ref.$ref === 'string' && typeof ref.resolve === 'function';
    };
    /**
     * Resolves the reference against the `target` object, returning the value at
     * the referenced pointer's location.
     * @param target the target object
     */
    JsonReference.prototype.resolve = function (target) {
        return this[$pointer].get(target);
    };
    /**
     * Gets the reference's pointer.
     */
    JsonReference.prototype.pointer = function () {
        return this[$pointer];
    };
    /**
     * Gets the reference pointer's string representation (a URI fragment identifier).
     */
    JsonReference.prototype.toString = function () {
        return this.$ref;
    };
    return JsonReference;
}());



/***/ }),

/***/ "./src/types.ts":
/*!**********************!*\
  !*** ./src/types.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "./src/util.ts":
/*!*********************!*\
  !*** ./src/util.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "replace": () => (/* binding */ replace),
/* harmony export */   "decodeFragmentSegments": () => (/* binding */ decodeFragmentSegments),
/* harmony export */   "encodeFragmentSegments": () => (/* binding */ encodeFragmentSegments),
/* harmony export */   "decodePointerSegments": () => (/* binding */ decodePointerSegments),
/* harmony export */   "encodePointerSegments": () => (/* binding */ encodePointerSegments),
/* harmony export */   "decodePointer": () => (/* binding */ decodePointer),
/* harmony export */   "encodePointer": () => (/* binding */ encodePointer),
/* harmony export */   "decodeUriFragmentIdentifier": () => (/* binding */ decodeUriFragmentIdentifier),
/* harmony export */   "encodeUriFragmentIdentifier": () => (/* binding */ encodeUriFragmentIdentifier),
/* harmony export */   "decodeRelativePointer": () => (/* binding */ decodeRelativePointer),
/* harmony export */   "toArrayIndexReference": () => (/* binding */ toArrayIndexReference),
/* harmony export */   "compilePointerDereference": () => (/* binding */ compilePointerDereference),
/* harmony export */   "setValueAtPath": () => (/* binding */ setValueAtPath),
/* harmony export */   "unsetValueAtPath": () => (/* binding */ unsetValueAtPath),
/* harmony export */   "looksLikeFragment": () => (/* binding */ looksLikeFragment),
/* harmony export */   "pickDecoder": () => (/* binding */ pickDecoder),
/* harmony export */   "decodePtrInit": () => (/* binding */ decodePtrInit)
/* harmony export */ });
function replace(source, find, repl) {
    var res = '';
    var rem = source;
    var beg = 0;
    var end = -1;
    while ((end = rem.indexOf(find)) > -1) {
        res += source.substring(beg, beg + end) + repl;
        rem = rem.substring(end + find.length, rem.length);
        beg += end + find.length;
    }
    if (rem.length > 0) {
        res += source.substring(source.length - rem.length, source.length);
    }
    return res;
}
function decodeFragmentSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = replace(replace(decodeURIComponent(segments[i]), '~1', '/'), '~0', '~');
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function encodeFragmentSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = encodeURIComponent(replace(replace(segments[i], '~', '~0'), '/', '~1'));
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function decodePointerSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = replace(replace(segments[i], '~1', '/'), '~0', '~');
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function encodePointerSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = replace(replace(segments[i], '~', '~0'), '/', '~1');
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function decodePointer(ptr) {
    if (typeof ptr !== 'string') {
        throw new TypeError('Invalid type: JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0) {
        return [];
    }
    if (ptr[0] !== '/') {
        throw new ReferenceError('Invalid JSON Pointer syntax. Non-empty pointer must begin with a solidus `/`.');
    }
    return decodePointerSegments(ptr.substring(1).split('/'));
}
function encodePointer(path) {
    if (!path || (path && !Array.isArray(path))) {
        throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
        return '';
    }
    return '/'.concat(encodePointerSegments(path).join('/'));
}
function decodeUriFragmentIdentifier(ptr) {
    if (typeof ptr !== 'string') {
        throw new TypeError('Invalid type: JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0 || ptr[0] !== '#') {
        throw new ReferenceError('Invalid JSON Pointer syntax; URI fragment identifiers must begin with a hash.');
    }
    if (ptr.length === 1) {
        return [];
    }
    if (ptr[1] !== '/') {
        throw new ReferenceError('Invalid JSON Pointer syntax.');
    }
    return decodeFragmentSegments(ptr.substring(2).split('/'));
}
function encodeUriFragmentIdentifier(path) {
    if (!path || (path && !Array.isArray(path))) {
        throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
        return '#';
    }
    return '#/'.concat(encodeFragmentSegments(path).join('/'));
}
var InvalidRelativePointerError = 'Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.';
function decodeRelativePointer(ptr) {
    if (typeof ptr !== 'string') {
        throw new TypeError('Invalid type: Relative JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0) {
        // https://tools.ietf.org/id/draft-handrews-relative-json-pointer-00.html#rfc.section.3
        throw new ReferenceError(InvalidRelativePointerError);
    }
    var segments = ptr.split('/');
    var first = segments[0];
    // It is a name reference; strip the hash.
    if (first[first.length - 1] == '#') {
        if (segments.length > 1) {
            throw new ReferenceError(InvalidRelativePointerError);
        }
        first = first.substr(0, first.length - 1);
    }
    var i = -1;
    var len = first.length;
    while (++i < len) {
        if (first[i] < '0' || first[i] > '9') {
            throw new ReferenceError(InvalidRelativePointerError);
        }
    }
    var path = decodePointerSegments(segments.slice(1));
    path.unshift(segments[0]);
    return path;
}
function toArrayIndexReference(arr, idx) {
    if (typeof idx === 'number')
        return idx;
    var len = idx.length;
    if (!len)
        return -1;
    var cursor = 0;
    if (len === 1 && idx[0] === '-') {
        if (!Array.isArray(arr)) {
            return 0;
        }
        return arr.length;
    }
    while (++cursor < len) {
        if (idx[cursor] < '0' || idx[cursor] > '9') {
            return -1;
        }
    }
    return parseInt(idx, 10);
}
function compilePointerDereference(path) {
    var body = "if (typeof(it) !== 'undefined'";
    if (path.length === 0) {
        return function (it) { return it; };
    }
    body = path.reduce(function (body, _, i) {
        return (body +
            "\n\t&& it !== null && typeof((it = it['" +
            replace(replace(path[i] + '', '\\', '\\\\'), "'", "\\'") +
            "'])) !== 'undefined'");
    }, "if (typeof(it) !== 'undefined'");
    body = body + ') {\n\treturn it;\n }';
    // eslint-disable-next-line no-new-func
    return new Function('it', body);
}
function setValueAtPath(target, val, path, force) {
    if (force === void 0) { force = false; }
    if (path.length === 0) {
        throw new Error('Cannot set the root object; assign it directly.');
    }
    if (typeof target === 'undefined') {
        throw new TypeError('Cannot set values on undefined');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var it = target;
    var len = path.length;
    var end = path.length - 1;
    var step;
    var cursor = -1;
    var rem;
    var p;
    while (++cursor < len) {
        step = path[cursor];
        if (typeof step !== 'string' && typeof step !== 'number') {
            throw new TypeError('PathSegments must be a string or a number.');
        }
        if (
        // Reconsider this strategy. It disallows legitimate structures on
        // non - objects, or more precisely, on objects not derived from a class
        // or constructor function.
        step === '__proto__' ||
            step === 'constructor' ||
            step === 'prototype') {
            throw new Error('Attempted prototype pollution disallowed.');
        }
        if (Array.isArray(it)) {
            if (step === '-' && cursor === end) {
                it.push(val);
                return undefined;
            }
            p = toArrayIndexReference(it, step);
            if (it.length > p) {
                if (cursor === end) {
                    rem = it[p];
                    it[p] = val;
                    break;
                }
                it = it[p];
            }
            else if (cursor === end && p === it.length) {
                if (force) {
                    it.push(val);
                    return undefined;
                }
            }
            else if (force) {
                it = it[p] = cursor === end ? val : {};
            }
        }
        else {
            if (typeof it[step] === 'undefined') {
                if (force) {
                    if (cursor === end) {
                        it[step] = val;
                        return undefined;
                    }
                    // if the next step is an array index, this step should be an array.
                    var n = Number(path[cursor + 1]);
                    if (Number.isInteger(n) &&
                        toArrayIndexReference(it[step], n) !== -1) {
                        it = it[step] = [];
                        continue;
                    }
                    it = it[step] = {};
                    continue;
                }
                return undefined;
            }
            if (cursor === end) {
                rem = it[step];
                it[step] = val;
                break;
            }
            it = it[step];
        }
    }
    return rem;
}
function unsetValueAtPath(target, path) {
    if (path.length === 0) {
        throw new Error('Cannot unset the root object; assign it directly.');
    }
    if (typeof target === 'undefined') {
        throw new TypeError('Cannot unset values on undefined');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var it = target;
    var len = path.length;
    var end = path.length - 1;
    var step;
    var cursor = -1;
    var rem;
    var p;
    while (++cursor < len) {
        step = path[cursor];
        if (typeof step !== 'string' && typeof step !== 'number') {
            throw new TypeError('PathSegments must be a string or a number.');
        }
        if (step === '__proto__' ||
            step === 'constructor' ||
            step === 'prototype') {
            throw new Error('Attempted prototype pollution disallowed.');
        }
        if (Array.isArray(it)) {
            p = toArrayIndexReference(it, step);
            if (p >= it.length)
                return undefined;
            if (cursor === end) {
                rem = it[p];
                delete it[p];
                break;
            }
            it = it[p];
        }
        else {
            if (typeof it[step] === 'undefined') {
                return undefined;
            }
            if (cursor === end) {
                rem = it[step];
                delete it[step];
                break;
            }
            it = it[step];
        }
    }
    return rem;
}
function looksLikeFragment(ptr) {
    return typeof ptr === 'string' && ptr.length > 0 && ptr[0] === '#';
}
function pickDecoder(ptr) {
    return looksLikeFragment(ptr) ? decodeUriFragmentIdentifier : decodePointer;
}
function decodePtrInit(ptr) {
    return Array.isArray(ptr)
        ? ptr.slice(0)
        : pickDecoder(ptr)(ptr);
}


/***/ }),

/***/ "./node_modules/type-detect/type-detect.js":
/*!*************************************************!*\
  !*** ./node_modules/type-detect/type-detect.js ***!
  \*************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

(function (global, factory) {
	 true ? module.exports = factory() :
	0;
}(this, (function () { 'use strict';

/* !
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
var promiseExists = typeof Promise === 'function';

/* eslint-disable no-undef */
var globalObject = typeof self === 'object' ? self : __webpack_require__.g; // eslint-disable-line id-blacklist

var symbolExists = typeof Symbol !== 'undefined';
var mapExists = typeof Map !== 'undefined';
var setExists = typeof Set !== 'undefined';
var weakMapExists = typeof WeakMap !== 'undefined';
var weakSetExists = typeof WeakSet !== 'undefined';
var dataViewExists = typeof DataView !== 'undefined';
var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
var toStringLeftSliceLength = 8;
var toStringRightSliceLength = -1;
/**
 * ### typeOf (obj)
 *
 * Uses `Object.prototype.toString` to determine the type of an object,
 * normalising behaviour across engine versions & well optimised.
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */
function typeDetect(obj) {
  /* ! Speed optimisation
   * Pre:
   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
   * Post:
   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
   */
  var typeofObj = typeof obj;
  if (typeofObj !== 'object') {
    return typeofObj;
  }

  /* ! Speed optimisation
   * Pre:
   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
   * Post:
   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
   */
  if (obj === null) {
    return 'null';
  }

  /* ! Spec Conformance
   * Test: `Object.prototype.toString.call(window)``
   *  - Node === "[object global]"
   *  - Chrome === "[object global]"
   *  - Firefox === "[object Window]"
   *  - PhantomJS === "[object Window]"
   *  - Safari === "[object Window]"
   *  - IE 11 === "[object Window]"
   *  - IE Edge === "[object Window]"
   * Test: `Object.prototype.toString.call(this)``
   *  - Chrome Worker === "[object global]"
   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
   *  - IE 11 Worker === "[object WorkerGlobalScope]"
   *  - IE Edge Worker === "[object WorkerGlobalScope]"
   */
  if (obj === globalObject) {
    return 'global';
  }

  /* ! Speed optimisation
   * Pre:
   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
   * Post:
   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
   */
  if (
    Array.isArray(obj) &&
    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
  ) {
    return 'Array';
  }

  // Not caching existence of `window` and related properties due to potential
  // for `window` to be unset before tests in quasi-browser environments.
  if (typeof window === 'object' && window !== null) {
    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
     * WhatWG HTML$7.7.3 - The `Location` interface
     * Test: `Object.prototype.toString.call(window.location)``
     *  - IE <=11 === "[object Object]"
     *  - IE Edge <=13 === "[object Object]"
     */
    if (typeof window.location === 'object' && obj === window.location) {
      return 'Location';
    }

    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/#document)
     * WhatWG HTML$3.1.1 - The `Document` object
     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
     *       which suggests that browsers should use HTMLTableCellElement for
     *       both TD and TH elements. WhatWG separates these.
     *       WhatWG HTML states:
     *         > For historical reasons, Window objects must also have a
     *         > writable, configurable, non-enumerable property named
     *         > HTMLDocument whose value is the Document interface object.
     * Test: `Object.prototype.toString.call(document)``
     *  - Chrome === "[object HTMLDocument]"
     *  - Firefox === "[object HTMLDocument]"
     *  - Safari === "[object HTMLDocument]"
     *  - IE <=10 === "[object Document]"
     *  - IE 11 === "[object HTMLDocument]"
     *  - IE Edge <=13 === "[object HTMLDocument]"
     */
    if (typeof window.document === 'object' && obj === window.document) {
      return 'Document';
    }

    if (typeof window.navigator === 'object') {
      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
       *  - IE <=10 === "[object MSMimeTypesCollection]"
       */
      if (typeof window.navigator.mimeTypes === 'object' &&
          obj === window.navigator.mimeTypes) {
        return 'MimeTypeArray';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
       * Test: `Object.prototype.toString.call(navigator.plugins)``
       *  - IE <=10 === "[object MSPluginsCollection]"
       */
      if (typeof window.navigator.plugins === 'object' &&
          obj === window.navigator.plugins) {
        return 'PluginArray';
      }
    }

    if ((typeof window.HTMLElement === 'function' ||
        typeof window.HTMLElement === 'object') &&
        obj instanceof window.HTMLElement) {
      /* ! Spec Conformance
      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
      *  - IE <=10 === "[object HTMLBlockElement]"
      */
      if (obj.tagName === 'BLOCKQUOTE') {
        return 'HTMLQuoteElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('td'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TD') {
        return 'HTMLTableDataCellElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('th'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TH') {
        return 'HTMLTableHeaderCellElement';
      }
    }
  }

  /* ! Speed optimisation
  * Pre:
  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
  * Post:
  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
  */
  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
  if (typeof stringTag === 'string') {
    return stringTag;
  }

  var objPrototype = Object.getPrototypeOf(obj);
  /* ! Speed optimisation
  * Pre:
  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
  * Post:
  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
  */
  if (objPrototype === RegExp.prototype) {
    return 'RegExp';
  }

  /* ! Speed optimisation
  * Pre:
  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
  * Post:
  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
  */
  if (objPrototype === Date.prototype) {
    return 'Date';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
   * Test: `Object.prototype.toString.call(Promise.resolve())``
   *  - Chrome <=47 === "[object Object]"
   *  - Edge <=20 === "[object Object]"
   *  - Firefox 29-Latest === "[object Promise]"
   *  - Safari 7.1-Latest === "[object Promise]"
   */
  if (promiseExists && objPrototype === Promise.prototype) {
    return 'Promise';
  }

  /* ! Speed optimisation
  * Pre:
  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
  * Post:
  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
  */
  if (setExists && objPrototype === Set.prototype) {
    return 'Set';
  }

  /* ! Speed optimisation
  * Pre:
  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
  * Post:
  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
  */
  if (mapExists && objPrototype === Map.prototype) {
    return 'Map';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
  * Post:
  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
  */
  if (weakSetExists && objPrototype === WeakSet.prototype) {
    return 'WeakSet';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
  * Post:
  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
  */
  if (weakMapExists && objPrototype === WeakMap.prototype) {
    return 'WeakMap';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
   *  - Edge <=13 === "[object Object]"
   */
  if (dataViewExists && objPrototype === DataView.prototype) {
    return 'DataView';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
   * Test: `Object.prototype.toString.call(new Map().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (mapExists && objPrototype === mapIteratorPrototype) {
    return 'Map Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
   * Test: `Object.prototype.toString.call(new Set().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (setExists && objPrototype === setIteratorPrototype) {
    return 'Set Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
    return 'Array Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
    return 'String Iterator';
  }

  /* ! Speed optimisation
  * Pre:
  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
  * Post:
  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
  */
  if (objPrototype === null) {
    return 'Object';
  }

  return Object
    .prototype
    .toString
    .call(obj)
    .slice(toStringLeftSliceLength, toStringRightSliceLength);
}

return typeDetect;

})));


/***/ }),

/***/ "./node_modules/util/support/isBufferBrowser.js":
/*!******************************************************!*\
  !*** ./node_modules/util/support/isBufferBrowser.js ***!
  \******************************************************/
/***/ ((module) => {

module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}

/***/ }),

/***/ "./node_modules/util/support/types.js":
/*!********************************************!*\
  !*** ./node_modules/util/support/types.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9



var isArgumentsObject = __webpack_require__(/*! is-arguments */ "./node_modules/is-arguments/index.js");
var isGeneratorFunction = __webpack_require__(/*! is-generator-function */ "./node_modules/is-generator-function/index.js");
var whichTypedArray = __webpack_require__(/*! which-typed-array */ "./node_modules/which-typed-array/index.js");
var isTypedArray = __webpack_require__(/*! is-typed-array */ "./node_modules/is-typed-array/index.js");

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBufferCopy === 'undefined') {
    return false;
  }

  if (typeof isSharedArrayBufferToString.working === 'undefined') {
    isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBufferCopy;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});


/***/ }),

/***/ "./node_modules/util/util.js":
/*!***********************************!*\
  !*** ./node_modules/util/util.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = __webpack_require__(/*! ./support/types */ "./node_modules/util/support/types.js");

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(/*! ./support/isBuffer */ "./node_modules/util/support/isBufferBrowser.js");

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js");

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;


/***/ }),

/***/ "./node_modules/which-typed-array/index.js":
/*!*************************************************!*\
  !*** ./node_modules/which-typed-array/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var forEach = __webpack_require__(/*! foreach */ "./node_modules/foreach/index.js");
var availableTypedArrays = __webpack_require__(/*! available-typed-arrays */ "./node_modules/available-typed-arrays/index.js");
var callBound = __webpack_require__(/*! call-bind/callBound */ "./node_modules/call-bind/callBound.js");

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();

var g = typeof globalThis === 'undefined' ? __webpack_require__.g : globalThis;
var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = __webpack_require__(/*! es-abstract/helpers/getOwnPropertyDescriptor */ "./node_modules/es-abstract/helpers/getOwnPropertyDescriptor.js");
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof g[typedArray] === 'function') {
			var arr = new g[typedArray]();
			if (Symbol.toStringTag in arr) {
				var proto = getPrototypeOf(arr);
				var descriptor = gOPD(proto, Symbol.toStringTag);
				if (!descriptor) {
					var superProto = getPrototypeOf(proto);
					descriptor = gOPD(superProto, Symbol.toStringTag);
				}
				toStrTags[typedArray] = descriptor.get;
			}
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = __webpack_require__(/*! is-typed-array */ "./node_modules/is-typed-array/index.js");

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};


/***/ }),

/***/ "./node_modules/available-typed-arrays/index.js":
/*!******************************************************!*\
  !*** ./node_modules/available-typed-arrays/index.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var possibleNames = [
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
];

var g = typeof globalThis === 'undefined' ? __webpack_require__.g : globalThis;

module.exports = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};


/***/ }),

/***/ "./node_modules/es-abstract/helpers/getOwnPropertyDescriptor.js":
/*!**********************************************************************!*\
  !*** ./node_modules/es-abstract/helpers/getOwnPropertyDescriptor.js ***!
  \**********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;


/***/ }),

/***/ "./node_modules/chai/index.mjs":
/*!*************************************!*\
  !*** ./node_modules/chai/index.mjs ***!
  \*************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "expect": () => (/* binding */ expect),
/* harmony export */   "version": () => (/* binding */ version),
/* harmony export */   "Assertion": () => (/* binding */ Assertion),
/* harmony export */   "AssertionError": () => (/* binding */ AssertionError),
/* harmony export */   "util": () => (/* binding */ util),
/* harmony export */   "config": () => (/* binding */ config),
/* harmony export */   "use": () => (/* binding */ use),
/* harmony export */   "should": () => (/* binding */ should),
/* harmony export */   "assert": () => (/* binding */ assert),
/* harmony export */   "core": () => (/* binding */ core),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.js */ "./node_modules/chai/index.js");


const expect = _index_js__WEBPACK_IMPORTED_MODULE_0__.expect;
const version = _index_js__WEBPACK_IMPORTED_MODULE_0__.version;
const Assertion = _index_js__WEBPACK_IMPORTED_MODULE_0__.Assertion;
const AssertionError = _index_js__WEBPACK_IMPORTED_MODULE_0__.AssertionError;
const util = _index_js__WEBPACK_IMPORTED_MODULE_0__.util;
const config = _index_js__WEBPACK_IMPORTED_MODULE_0__.config;
const use = _index_js__WEBPACK_IMPORTED_MODULE_0__.use;
const should = _index_js__WEBPACK_IMPORTED_MODULE_0__.should;
const assert = _index_js__WEBPACK_IMPORTED_MODULE_0__.assert;
const core = _index_js__WEBPACK_IMPORTED_MODULE_0__.core;

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_index_js__WEBPACK_IMPORTED_MODULE_0__);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!********************************!*\
  !*** ./src/__tests__/index.ts ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _pointer_spec__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./pointer.spec */ "./src/__tests__/pointer.spec.ts");
/* harmony import */ var _ptr_spec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ptr.spec */ "./src/__tests__/ptr.spec.ts");
/* harmony import */ var _reference_spec__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reference.spec */ "./src/__tests__/reference.spec.ts");
/* harmony import */ var _utils_spec__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils.spec */ "./src/__tests__/utils.spec.ts");





})();

/******/ })()
;
//# sourceMappingURL=json-ptr.tests.js.map