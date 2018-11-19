#!/usr/bin/env node
import 'source-map-support/register';

import { join } from 'path';

import { App } from '../index';

const scriptName = process.argv[2];

if (!scriptName) {
    throw new Error('No script name');
}

const app = new App({});
(async () => {
    try {
        await require(join(process.cwd(), './dist/scripts/', scriptName)).default(app);
    } catch (err) {
        app.logger.error(err);
        await app.unload();
        return;
    }
    if (app.serviceMode) {
        app.logger.log('Service mode: on');

        let closing = false;
        async function term(code?: string) {
            if (closing) {
                return;
            }
            closing = true;
            try {
                if (code) {
                    app.logger.log(`Signal ${code} has been caught`);
                }
                await app.unload();
            } catch (err) {
                app.logger.error(err);
            }
            process.exit();
        }

        process
            .on('SIGINT', term.bind(null, 'SIGINT'))
            .on('SIGTERM', term.bind(null, 'SIGTERM'));
    } else {
        await app.unload();
    }
})();
