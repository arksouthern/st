/*
  ST - Error, dependency tracking lazy elimination.
  Type-safe errors, minimal runtime, effect tracking,
  dual calling convention, opt-in type-aware throwables,
  extensible decorators, composable throw declarations, 
  light dep injection, ZIO / Effect TS lite.
*/

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
const Executables: Record<symbol, (SYMBOL: symbol, value: any, userFunc: ((props: any) => any) & {[ST]: any, [RUNTIME]: any}) => void> = {};

// #region Executable Decorators

const ST = Symbol("@arksouthern/composable");
const RUNTIME = Symbol("@arksouthern/runtime");
const ERRORS = Symbol("@arksouthern/error");
const DEFAULTS = Symbol("@arksouthern/default");
const NAMES = Symbol("@arksouthern/name");

TypeDefinition(ERRORS, (SYMBOL, value, userFunc) => {
    // console.log({value})
    userFunc[RUNTIME][SYMBOL] ||= []
    const storage = userFunc[RUNTIME][SYMBOL]
    // Composable behavior is identical to runtime behavior
    userFunc[ST][SYMBOL] = storage
    storage.push(...value)
    return storage
});

TypeDefinition(DEFAULTS, (SYMBOL, value, userFunc) => {
  userFunc[RUNTIME][SYMBOL] ||= {}
  const storage = userFunc[RUNTIME][SYMBOL]
  // Composable behavior is identical to runtime behavior
  userFunc[ST][SYMBOL] = storage
  Object.assign(storage, value)
  return storage
});

TypeDefinition(NAMES, (SYMBOL, value, userFunc) => {
    // // DEBUG MODE
    // const st = eval(`({
    //     ["(st)${name}"](props) {......}
    // }["(st)${name}"])`)

    // // RELEASE MODE
    Object.defineProperty(userFunc, "name", { value: value || "(st)fallbackFunctionName" })
});

// #endregion

// #region Core

// Core is using
// - NoUndefinedComponent
// - NoEmptyErrors
// - FromTypes
// - IntersectRequires
// - GetErrors
// - Props

/**
 * ### ST
 * @see [Tutorial](https://github.com/arksouthern/st#overview)
 * @param func Your function definition, accepts a single props parameter.
 * @param propDefs The dep spread of your function. Dependencies or error cases.
 * @example
 * ```ts
 * const yourFunction = fn(props => {
 * 
 *		props.log("Running function...")
 * 
 *		return props.firstName + props.lastName
 * 
 * }, {firstName: ""}, LastName, Default({log: console.log}), NetworkErr)
 * ```
 */
export function fn<
  TypeSpread extends any[],
  Component extends $.NoUndefinedComponent<$.NoEmptyErrors<Props>>,
  Props = $.FromTypes<$.IntersectRequires<TypeSpread>>,
>(func: Component, ...propDefs: TypeSpread):
  [$.GetErrors<Props>[0]] extends [never] ?
  (props: { [K in keyof $.Props<Props>]: $.Props<Props>[K] }) =>
    ReturnType<Component> :
  <Err>(props: { [K in keyof $.Props<Props>]: $.Props<Props>[K] } & Err) =>
    | MayFail<$.GetErrors<Props>[0], Err>
    | ReturnType<Component>

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
export function fn<
  Name extends string,
  TypeSpread extends any[],
  Component extends $.NoUndefinedComponent<$.NoEmptyErrors<Props>>,
  Props = $.FromTypes<$.IntersectRequires<TypeSpread>>,
>(name: Name, func: Component, ...propDefs: TypeSpread):
  [$.GetErrors<Props>[0]] extends [never] ?
  <N = Name>(props: { [K in keyof $.Props<Props>]: $.Props<Props>[K] }) =>
    ReturnType<Component> :
  <N = Name, Err = {}>(props: { [K in keyof $.Props<Props>]: $.Props<Props>[K] } & Err) =>
    | MayFail<$.GetErrors<Props>[0], Err>
    | ReturnType<Component>

{
    // (name: is name, func: is the func)
    // (name: is the func, func: is first prop or never defined)
    if(typeof name != "string") {
        if(func) propDefs.unshift(func);

        func = name;
        // @ts-ignore
        name = func.name;
    }

    propDefs.push({[NAMES]: name});

    // @ts-ignore
    f[ST] = {};
    // @ts-ignore
    f[RUNTIME] = {};

    for (const propObj of propDefs)
    for (const [key, value] of utilComposeProps(propObj))
        f[RUNTIME][key] = Executables[key]?.(key, value, f as any);

    // @ts-ignore
    return f;

    function f(props: any = {}) {
        const originalErrors = props[ERRORS] || []
        const declaredErrors = f[RUNTIME][ERRORS] || []
		props[ERRORS] = originalErrors.concat(declaredErrors)
        const p1 = f[RUNTIME][DEFAULTS] ? Object.assign(
          Object.create(Object.getPrototypeOf(props)),
          f[RUNTIME][DEFAULTS], 
          props
        ) : props

        try {
            // @ts-ignore
            const canthen = func(p1, p1)
            if(!canthen || typeof canthen != "object") return canthen
            if("then" in canthen) return asyncF(canthen, originalErrors)
            return canthen
        } catch (error) {
          const type = error?.constructor
          if(!type) throw error
                if(!(ERRORS in type)) throw error
                if(originalErrors.includes(type)) throw error
                return error
            }
    }
    // @ts-ignore
    async function asyncF(promise, originalErrors) {
        try {
            const result = await promise
            return result
        } catch (error) {
            const type = error?.constructor
            if(!type) throw error
            if(!(ERRORS in type)) throw error
            if(originalErrors.includes(type)) throw error
            return error
        }
    }
}

type MayFail<T, U> = $.GetErrors<U> extends [infer U1] ? [T] extends [infer T1] ? T1 extends U1 ? never : T1 : never : never

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
export function NamedThrow<Kind extends string, Props = {}>(kind: Kind, props?: Props): {new(props: Props): {as: Kind, [ERRORS]: "object"} & Props} {
    Object.defineProperty(throwable, "name", { value: kind })
    Object.defineProperty(throwable, "as", { value: kind })
    Object.defineProperty(throwable, ERRORS, { value: false })
    Object.defineProperty(throwable, ST, { get() { return {[ERRORS]: [this]} } })

    // @ts-ignore
    return throwable

    // @ts-ignore
    function throwable(props) {
        // @ts-ignore
        this.name = kind
        // @ts-ignore
        Object.assign(this, props)
    }
}
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
export function NamedError<Kind extends string, Props = {}>(kind: Kind, props?: Props): {new(props: Props): {as: Kind, [ERRORS]: "exception"} & Props & Error} {
    class Errorable extends Error {
        constructor(props = {}) {
            super()
            Object.defineProperty(this, "name", { value: kind })
            Object.defineProperty(this, "as", { value: kind })
            Object.assign(this, props)
        }
        static [ERRORS] = true
		static get [ST]() { return {[ERRORS]: [this]} }
        get message() {
            return `No message. Override the \`.message\` property using a getter`
        }
    }
    
    Object.defineProperty(Errorable, "name", { value: kind })

    // @ts-ignore
    return Errorable
}

export function Default<Props = {}>(props: Props): {[DEFAULTS]: Props} {
  return {[DEFAULTS]: props}
}

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
export function TypeDefinition<V extends typeof Executables[keyof typeof Executables]>(symbol: symbol, constructor: V): symbol {
  if (symbol in Executables)
    throw new Error(`TypeDefDuplicateSymbol: Symbol already registered to a handler once.`)
  Executables[symbol] = constructor
  return symbol
}
// #endregion

// #region ST
export default $

namespace $ {
  // @ts-expect-error
  export type IntersectRequires<T> = $.Util.UnionToIntersection<$.Fn.Index<T>>
  // @ts-expect-error
  export type NoEmptyErrors<T> = [keyof T[$.Throw]] extends [never] ? Omit<T, $.Throw> : T
  export type NoUndefinedComponent<T> = (props: { [K in keyof T]-?: Exclude<T[K], undefined> }) => unknown
  export type GetErrors<CProps> = CProps extends { [ERRORS]: infer E }
    ? [Exclude<any, E>] extends [never]
    ? [never]
    : [E]
    : [never]
  export type Props<T> = $.Util.UnionToIntersection<{
    [K in Exclude<keyof T, $.Throw>]:
    [Extract<T[K], undefined>] extends [never] ?
    { [K1 in K]: T[K1] } :
    { [K1 in K]?: Exclude<T[K1], undefined> }
  }[Exclude<keyof T, $.Throw>]>
  export type FromTypes<T> = 
  // @ts-expect-error
  & (T extends { [ERRORS]: infer X } ? { [ERRORS]: InstanceType<X[keyof X]> } : {})
  & (T extends { [DEFAULTS]: infer X } ? { [K in keyof X]?: X[K] } : {})
  & ({ [K in Exclude<keyof T, typeof ERRORS | typeof DEFAULTS | keyof (T extends { [DEFAULTS]: infer D } ? D : {})>]: T[K] })


  export type Throw = typeof $.Declare.SErr

  export namespace Fn {
    export type Index<T extends any[]> = { [K in keyof T]: PComposable<T[K]> }[number]
    // @ts-expect-error
    export type Error<E> = E extends { as: infer S } ? { [ERRORS]: { [K in S]: { new(...a: any): E } } } : {}
    export type PComposable<T> =
      T extends { new(...a: any): { as: infer S } } ?
      // @ts-expect-error
      { [ERRORS]: { [K in S]: T } } :
      T extends (p: infer P) => infer R ?
      [Extract<R, { as: string, [ERRORS]: any }>] extends [never] ?
      P :
      P & Error<Extract<R, { as: string, [ERRORS]: any }>> :
      T
  }

  export namespace Util {
    export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never
    export type LiteralLoss<T> = T extends number ? number : T extends string ? string : T extends boolean ? boolean : T
  }

  export namespace Declare {
    export const SErr: typeof ERRORS = ERRORS;
  }
}
// #endregion

// #region Private Utils
// {ST: {ERRORS: {}, NAMES: undefined}}, {NAMES: "Example"}, 
// {ERRORS: {}}, {ST: {DEFAULTS: {}, NAMES: undefined}}, {DEFAULTS: {}}
function utilComposeProps(unionPropErrorFnDefault: any) {
    const entries = [] as [symbol, any][];

    // For the @/composable type, flatten the deps.
    if(ST in unionPropErrorFnDefault) 
        unionPropErrorFnDefault = unionPropErrorFnDefault[ST];
    
    // console.log({unionPropErrorFnDefault})
    
    // Transform objects of dep data to symbol entries, 
    // skip normal properties, skip executables if they 
    // do not use storage, allow for duplicate executables
    for (const key of Object.getOwnPropertySymbols(unionPropErrorFnDefault))
        if(unionPropErrorFnDefault[key])
            entries.push([key, unionPropErrorFnDefault[key]]);
    
    return entries;
}
// #endregion