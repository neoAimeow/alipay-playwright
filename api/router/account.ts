import { t } from "../context";
import { z } from "zod";

export const accountRouter = t.router({
  getValidAccount: t.procedure.query(({ ctx }) => {
    return ctx.prisma.account.findMany({ where: { valid: true } });
  }),

  getInvalidAccount: t.procedure.query(({ ctx }) => {
    return ctx.prisma.account.findMany({ where: { valid: false } });
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
      return ctx.prisma.account.create({
        data: {
          account: input.account,
          password: input.password,
          isShort: input.isShort,
          isEnterprise: input.isEnterprise,
          valid: true,
        },
      });
    }),

  remove: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.account.delete({
        where: { id: input.id },
      });
    }),
});
