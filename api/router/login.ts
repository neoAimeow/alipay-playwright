import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";

export const userRouter = t.router({
  login: t.procedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .query(async ({ input }) => {
      return request.post("", {
        func: "shopLogin",
        user: input.username,
        params: JSON.stringify({
          user: input.username,
          pass: input.password,
          type: "alipay",
        }),
      });
    }),

  // 心跳
  heartBeat: t.procedure
    .input(z.object({ username: z.string(), status: z.string() }))
    .mutation(({ input }) => {
      return request.post("", {
        func: "alipayStatus",
        user: input.username,
        params: JSON.stringify({
          status: input.status,
        }),
      });
    }),
});
