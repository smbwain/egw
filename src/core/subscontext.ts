export type DestroyHook = () => Promise<void>;
export interface Context {
    parent: Context;
    sub(): Context;
    destroy(): Promise<void>;
    addPreDestroyHook(hook: DestroyHook): void;
    addDestroyHook(hook: DestroyHook): void;
}

const runHooks = async (arr: DestroyHook[]) => {
    for (let i = arr.length - 1; i >= 0; i--) {
        await arr[i]();
    }
};

// tslint:disable-next-line:variable-name
const ContextConstructor = function() {
    this._subContexts = new Set();
    this._destroyHooks = [[], []];
    this.parent = null;
};
ContextConstructor.prototype = {
    _preventDestroyed() {
        if (this.hasOwnProperty('_destroyed')) {
            throw new Error('Context is already destroyed');
        }
    },
    sub() {
        this._preventDestroyed();
        const f = function() {
            ContextConstructor.call(this);
        };
        f.prototype = this;
        const ctx = new (f as any)();
        ctx.parent = this;
        this._subContexts.add(ctx);
        return ctx;
    },
    async destroy() {
        if (!this.hasOwnProperty('_destroyed')) {
            if (this.parent) {
                this.parent._subContexts.delete(this);
            }
            this._destroyed = (async () => {
                await runHooks(this._destroyHooks[0]);
                await Promise.all([...this._subContexts].map((context) => context.destroy()));
                await runHooks(this._destroyHooks[1]);
            })();
        }
        return await this._destroyed;
    },
    addPreDestroyHook(hook: DestroyHook) {
        this._preventDestroyed();
        this._destroyHooks[0].push(hook);
    },
    addDestroyHook(hook: DestroyHook) {
        this._preventDestroyed();
        this._destroyHooks[1].push(hook);
    },
};

export const createRootContext = () => new ContextConstructor();
