import { t } from "../context";
import { z } from "zod";
import axios from "axios";
import request from "../../utils/axios";

// export const orderRouter = t.router({
//   getOrder: t.procedure.query(({ ctx }) => {
//     const request = await request.get("login");
//     return request.data;
//   }),
// uploadOrder: t.procedure
//   .input(
//     z.object({
//       accountId: z.number(),
//       payment: z.number(),
//     })
//   )
//   .mutation(({ ctx, input }) => {
//     return ctx.prisma.order.create({
//       data: {
//         accountId: input.accountId,
//         payment: input.payment,
//       },
//     });
//   }),
// });
