import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";
import FormData from "form-data";
import { BaseResult } from "../types/common";
import { UserInfo } from "../types/user";
import { TRPCError } from "@trpc/server";
import { cacheMap } from "./memory";

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
      form.append("token", cacheMap.get("token") ?? "")

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
    .mutation(async () => {
      const form = new FormData();
      form.append("func", "alipayStatus");
      form.append("user", cacheMap.get("username") ?? "");
      form.append(
        "params",
        JSON.stringify({
          status: 1,
        })
      );
      form.append("token", cacheMap.get("token") ?? "")

      await request.post("", form)
      return true ;
    }),

  // 心跳
  heartBeatDown: t.procedure
    .mutation(async () => {
      const form = new FormData();
      form.append("func", "alipayStatus");
      // form.append("user", cacheMap.get("username") ?? "");
      form.append("user", "test1");
      form.append(
        "params",
        JSON.stringify({
          status: 0,
        })
      );
      form.append("token", cacheMap.get("token") ?? "")

      await request.post("", form);
      return true;
    }),

});
