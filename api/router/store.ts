import { t } from "../context";
import { z } from "zod";
import { CacheManager } from "../../utils/cache";

export const storeRouter = t.router({
  getStore: t.procedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      return CacheManager.getInstance(ctx.prisma).getStore(input.key);
    }),
  setStore: t.procedure
    .input(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CacheManager.getInstance(ctx.prisma).setStore(
        input.key,
        input.value
      );
    }),

  delete: t.procedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return CacheManager.getInstance(ctx.prisma).delete(input.key);
    }),
});
