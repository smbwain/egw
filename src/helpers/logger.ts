import { Logger, logger as createLogger, Params } from 'msv-logger';
import { Context } from '..';

const symbol = Symbol();

export const _setLogger = (ctx: Context, params: Params) => {
    const parentLogger: Logger = ctx.parent && ctx.parent[symbol];
    ctx[symbol] = parentLogger ? parentLogger.sub(params) : createLogger(params);
};

export const _logger = (ctx: Context): Logger => {
    return ctx[symbol] || createLogger({});
};
