import FormData from "form-data";
import { CacheManager } from "../../utils/cache";
import getRequest from "../../utils/axios";
import { prisma } from "../db/client";

export const uploadPayResult = async (input: {
  alipay: string;
  orderId: string;
  errorCode: number;
  errorMsg: string;
}) => {
  console.error("uploadPayResult", input);
  const form = new FormData();
  form.append("func", "payResult");
  form.append(
    "user",
    (await CacheManager.getInstance(prisma).getStore("username")) ?? ""
  );
  form.append(
    "token",
    (await CacheManager.getInstance(prisma).getStore("token")) ?? ""
  );
  form.append(
    "params",
    JSON.stringify({
      alipay: input.alipay,
      orderId: input.orderId,
      errorCode: input.errorCode,
      errorMsg: input.errorMsg,
    })
  );
  const request = await getRequest();
  await request.post("", form);
};
