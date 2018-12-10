import { Context } from '../subscontext';
import { _logger } from './helpers/logger';

export const contextExpressMiddleware = (
    ctx: Context,
    applier: (req, ctx) => void = (req, ctx) => {
        req.ctx = ctx;
    },
) => {
    const logger = _logger(ctx);
    return (req, res, next) => {
        const subContext = ctx.sub();
        applier(req, ctx);
        req.on('end', () => {
            subContext.destroy().catch((err) => {
                logger.error('Error on destroying context on request end', err);
            });
        });
        next();
    };
};