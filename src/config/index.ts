
export interface ConfigTree {
    [name: string]: string | ConfigTree;
}

export type PartialConfigTree<Config extends ConfigTree> = {
    [K in keyof Config]?: Config[K] extends ConfigTree
        ? PartialConfigTree<Config[K]>
        : string
};

export function mergeConfig(
    target: ConfigTree,
    source: ConfigTree,
) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (key in target) {
                if (typeof source[key] !== typeof target[key]) {
                    throw new Error(`Config type mismatch on property "${key}"`);
                }
                if (typeof source[key] === 'object') {
                    mergeConfig(target[key] as ConfigTree, source[key] as ConfigTree);
                    continue;
                }
            }
            target[key] = source[key];
        }
    }
}

export function copyConfig<Config extends ConfigTree>(source: Config): Config {
    const target = {};
    mergeConfig(target, source);
    return target as Config;
}

export const fillConfig = (target: ConfigTree, source: ConfigTree) => {
    for (const key in target) {
        if (typeof target[key] === 'string') {
            if (typeof source[key] === 'string') {
                target[key] = source[key];
            }
        } else {
            if (typeof source[key] === 'object') {
                fillConfig(target[key] as ConfigTree, source[key] as ConfigTree);
            }
        }
    }
};

export const fillConfigEnv = (
    target: ConfigTree,
    prefix: string,
    env: NodeJS.ProcessEnv = process.env,
) => {
    for (const key in target) {
        if (typeof target[key] === 'string') {
            const envValue = env[(prefix + key).toUpperCase()];
            if (envValue !== undefined) {
                target[key] = envValue;
            }
        } else {
            fillConfigEnv(target[key] as ConfigTree, `${prefix}${key}_`, env);
        }
    }
};
