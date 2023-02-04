import FormData from "form-data";
import { CacheManager } from "../../utils/cache";
import getRequest from "../../utils/axios";
import { prisma } from "../db/client";
import { BaseResult } from "../types/common";

export async function getAlipayLoginUrl(): Promise<string> {
  const token = await CacheManager.getInstance(prisma).getStore("token");
  const user = await CacheManager.getInstance(prisma).getStore("username");
  const form = new FormData();
  form.append("func", "getAlipayLoginUrl");
  form.append("user", user ?? "");
  form.append("token", token ?? "");
  form.append("params", JSON.stringify({}));
  const request = await getRequest();
  const result = await request.post<BaseResult<string>>("", form);
  console.error(result, token);
  const { data } = result.data;
  return data;
}
