import {_logger} from './logger';
import {mod} from './wrappers';

export const _runAsService = mod((ctx) => {
    const logger = _logger(ctx).sub({tag: 'service'});
    const destroy = ctx.destroy.bind(ctx);
    const interrupted = new Promise((resolve) => {
        process
            .on('SIGINT', resolve)
            .on('SIGTERM', resolve);
    });
    ctx.destroy = async () => {
        await interrupted;
        logger.log(`interrupted`);
        await destroy();
        logger.debug(`destroyed`);
    };
    logger.log('initialized');
});
