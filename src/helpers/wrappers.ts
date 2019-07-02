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

export const syncInitializer = <T extends object, A extends any[]>(
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

export const asyncInitializer = <T extends object, A extends any[]>(
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
