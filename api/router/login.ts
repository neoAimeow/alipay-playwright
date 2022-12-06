import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";
import FormData from "form-data";

export const userRouter = t.router({
  login: t.procedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .query(async ({ input }) => {
      const form = new FormData();
      form.append("func", "shopLogin");
      form.append("user", input.username);
      form.append(
        "params",
        JSON.stringify({
          user: input.username,
          pass: input.password,
          type: "alipay",
        })
      );

      const data = await request.post("", form);
      console.error("login", data.data);
      return data.data as Record<string, unknown>;
    }),

  // 心跳
  heartBeat: t.procedure
    .input(z.object({ username: z.string(), status: z.string() }))
    .mutation(({ input }) => {
      const form = new FormData();
      form.append("func", "alipayStatus");
      form.append("user", input.username);
      form.append(
        "params",
        JSON.stringify({
          status: input.status,
        })
      );

      return request.post("", form);
    }),
});
