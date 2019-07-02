import { Context } from '../core/subscontext';
import { _logger, _setTime } from './index';

export const contextExpressMiddleware = (
    ctx: Context,
    setter: (req, ctx) => void = (req, context) => {
        req.ctx = context;
    },
) => {
    const logger = _logger(ctx);
    return (req, res, next) => {
        const subContext = ctx.sub();
        _setTime(subContext);
        setter(req, subContext);
        req.on('end', () => {
            subContext.destroy().catch((err) => {
                logger.error('Error on destroying context on request end', err);
            });
        });
        next();
    };
};
