const runHooks = async (arr) => {
    for (let i = arr.length - 1; i >= 0; i--) {
        await arr[i]();
    }
};

const ContextConstructor = function () {
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
        const f = function () {
            ContextConstructor.call(this);
        };
        f.prototype = this;
        const ctx = new f();
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
                await Promise.all([...this._subContexts].map(context => context.destroy()));
                await runHooks(this._destroyHooks[1]);
            })();
        }
        return await this._destroyed;
    },
    addPreDestroyHook(hook) {
        this._preventDestroyed();
        this._destroyHooks[0].push(hook);
    },
    addDestroyHook(hook) {
        this._preventDestroyed();
        this._destroyHooks[1].push(hook);
    },
};

const createRootContext = () => new ContextConstructor();

const mod = handler => {
    const symbol = Symbol();
    return (ctx, isolate) => (isolate ? ctx.hasOwnProperty(symbol) : symbol in ctx)
        ? ctx[symbol]
        : (ctx[symbol] = handler(ctx));
};

const data = (defaultValue) => {
    const symbol = Symbol();
    return {
        _set: (ctx, value) => ctx[symbol] = value,
        _get: (ctx) => symbol in ctx ? ctx[symbol] : defaultValue,
    };
};

const dataInit = (init) => {
    const symbol = Symbol();
    return {
        _init: (ctx, ...args) => {
            let wrapper;
            wrapper = {
                promise: init(ctx, ...args).then((res) => {
                    wrapper.data = res;
                    return res;
                }),
            };
            ctx[symbol] = wrapper;
            return wrapper.promise;
        },
        _get: (ctx) => ctx[symbol].data,
        _wait: (ctx) => ctx[symbol].promise,
    };
};

module.exports = {
    createRootContext,
    mod,
    data,
    dataInit,
};