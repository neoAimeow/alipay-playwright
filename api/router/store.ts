type supportType = string | number | boolean | Record<string, unknown>;

import { t } from "../context";
import { z } from "zod";

export const storeRouter = t.router({
  getStore: t.procedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const cache = await ctx.prisma.cache.findFirst({
        where: { key: input.key },
      });
      if (cache) {
        const data = JSON.parse(cache.value) as { obj: supportType };
        return data.obj;
      } else {
        return null;
      }
    }),
  setStore: t.procedure
    .input(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const insertStr: string = JSON.stringify({
        obj: input.value as supportType,
      });

      const data = await ctx.prisma.cache.findFirst({
        where: { key: input.key },
      });

      if (data) {
        await ctx.prisma.cache.update({
          data: { value: insertStr },
          where: { id: data.id },
        });
      } else {
        await ctx.prisma.cache.create({
          data: { key: input.key, value: insertStr },
        });
      }
      return true;
    }),
  delete: t.procedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.prisma.cache.findFirst({
        where: { key: input.key },
      });
      if (data) {
        await ctx.prisma.cache.delete({
          where: { id: data.id },
        });
      }

      return true;
    }),
});
