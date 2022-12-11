import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";
import FormData from "form-data";
import { BaseResult } from "../types/common";
import { UserInfo } from "../types/user";
import { TRPCError } from "@trpc/server";
import { memoryMap } from "./memory";
import { CacheManager } from "../../utils/cache";

export const userRouter = t.router({
  login: t.procedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .query(async ({ input, ctx }) => {
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
      form.append("token", await CacheManager.getInstance(ctx.prisma).getStore("username") ?? "")

      const result = await request.post<BaseResult<UserInfo>>("", form);
      const { code, data, message } = result.data;
      console.error(1111, result.data);


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
    .mutation(async ({ ctx }) => {
      const form = new FormData();
      form.append("func", "alipayStatus");
      form.append("user", await CacheManager.getInstance(ctx.prisma).getStore("username") ?? "");
      form.append(
        "params",
        JSON.stringify({
          status: 1,
        })
      );
      form.append("token", await CacheManager.getInstance(ctx.prisma).getStore("token") ?? "")

      await request.post("", form)
      return true;
    }),

  // 心跳
  heartBeatDown: t.procedure
    .mutation(async ({ ctx }) => {
      const form = new FormData();
      form.append("func", "alipayStatus");
      // form.append("user", memoryMap.get("username") ?? "");
      form.append("user", "test1");
      form.append(
        "params",
        JSON.stringify({
          status: 0,
        })
      );
      form.append("token", await CacheManager.getInstance(ctx.prisma).getStore("token") ?? "")

      await request.post("", form);
      return true;
    }),

});
