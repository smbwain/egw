
import {mergeConfig, fillConfigEnv, fillConfig} from '../config/index';

describe('config core', () => {
    it('should merge config', () => {
        const target = {
            a: '111',
            b: '222',
            c: {
                d: '333',
                e: '444',
            },
            f: {
                g: '555',
            }
        };
        mergeConfig(target, {
            a: '666',
            c: {
                e: '777',
                i: '888',
            },
            j: {
                k: '999'
            },
            l: '000',
        });
        expect(target).toMatchSnapshot();
    });

    it('should fill config', () => {
        const target = {
            a: '111',
            b: '222',
            c: {
                d: '333',
                e: '444',
            }
        };
        fillConfig(target, {
            a: '555',
            c: {
                d: '666',
                f: '777',
            },
            g: 'uuu',
        });
        expect(target).toMatchSnapshot();
    });

    it('should fill config env', () => {
        const target = {
            a: '111',
            b: '222',
            c: {
                d: '333',
                e: '444',
            },
        };
        fillConfigEnv(target, 'APP_', {
            APP_A: '555',
            APP_C_D: '666',
            APP_C_F: '777',
            APP_G: '888',
            B: '999',
        });
        expect(target).toMatchSnapshot();
    });
});