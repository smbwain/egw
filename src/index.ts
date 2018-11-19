import { Level as LoggerLevel, Logger, logger as createLogger } from 'msv-logger';

import { ConfigTree, copyConfig, fillConfig, fillConfigEnv } from './config';

export {ConfigTree};

export type SyncOrAsync<T> = T | Promise<T>;

export interface Module<Result, Config extends ConfigTree> {
    (app: App, instanceName?: string): Promise<Result>;
    defaultName: string;
    defaultConfig: Config;
    handler: ModuleInitHandler<Result, Config>;
}
export type ModuleInitHandler<Result, Config> = (options: {
    app: App;
    config: Config;
    unload: (handler: UnloadHandler) => void;
    logger: Logger;
}) => SyncOrAsync<Result>;

export type UnloadHandler = () => SyncOrAsync<void>;

export function mod<Result>(
    init: ModuleInitHandler<Result, {}>,
): Module<Result, {}>;
export function mod<Result>(
    name: string,
    init: ModuleInitHandler<Result, {}>,
): Module<Result, {}>;
export function mod<Result, Config extends ConfigTree>(
    name: string,
    config: Config,
    init: ModuleInitHandler<Result, Config>,
): Module<Result, Config>;
export function mod<Result, Config extends ConfigTree = {}>(...args): Module<Result, Config> {
    const name: string = typeof args[0] === 'string' ? args[0] : '';
    const config: Config = typeof args[1] === 'object' ? args[1] : {};
    const init: ModuleInitHandler<Result, Config> = typeof args[0] === 'function'
        ? args[0]
        : args[1] === 'function' ? args[1] : args[2];
    const module = ((app, instanceName: string = '') => {
        return app._initModule(module, instanceName);
    }) as Module<Result, Config>;
    module.defaultName = name;
    module.defaultConfig = config;
    module.handler = init;
    return module;
}

export type Loader<V> = () => Promise<V>;
export function loader<V>(handler: () => Promise<V>): Loader<V> {
    let cache: Promise<V>;
    return () => {
        if (cache === undefined) {
            cache = handler();
        }
        return cache;
    };
}

export type MultiLoader<K, V> = (key: K) => Promise<V>;
export function multiLoader<K, V>(handler: (key: K) => Promise<V>): MultiLoader<K, V> {
    const cache: Map<K, Promise<V>> = new Map();
    return (k: K) => {
        if (!cache.has(k)) {
            cache.set(k, handler(k));
        }
        return cache.get(k);
    };
}

export class App {
    public modulesCache: Map<
        Module<any, any>,
        {
            [name: string]: Promise<any>;
        }
    > = new Map();
    public config: ConfigTree;

    public mainLogger: Logger;
    public logger: Logger;
    public serviceMode: boolean = false;

    private env: NodeJS.ProcessEnv;
    private envPrefix: string;

    private unloadHandlers: UnloadHandler[] = [];

    constructor({
        env = process.env,
        envPrefix = 'APP',
        config = {},
        logger,
    }: {
        env?: NodeJS.ProcessEnv;
        envPrefix?: string;
        config?: ConfigTree,
        logger?: Logger,
    }) {
        this.env = env;
        this.envPrefix = envPrefix;
        this.config = config;

        const appConfig = this._getConfig({logLevel: 'debug'}, 'app');
        this.mainLogger = logger || createLogger({
            level: appConfig.logLevel as keyof typeof LoggerLevel,
        });
        this.logger = this.mainLogger.sub({tag: 'app'});
    }

    public _getConfig<Config extends ConfigTree>(defaultConfig: Config, configName: string): Config {
        const config = copyConfig(defaultConfig);
        if (typeof this.config.common === 'object') {
            fillConfig(config, this.config.common);
        }
        fillConfigEnv(config, `${this.envPrefix}_COMMON_`, this.env);
        if (typeof this.config[configName] === 'object') {
            fillConfig(config, this.config[configName] as ConfigTree);
        }
        fillConfigEnv(config, `${this.envPrefix}_${configName}_`, this.env);
        return config;
    }

    public _getModuleConfig<Config extends ConfigTree>(module: Module<any, Config>, name: string): Config {
        return this._getConfig(module.defaultConfig, name || module.defaultName);
    }

    public _initModule<Result, Config extends ConfigTree>(
        module: Module<Result, Config>,
        name: string = '',
    ): Promise<Result> {
        if (!this.modulesCache.has(module)) {
            this.modulesCache.set(module, {});
        }
        const instances = this.modulesCache.get(module);
        if (!instances[name]) {
            instances[name] = Promise.resolve(module.handler({
                app: this,
                config: this._getModuleConfig(module, name),
                unload: (handler: UnloadHandler) => {
                    this.addUnloadHandler(handler);
                },
                logger: this._getModuleLogger(module, name),
            }));
        }
        return instances[name];
    }

    public _getModuleLogger(module: Module<any, any>, name: string): Logger {
        return this.mainLogger.sub({tag: name || module.defaultName});
    }

    public switchToServiceMode() {
        this.serviceMode = true;
    }

    public addUnloadHandler(uh: UnloadHandler) {
        this.unloadHandlers.push(uh);
    }

    public async unload() {
        for (const unloadHandler of this.unloadHandlers.reverse()) {
            await unloadHandler();
        }
    }
}
