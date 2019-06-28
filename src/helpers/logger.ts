import { Logger, logger as createLogger, Params } from 'msv-logger';

import {Context} from '../core/subscontext';
import {data} from './wrappers';

const [_logger, _set] = data<Logger>(createLogger({}));

export {
    _logger,
};
export const _setLogger = (ctx: Context, params: Params) => _set(ctx, (prevLogger) => prevLogger.sub(params));
