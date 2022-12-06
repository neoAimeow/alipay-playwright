import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";
import FormData from "form-data";
import { BaseResult } from "../types/common";
import { UserInfo } from "../types/user";
import { TRPCError } from "@trpc/server";

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

      const result = await request.post<BaseResult<UserInfo>>("", form);
      const { code, data, message } = result.data;
      if (code != 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: message,
        });
      }
      return data;
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
