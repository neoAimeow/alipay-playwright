import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";
import { cacheMap } from "./memory";
import FormData from "form-data";

export const orderRouter = t.router({
  // 获取订单信息
  getOrder: t.procedure.query(async () => {
    const form = new FormData();
    form.append("func", "queryOrdersToPay");
    form.append("user", cacheMap.get("username") ?? "");
    form.append("token", cacheMap.get("token") ?? "");
    form.append("params", "{}");
    return await request.post("", form);
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
    .mutation(async ({ input }) => {
      const form = new FormData();
      form.append("func", "payResult");
      form.append("user", cacheMap.get("username") ?? "");
      form.append("token", cacheMap.get("token") ?? "");
      form.append(
        "params",
        JSON.stringify({
          alipay: input.alipay,
          orderId: input.orderId,
          errorCode: input.errorCode,
          errorMsg: input.errorMsg,
        })
      );
      await request.post("", form);
      return true;
    }),
});
