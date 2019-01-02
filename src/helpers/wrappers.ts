import { Context } from '../core/subscontext';

export const data = <T>(defaultValue?: T) => {
    const symbol = Symbol();
    return {
        _set: (ctx: Context, value: T): T => ctx[symbol] = value,
        _get: (ctx: Context): T => {
            if (symbol in ctx) {
                return ctx[symbol];
            }
            if (defaultValue === undefined) {
                throw new Error('Data wasn\'t initialized');
            }
            return defaultValue;
        },
    };
};

export const dataInit = <T, A extends any[]>(
    handler: (ctx: Context, ...args: A) => T,
    defaultValue?: T,
) => {
    const {_set, _get} = data<T>(defaultValue);
    return {
        _get,
        _init: (ctx: Context, ...args: A): T => {
            return _set(ctx, handler(ctx, ...args));
        },
    };
};

export const dataAsyncInit = <T, A extends any[]>(
    handler: (ctx: Context, ...args: A) => Promise<T>,
    defaultValue?: T,
) => {
    const {_set, _get} = data<T>(defaultValue);
    return {
        _get,
        _init: async (ctx: Context, ...args: A): Promise<T> => {
            return _set(ctx, await handler(ctx, ...args));
        },
    };
};

export const mod = <T>(handler: (ctx: Context) => T): ((ctx: Context) => T) => {
    const symbol = Symbol();
    return (ctx) => (symbol in ctx) ? ctx[symbol] : (ctx[symbol] = handler(ctx));
};
