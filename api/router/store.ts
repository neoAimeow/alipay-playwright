import { t } from "../context";
import { z } from "zod";
import { CacheManager } from "../../utils/cache";
import { TRPCError } from "@trpc/server";

export const storeRouter = t.router({
  getStore: t.procedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      // const data = await CacheManager.getInstance(ctx.prisma).getStore(
      //   input.key
      // );
      // if (!data) {
      //   throw new TRPCError({
      //     code: "NOT_FOUND",
      //     message: "取值为空",
      //   });
      // }

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

  deleteMany: t.procedure
    .input(z.object({ keys: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      return CacheManager.getInstance(ctx.prisma).deleteMany(input.keys);
    }),
});
