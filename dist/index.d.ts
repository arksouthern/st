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
declare const Executables: Record<symbol, (SYMBOL: symbol, value: any, userFunc: ((props: any) => any) & {
    [ST]: any;
    [RUNTIME]: any;
}) => void>;
declare const ST: unique symbol;
declare const RUNTIME: unique symbol;
declare const ERRORS: unique symbol;
declare const DEFAULTS: unique symbol;
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
export declare function fn<TypeSpread extends any[], Component extends $.NoUndefinedComponent<$.NoEmptyErrors<Props>>, Props = $.FromTypes<$.IntersectRequires<TypeSpread>>>(func: Component, ...propDefs: TypeSpread): [
    $.GetErrors<Props>[0]
] extends [never] ? (props: {
    [K in keyof $.Props<Props>]: $.Props<Props>[K];
}) => ReturnType<Component> : <Err>(props: {
    [K in keyof $.Props<Props>]: $.Props<Props>[K];
} & Err) => MayFail<$.GetErrors<Props>[0], Err> | ReturnType<Component>;
type MayFail<T, U> = $.GetErrors<U> extends [infer U1] ? [T] extends [infer T1] ? T1 extends U1 ? never : T1 : never : never;
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
export declare function NamedThrow<Kind extends string, Props = {}>(kind: Kind, props?: Props): {
    new (props: Props): {
        as: Kind;
        [ERRORS]: "object";
    } & Props;
};
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
export declare function NamedError<Kind extends string, Props = {}>(kind: Kind, props?: Props): {
    new (props: Props): {
        as: Kind;
        [ERRORS]: "exception";
    } & Props & Error;
};
export declare function Default<Props = {}>(props: Props): {
    [DEFAULTS]: Props;
};
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
export declare function TypeDefinition<V extends typeof Executables[keyof typeof Executables]>(symbol: symbol, constructor: V): symbol;
export default $;
declare namespace $ {
    type IntersectRequires<T> = $.Util.UnionToIntersection<$.Fn.Index<T>>;
    type NoEmptyErrors<T> = [keyof T[$.Throw]] extends [never] ? Omit<T, $.Throw> : T;
    type NoUndefinedComponent<T> = (props: {
        [K in keyof T]-?: Exclude<T[K], undefined>;
    }) => unknown;
    type GetErrors<CProps> = CProps extends {
        [ERRORS]: infer E;
    } ? [Exclude<any, E>] extends [never] ? [never] : [E] : [never];
    type Props<T> = $.Util.UnionToIntersection<{
        [K in Exclude<keyof T, $.Throw>]: [
            Extract<T[K], undefined>
        ] extends [never] ? {
            [K1 in K]: T[K1];
        } : {
            [K1 in K]?: Exclude<T[K1], undefined>;
        };
    }[Exclude<keyof T, $.Throw>]>;
    type FromTypes<T> = (T extends {
        [ERRORS]: infer X;
    } ? {
        [ERRORS]: InstanceType<X[keyof X]>;
    } : {}) & (T extends {
        [DEFAULTS]: infer X;
    } ? {
        [K in keyof X]?: X[K];
    } : {}) & ({
        [K in Exclude<keyof T, typeof ERRORS | typeof DEFAULTS | keyof (T extends {
            [DEFAULTS]: infer D;
        } ? D : {})>]: T[K];
    });
    type Throw = typeof $.Declare.SErr;
    namespace Fn {
        type Index<T extends any[]> = {
            [K in keyof T]: PComposable<T[K]>;
        }[number];
        type Error<E> = E extends {
            as: infer S;
        } ? {
            [ERRORS]: {
                [K in S]: {
                    new (...a: any): E;
                };
            };
        } : {};
        type PComposable<T> = T extends {
            new (...a: any): {
                as: infer S;
            };
        } ? {
            [ERRORS]: {
                [K in S]: T;
            };
        } : T extends (p: infer P) => infer R ? [
            Extract<R, {
                as: string;
                [ERRORS]: any;
            }>
        ] extends [never] ? P : P & Error<Extract<R, {
            as: string;
            [ERRORS]: any;
        }>> : T;
    }
    namespace Util {
        type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;
        type LiteralLoss<T> = T extends number ? number : T extends string ? string : T extends boolean ? boolean : T;
    }
    namespace Declare {
        const SErr: typeof ERRORS;
    }
}
