import { t } from "../context";
import { z } from "zod";
import { Mapper } from "../../mapper/mapper";

export const accountRouter = t.router({
  getValidAccount: t.procedure.query(({ ctx }) => {
    return Mapper.getInstance(ctx.prisma).getValidAccount();
  }),

  getInvalidAccount: t.procedure.query(({ ctx }) => {
    return Mapper.getInstance(ctx.prisma).getInvalidAccount();
  }),

  add: t.procedure
    .input(
      z.object({
        account: z.string(),
        password: z.string(),
        isShort: z.boolean(),
        isEnterprise: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      return Mapper.getInstance(ctx.prisma).add(
        input.account,
        input.password,
        input.isShort,
        input.isEnterprise
      );
    }),

  remove: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return Mapper.getInstance(ctx.prisma).remove(input.id);
    }),
});
