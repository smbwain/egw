import { Config } from 'msv-config';
import { Level as LoggerLevel, Logger, logger as createLogger } from 'msv-logger';

export type SyncOrAsync<T> = T | Promise<T>;
export type UnloadHandler = () => SyncOrAsync<void>;
export interface AppHelpers {
    unload: (handler: UnloadHandler) => void;
    config: Config;
    logger: Logger;
    instanceName: string;
}
export type ModuleInit<V> = (app: App, instanceName?: string) => Promise<V>;
export type ModuleDefinition<V> = (app: App, helpers: AppHelpers) => SyncOrAsync<V>;

export function loader<V>(handler: () => Promise<V>): () => Promise<V> {
    let cache: Promise<V>;
    return () => {
        if (cache === undefined) {
            cache = handler();
        }
        return cache;
    };
}

export function multiLoader<K, V>(handler: (key: K) => Promise<V>): (k: K) => Promise<V> {
    let cache: Map<K, Promise<V>> = new Map();
    return (k: K) => {
        if (!cache.has(k)) {
            cache.set(k, handler(k));
        }
        return cache.get(k);
    };
}

export function appModule<V>(
    domain: string,
    moduleDefinition: ModuleDefinition<V>,
): ModuleInit<V> {
    return (app: App, instanceName?: string) => {
        if (!app.moduleCache.has(moduleDefinition)) {
            app.moduleCache.set(moduleDefinition, multiLoader(
            (instanceName: string): Promise<V> => {
                return Promise.resolve(moduleDefinition(app, {
                    unload(handler: UnloadHandler) {
                        app.addUnloadHandler(handler);
                    },
                    config: app.getDomainConfig(domain),
                    logger: app.getDomainLogger(domain),
                    instanceName,
                }));
            }));
        }
        return app.moduleCache.get(moduleDefinition)(instanceName || '');
    };
}

export class App {
    public moduleCache: Map<ModuleDefinition<any>, (instanceName: string) => Promise<any>> = new Map();
    public config: Config;
    public mainConfig: Config;
    public commonConfig: Config;
    public mainLogger: Logger;
    public logger: Logger;
    public serviceMode: boolean = false;
    public moduleConfigs: {
        [domain: string]: Config;
    } = {};

    private unloadHandlers: UnloadHandler[] = [];

    constructor({config, logger}: {config: Config, logger?: Logger}) {
        this.mainConfig = config;
        this.commonConfig = config.sub('common');
        this.config = this.commonConfig.merge(config.sub('app'));
        logger = logger || createLogger({
            level: this.config.get('logLevel', 'log') as keyof typeof LoggerLevel,
        });
        this.mainLogger = logger;
        this.logger = logger.sub({tag: 'app'});
    }
    public async init(): Promise<void> {
        //
    }
    public getDomainConfig(domain: string): Config {
        if (!this.moduleConfigs[domain]) {
            this.moduleConfigs[domain] = this.commonConfig.merge(this.mainConfig.sub(domain))
        }
        return this.moduleConfigs[domain];
    }

    public getDomainLogger(domain: string): Logger {
        return this.mainLogger.sub({tag: domain});
    }

    public switchToServiceMode() {
        this.serviceMode = true;
    }

    public addUnloadHandler(uh: UnloadHandler) {
        this.unloadHandlers.push(uh);
    }

    public async unload() {
        for (const uh of this.unloadHandlers.reverse()) {
            await uh();
        }
    }
}
