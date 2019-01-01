import { Context } from '..';

const symbol = Symbol();
export const _setTime = (ctx: Context, time = Date.now()) => {
    ctx[symbol] = time;
};
export const _time = (ctx: Context) => ctx[symbol] || Date.now();
