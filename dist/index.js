"use strict";
/*
  ST - Error, dependency tracking lazy elimination.
  Type-safe errors, minimal runtime, effect tracking,
  dual calling convention, opt-in type-aware throwables,
  extensible decorators, composable throw declarations,
  light dep injection, ZIO / Effect TS lite.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeDefinition = exports.Default = exports.NamedError = exports.NamedThrow = exports.fn = void 0;
/** ### Executables - Decorator Registrar
 * Custom decorators to define handlers for when a function
 * is defined by `fn()` which includes your decorator. `Executables`
 * holds all the defined decorators, its API offers optional statefulness,
 * optional parameterization, optional composition behavior. Executables
 * are cheap, like decorators, they only run on function define by default.
 * Executables can pass messages to themselves or their symbolic neighbors.
 *
 * By default two symbolic neighbors are defined for your, well-known
 * `ST`, `RUNTIME`. The ST handler allows for opt-in composablity. The
 * RUNTIME handler allows for opt-in statefulness.
 */
var Executables = {};
// #region Executable Decorators
var ST = Symbol("@arksouthern/composable");
var RUNTIME = Symbol("@arksouthern/runtime");
var ERRORS = Symbol("@arksouthern/error");
var DEFAULTS = Symbol("@arksouthern/default");
var NAMES = Symbol("@arksouthern/name");
TypeDefinition(ERRORS, function (SYMBOL, value, userFunc) {
    var _a;
    // console.log({value})
    (_a = userFunc[RUNTIME])[SYMBOL] || (_a[SYMBOL] = []);
    var storage = userFunc[RUNTIME][SYMBOL];
    // Composable behavior is identical to runtime behavior
    userFunc[ST][SYMBOL] = storage;
    storage.push.apply(storage, value);
    return storage;
});
TypeDefinition(DEFAULTS, function (SYMBOL, value, userFunc) {
    var _a;
    (_a = userFunc[RUNTIME])[SYMBOL] || (_a[SYMBOL] = {});
    var storage = userFunc[RUNTIME][SYMBOL];
    // Composable behavior is identical to runtime behavior
    userFunc[ST][SYMBOL] = storage;
    Object.assign(storage, value);
    return storage;
});
TypeDefinition(NAMES, function (SYMBOL, value, userFunc) {
    // // DEBUG MODE
    // const st = eval(`({
    //     ["(st)${name}"](props) {......}
    // }["(st)${name}"])`)
    // // RELEASE MODE
    Object.defineProperty(userFunc, "name", { value: value || "(st)fallbackFunctionName" });
});
/**
 * ### ST
 * @see [Tutorial](https://github.com/arksouthern/st#overview)
 * @param name Function name. Shows in code editor or stack traces.
 * @param func Your function definition, accepts a single props parameter.
 * @param propDefs The dep spread of your function. Dependencies or error cases.
 * ```ts
 * const yourFunction = fn("Your Function Name", props => {
 *
 *		return props.firstName + props.lastName
 *
 * }, {firstName: ""}, LastName, Default({log: console.log}), NetworkErr)
 * ```
 */
function fn(name, func) {
    var _a;
    var _b;
    var propDefs = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        propDefs[_i - 2] = arguments[_i];
    }
    // (name: is name, func: is the func)
    // (name: is the func, func: is first prop or never defined)
    if (typeof name != "string") {
        if (func)
            propDefs.unshift(func);
        func = name;
        // @ts-ignore
        name = func.name;
    }
    propDefs.push((_a = {}, _a[NAMES] = name, _a));
    // @ts-ignore
    f[ST] = {};
    // @ts-ignore
    f[RUNTIME] = {};
    for (var _c = 0, propDefs_1 = propDefs; _c < propDefs_1.length; _c++) {
        var propObj = propDefs_1[_c];
        for (var _d = 0, _e = utilComposeProps(propObj); _d < _e.length; _d++) {
            var _f = _e[_d], key = _f[0], value = _f[1];
            f[RUNTIME][key] = (_b = Executables[key]) === null || _b === void 0 ? void 0 : _b.call(Executables, key, value, f);
        }
    }
    // @ts-ignore
    return f;
    function f(props) {
        if (props === void 0) { props = {}; }
        var originalErrors = props[ERRORS] || [];
        var declaredErrors = f[RUNTIME][ERRORS] || [];
        props[ERRORS] = originalErrors.concat(declaredErrors);
        var p1 = f[RUNTIME][DEFAULTS] ? Object.assign(Object.create(Object.getPrototypeOf(props)), f[RUNTIME][DEFAULTS], props) : props;
        try {
            // @ts-ignore
            var canthen = func(p1, p1);
            if (!canthen || typeof canthen != "object")
                return canthen;
            if ("then" in canthen)
                return asyncF(canthen, originalErrors);
            return canthen;
        }
        catch (error) {
            var type = error === null || error === void 0 ? void 0 : error.constructor;
            if (!type)
                throw error;
            if (!(ERRORS in type))
                throw error;
            if (originalErrors.includes(type))
                throw error;
            return error;
        }
    }
    // @ts-ignore
    function asyncF(promise, originalErrors) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1, type;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, promise];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 2:
                        error_1 = _a.sent();
                        type = error_1 === null || error_1 === void 0 ? void 0 : error_1.constructor;
                        if (!type)
                            throw error_1;
                        if (!(ERRORS in type))
                            throw error_1;
                        if (originalErrors.includes(type))
                            throw error_1;
                        return [2 /*return*/, error_1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
}
exports.fn = fn;
// #endregion
// #region Executable Helpers
/**
 * ### NamedThrow
 * A type safe throwable which does does **not** inherit from the Error class in JavaScript.
 * Does not have a `.stack` property.
 * @param kind Error code or title
 * @param props Error details or state needed to interpret the data
 * @example
 * ```ts
 * class DuplicateEmailErr extends NamedThrow("DuplicateEmail") {}
 *
 * const checkEmail = fn(props => {
 *
 *     if(...) {
 *          throw new DuplicateEmailErr()
 *     }
 *
 * }, DuplicateEmailErr)
 * ```
 */
function NamedThrow(kind, props) {
    Object.defineProperty(throwable, "name", { value: kind });
    Object.defineProperty(throwable, "as", { value: kind });
    Object.defineProperty(throwable, ERRORS, { value: false });
    Object.defineProperty(throwable, ST, { get: function () {
            var _a;
            return _a = {}, _a[ERRORS] = [this], _a;
        } });
    // @ts-ignore
    return throwable;
    // @ts-ignore
    function throwable(props) {
        // @ts-ignore
        this.name = kind;
        // @ts-ignore
        Object.assign(this, props);
    }
}
exports.NamedThrow = NamedThrow;
/**
 * ### NamedError
 * A type safe error which inherits from the Error class in JavaScript.
 * Contains the `.stack` property.
 * @param kind Error code or title
 * @param props Error details or state needed to interpret the data
 * @example
 * ```ts
 * class DuplicateEmailErr extends NamedThrow("DuplicateEmail") {}
 *
 * const checkEmail = fn(props => {
 *
 *     if(...) {
 *          throw new DuplicateEmailErr()
 *     }
 *
 * }, DuplicateEmailErr)
 * ```
 */
function NamedError(kind, props) {
    var Errorable = /** @class */ (function (_super) {
        __extends(Errorable, _super);
        function Errorable(props) {
            if (props === void 0) { props = {}; }
            var _this = _super.call(this) || this;
            Object.defineProperty(_this, "name", { value: kind });
            Object.defineProperty(_this, "as", { value: kind });
            Object.assign(_this, props);
            return _this;
        }
        Object.defineProperty(Errorable, (_a = ERRORS, ST), {
            get: function () {
                var _b;
                return _b = {}, _b[ERRORS] = [this], _b;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Errorable.prototype, "message", {
            get: function () {
                return "No message. Override the `.message` property using a getter";
            },
            enumerable: false,
            configurable: true
        });
        var _a;
        Errorable[_a] = true;
        return Errorable;
    }(Error));
    Object.defineProperty(Errorable, "name", { value: kind });
    // @ts-ignore
    return Errorable;
}
exports.NamedError = NamedError;
function Default(props) {
    var _a;
    return _a = {}, _a[DEFAULTS] = props, _a;
}
exports.Default = Default;
/**
 * ### TypeDefinition
 * A plugin that can define function decorators compiled when a function is defined by fn().
 * 1. Generates a JS Symbol for you to stash data on a function.
 * 2. Invokes your function when the decorated is part of a function's prop defs.
 * @param description The Symbol that will be registered.
 * @param constructor Your function to be invoked when a function uses your decorator.
 * @example
 * ```ts
 * const EXAMPLE = TypeDefinition("example-desc", (SYMBOL, value, userFunc) => {
 *    console.log("Param passed to decorator", value)
 *    userFunc[RUNTIME][SYMBOL] ||= {count: 1} // <- store your private data here
 *    userFunc[ST][SYMBOL] ||= {} // <- store composable data here
 *    userFunc[RUNTIME][SYMBOL].count += 1
 *    return userFunc[RUNTIME][SYMBOL]
 * })
 *
 * const testDecorator = fn(props => {
 *
 * }, {[EXAMPLE]: "Param passed!"})
 * ```
 */
function TypeDefinition(symbol, constructor) {
    if (symbol in Executables)
        throw new Error("TypeDefDuplicateSymbol: Symbol already registered to a handler once.");
    Executables[symbol] = constructor;
    return symbol;
}
exports.TypeDefinition = TypeDefinition;
// #endregion
// #region ST
exports.default = $;
var $;
(function ($) {
    var Declare;
    (function (Declare) {
        Declare.SErr = ERRORS;
    })(Declare = $.Declare || ($.Declare = {}));
})($ || ($ = {}));
// #endregion
// #region Private Utils
// {ST: {ERRORS: {}, NAMES: undefined}}, {NAMES: "Example"}, 
// {ERRORS: {}}, {ST: {DEFAULTS: {}, NAMES: undefined}}, {DEFAULTS: {}}
function utilComposeProps(unionPropErrorFnDefault) {
    var entries = [];
    // For the @/composable type, flatten the deps.
    if (ST in unionPropErrorFnDefault)
        unionPropErrorFnDefault = unionPropErrorFnDefault[ST];
    // console.log({unionPropErrorFnDefault})
    // Transform objects of dep data to symbol entries, 
    // skip normal properties, skip executables if they 
    // do not use storage, allow for duplicate executables
    for (var _i = 0, _a = Object.getOwnPropertySymbols(unionPropErrorFnDefault); _i < _a.length; _i++) {
        var key = _a[_i];
        if (unionPropErrorFnDefault[key])
            entries.push([key, unionPropErrorFnDefault[key]]);
    }
    return entries;
}
// #endregion
