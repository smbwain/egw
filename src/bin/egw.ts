#!/usr/bin/env node
import 'source-map-support/register';

import { join } from 'path';

import { createRootContext } from '../index';
import { _logger } from '../helpers/logger';

const scriptName = process.argv[2];
let functionName = process.argv[3];

if (!scriptName) {
    throw new Error('No script name');
}

const ctx = createRootContext();
(async () => {
    try {
        const mods = require(join(process.cwd(), scriptName));
        if (!functionName) {
            if (Object.keys(mods).length === 1) {
                functionName = Object.keys(mods)[0];
            } else {
                throw new Error('Specify name of exported method you want to run');
            }
            await mods[functionName](ctx);
        }
    } catch (err) {
        _logger(ctx).error(err);
    } finally {
        await ctx.destroy();
    }
})();
