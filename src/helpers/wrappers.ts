import { Context } from '../core/subscontext';

export const data = <T>(
    defaultValue?: T,
): [
    (ctx: Context) => T,
    (ctx: Context, value: T | ((prevValue?: T) => T)) => T
] => {
    const symbol = Symbol();
    return [
        (ctx) => {
            if (symbol in ctx) {
                return ctx[symbol];
            }
            if (defaultValue === undefined) {
                throw new Error('Data wasn\'t initialized');
            }
            return defaultValue;
        },
        (ctx, value) => {
            if (typeof value === 'function') {
                value = (value as (parentValue?: T) => T)((symbol in ctx) ? ctx[symbol] : defaultValue);
            }
            ctx[symbol] = value;
            return value as T;
        },
    ];
};

// export const getSet = <T extends object, GetArgs extends any[], SetArgs extends any[]>(
//     getter: (ctx: Context, symbol: symbol, ...getArgs: GetArgs) => T,
//     setter: (ctx: Context, symbol: symbol, ...setArgs: SetArgs) => T,
// ) : [
//     (ctx: Context, ...getArgs: GetArgs) => T,
//     (ctx: Context, ...setArgs: SetArgs) => T
// ] => {
//     const symbol = Symbol();
//     return [
//         (ctx, ...args) => getter(ctx, symbol, ...args),
//         (ctx, ...args) => setter(ctx, symbol, ...args),
//     ];
// };

export const dataInit = <T extends object, A extends any[]>(
    handler: (ctx: Context, ...args: A) => T,
    defaultValue?: T,
): [
    (ctx: Context) => T,
    (ctx: Context, ...args: A) => T
] => {
    const [_get, _set] = data<T>(defaultValue);
    return [
        _get,
        (ctx, ...args) => _set(ctx, handler(ctx, ...args)),
    ];
};

export const dataAsyncInit = <T extends object, A extends any[]>(
    handler: (ctx: Context, ...args: A) => Promise<T>,
    defaultValue?: T,
): [
    (ctx: Context) => T,
    (ctx: Context, ...args: A) => Promise<T>
] => {
    const [_get, _set] = data<T>(defaultValue);
    return [
        _get,
        async (ctx, ...args) => _set(ctx, await handler(ctx, ...args)),
    ];
};

export const singleton = <T>(handler: (ctx: Context) => T): ((ctx: Context) => T) => {
    const symbol = Symbol();
    return (ctx) => (symbol in ctx) ? ctx[symbol] : (ctx[symbol] = handler(ctx));
};
