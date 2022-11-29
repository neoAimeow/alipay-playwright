import { t } from "../context";
import { z } from "zod";

export const orderRecordRouter = t.router({
  getAll: t.procedure.query(({ ctx }) => {
    return ctx.prisma.orderRecord.findMany();
  }),
  add: t.procedure
    .input(
      z.object({
        accountId: z.number(),
        payment: z.number(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.orderRecord.create({
        data: {
          accountId: input.accountId,
          payment: input.payment,
        },
      });
    }),
  remove: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.orderRecord.delete({
        where: { id: input.id },
      });
    }),
});
