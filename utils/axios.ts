import axios from "axios";
import { CacheManager } from "./cache";
import { prisma } from "../api/db/client";
import { defaultUrl } from "./type";

async function getBaseUrl(): Promise<string> {
  const url =
    (await CacheManager.getInstance(prisma).getStore("base_url")) ?? defaultUrl;
  console.error("url: ", url);
  return url as string;
}

const REQUEST_TIMEOUT = 1000 * 15; // 请求超时时间

const getRequest = async () => {
  return axios.create({
    baseURL: await getBaseUrl(),
    timeout: REQUEST_TIMEOUT,
  });
};

export default getRequest;
