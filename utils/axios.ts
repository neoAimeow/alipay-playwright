import axios from "axios";
import { BaseResult } from "../api/types/common";

const BASE_URL = "https://shanghai.128mb.cn/flask/api";
const REQUEST_TIMEOUT = 1000 * 15; // 请求超时时间

const request = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
});

export default request;
