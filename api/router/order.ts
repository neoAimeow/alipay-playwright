import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";

export const orderRouter = t.router({
  // 获取订单信息
  getOrder: t.procedure
    .input(z.object({ username: z.string() }))
    .query(({ input }) => {
      return request.post("", {
        func: "queryOrdersToPay",
        user: input.username,
        params: "{}",
      });
    }),

  // 上报支付结果
  uploadPayResult: t.procedure
    .input(
      z.object({
        username: z.string(),
        alipay: z.string(),
        orderId: z.string(),
        errorCode: z.number(),
        errorMsg: z.string(),
      })
    )
    .mutation(({ input }) => {
      return request.post("", {
        func: "payResult",
        user: input.username,
        params: JSON.stringify({
          alipay: input.alipay,
          orderId: input.orderId,
          errorCode: input.errorCode,
          errorMsg: input.errorMsg,
        }),
      });
    }),
});
