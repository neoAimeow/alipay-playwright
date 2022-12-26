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
  const instance = axios.create({
    baseURL: await getBaseUrl(),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "Accept-Language": "zh-CN",
    },
    timeout: REQUEST_TIMEOUT,
    responseEncoding: "utf8",
  });

  instance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

export default getRequest;
