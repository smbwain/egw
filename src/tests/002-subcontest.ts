
import { Context, createRootContext, singleton } from '..';

describe('subcontest', () => {
    describe('mod', () => {
        it('init/destroy on context and subcontext', async () => {
            const initFn = jest.fn();
            const deinitFn = jest.fn();
            const _mod = singleton((context: Context) => {
                initFn();
                context.addDestroyHook(deinitFn);
                return 5;
            });

            const ctx = createRootContext();
            expect( _mod(ctx) ).toBe(5);
            expect(initFn.mock.calls.length).toBe(1);
            expect(deinitFn.mock.calls.length).toBe(0);

            expect( _mod(ctx) ).toBe(5);
            expect(initFn.mock.calls.length).toBe(1);
            expect(deinitFn.mock.calls.length).toBe(0);

            const subctx = ctx.sub();
            expect( _mod(subctx) ).toBe(5);
            expect(initFn.mock.calls.length).toBe(1);
            expect(deinitFn.mock.calls.length).toBe(0);

            await subctx.destroy();
            expect(initFn.mock.calls.length).toBe(1);
            expect(deinitFn.mock.calls.length).toBe(0);

            await ctx.destroy();
            expect(initFn.mock.calls.length).toBe(1);
            expect(deinitFn.mock.calls.length).toBe(1);
        });
        it('init/destroy on subcontext', async () => {
            const initFn = jest.fn();
            const deinitFn = jest.fn();
            const _mod = singleton((context: Context) => {
                initFn();
                context.addDestroyHook(deinitFn);
                return 5;
            });

            const ctx = createRootContext();

            const subctx1 = ctx.sub();
            expect( _mod(subctx1) ).toBe(5);
            expect(initFn.mock.calls.length).toBe(1);
            expect(deinitFn.mock.calls.length).toBe(0);

            await subctx1.destroy();
            expect(initFn.mock.calls.length).toBe(1);
            expect(deinitFn.mock.calls.length).toBe(1);

            const subctx2 = ctx.sub();
            expect( _mod(subctx2) ).toBe(5);
            expect(initFn.mock.calls.length).toBe(2);
            expect(deinitFn.mock.calls.length).toBe(1);

            await ctx.destroy();
            expect(initFn.mock.calls.length).toBe(2);
            expect(deinitFn.mock.calls.length).toBe(2);
        });
    });
});
