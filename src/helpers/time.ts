import { Context } from '../core/subscontext';
import {data} from './wrappers';

const [_get, _set] = data(0);
export const _time = (ctx: Context) => _get(ctx) || Date.now();
export const _setTime = (ctx: Context, time = Date.now()) => _set(ctx, time);
