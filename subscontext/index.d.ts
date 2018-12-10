export interface Context {
    parent: Context;
    sub(): Context;
    destroy(): Promise<void>;
    addPreDestroyHook(hook: () => Promise<void>): void;
    addDestroyHook(hook: () => Promise<void>): void;
}

export function createRootContext(): Context;
export function mod<T>(module: (ctx: Context) => T): (ctx: Context) => T;
export function data<T>(defaultValue: T): {
    _get: (ctx: Context) => T;
    _set: (ctx: Context, value: T) => void;
}
export function dataInit<T, Args extends Array<any>>(init: (ctx: Context, ...args: Args) => Promise<T>): {
    _init: (ctx: Context, ...args: Args) => Promise<T>;
    _get: (ctx: Context) => T;
    _wait: (ctx: Context) => Promise<T>;
}

// export type TypeOfMod<M> = M extends ((ctx: Context) => infer T) ? T : void;
