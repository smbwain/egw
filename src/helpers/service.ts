import {_logger} from './logger';
import {singleton} from './wrappers';

export const _runAsService = singleton((ctx) => {
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
