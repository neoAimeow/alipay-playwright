import { t } from "../context";
import { z } from "zod";
import getRequest from "../../utils/axios";
import FormData from "form-data";
import { TRPCError } from "@trpc/server";
import { BaseResult } from "../types/common";
import { CacheManager } from "../../utils/cache";
import { uploadPayResult } from "../request/order";

export interface Order {
  kfcOrderId: string;
  payUrl?: string;
  isSuccess?: boolean;
  price?: number;
  taobaoOrderId: string;
}

export const orderRouter = t.router({
  // 获取订单信息
  getOrder: t.procedure.query(async ({ ctx }) => {
    const form = new FormData();
    form.append("func", "queryOrdersToPay");
    form.append(
      "user",
      (await CacheManager.getInstance(ctx.prisma).getStore("username")) ?? ""
    );
    form.append(
      "token",
      (await CacheManager.getInstance(ctx.prisma).getStore("token")) ?? ""
    );
    form.append("params", "{}");
    const request = await getRequest();
    const result = await request.post<BaseResult<Order[]>>("", form);
    const { code, data, message } = result.data;
    if (code != 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: message,
      });
    }
    return data;
  }),

  // 上报支付结果
  uploadPayResult: t.procedure
    .input(
      z.object({
        alipay: z.string(),
        orderId: z.string(),
        errorCode: z.number(),
        errorMsg: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await uploadPayResult(input);
      return true;
    }),
});
