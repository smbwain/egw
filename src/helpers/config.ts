import { ConfigTree, copyConfig, fillConfig, fillConfigEnv, mergeConfig } from '../config/index';
import { Context } from '../../subscontext/index';

const symbol = Symbol();

export const _setConfig = (ctx: Context, configPart: ConfigTree) => {
    const config = ctx.hasOwnProperty(symbol) ? ctx[symbol] : symbol in ctx ? copyConfig(ctx[symbol]) : {};
    mergeConfig(config, configPart);
    ctx[symbol] = config;
};

export const _config = <C extends ConfigTree>(ctx: Context, defaultConfig: C): C => {
    const config = copyConfig(defaultConfig);
    if (ctx[symbol]) {
        fillConfig(config, ctx[symbol]);
        if (typeof ctx[symbol].envPrefix === 'string') {
            fillConfigEnv(config, ctx[symbol].envPrefix);
        }
    }
    return config;
};
