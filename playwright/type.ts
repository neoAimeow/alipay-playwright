import { BrowserContext } from "playwright-core";
import { Page } from "playwright";
import { AccountInfo } from "../api/router/account";

export const cookie_pre = "account_";
export const defaultLoginUrl =
  "https://mclient.alipay.com/h5pay/h5RouteAppSenior/index.html?server_param=emlkPTI5O25kcHQ9MjRhNztjYz15&contextId=RZ42Kxqf3IOXoREDTX1eEXXNL8x240mobileclientgw29RZ42&pageToken=&refreshNoAuth=Y";

export enum ErrorEnum {
  No_Money = 0,
  No_Pay_Way = 1,
  System_Error = 2,
  SMS = 3,
  Not_Login = 4,
  Need_Reload = 6,
  Need_Refresh = 7,
}

export interface ErrorMsg {
  reason: ErrorEnum;
  message: string;
  context: PlayWrightContext;
}

export interface PlayWrightContext {
  browserContext: BrowserContext;
  page: Page;
  timeout: number;
  // order: Order;
  account: AccountInfo;
  isLogin: boolean;
}

export interface PayResult {
  success: boolean;
  amountStr: string;
}
