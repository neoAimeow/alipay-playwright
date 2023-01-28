import { BrowserContext } from "playwright-core";
import { Page } from "playwright";
import { AccountInfo } from "../api/router/account";

export const cookie_pre = "account_";
export const loginUrl =
  "https://openapi.alipay.com/gateway.do?alipay_sdk=alipay-sdk-java-dynamicVersionNo&app_id=2017062007526455&biz_content=%7B%22store_id%22%3A%22GZH177%22%2C%22royalty_info%22%3A%7B%22royalty_detail_infos%22%3A%5B%7B%22trans_in%22%3A%22GZH177%22%2C%22trans_in_type%22%3A%22storeId%22%7D%5D%7D%2C%22extend_params%22%3A%7B%22pdSubBizScene%22%3A%22enterprisePay%22%7D%2C%22out_trade_no%22%3A%22AF10012159097214541025636%22%2C%22query_options%22%3A%5B%22fund_bill_list%22%2C%22voucher_detail_list%22%2C%22discount_goods_detail%22%2C%22enterprise_pay_info%22%5D%2C%22total_amount%22%3A10.0%2C%22subject%22%3A%22KFC_PREAF10012159097214541025636%22%2C%22business_params%22%3A%7B%22enterprise_pay_info%22%3A%22%7B%5C%22category_list%5C%22%3A%5B%7B%5C%22category%5C%22%3A%5C%22-1%5C%22%2C%5C%22price%5C%22%3A%5C%2210.0%5C%22%7D%5D%7D%22%7D%2C%22timeout_express%22%3A%2215m%22%2C%22product_code%22%3A%22FACE_TO_FACE_PAYMENT%22%2C%22body%22%3A%22ZnJvbT1QQ1QmYnJhbmQ9S0ZDX1BSRSZidT1LRkNfUFJFJnBvcnRhbFR5cGU9V0FQJnN0b3JlPUdaSDE3Nw%3D%3D%22%2C%22buyer_id%22%3A%2287972501069653051342%22%7D&charset=UTF-8&format=json&method=alipay.trade.wap.pay&notify_url=https%3A%2F%2Fpayks.yumchina.com%2FV2%2FHW%2FpayWeb%2Fpay.web.service%2Fpay%2FALIPAY%2FALI_WAP2%2F2159097214541025637%2F2017062007526455&return_url=https%3A%2F%2Forder.kfc.com.cn%2Fpreorder-taro%2FpreorderDetail%2Fpages%2FkfcOrderDetails%2Fdetail%2Findex%3ForderId%3D1666458391876245206%26isSettlePage%3Dtrue%26opener%3Dsettlement%26type%3D1&sign=oQTgRaBf6u35SJJ0gVQx1%2FgM58Gh%2BrcpvIxGhaxDzrAvIKaPtBZ8d5dqsHLS0m8yF%2F4HG%2BsD8xRrmCSDsh27o69sgxD3Ve205tfaGHa54lHIvWT%2BSUx879oirkydD%2BouajAXM3slNI%2FNGPqnw836775WlVuvUkIfGB1GWZ3qPh2P2GIRrbcuV47Ugxw7t1zLKqOKuQUkAs%2BCkz6H2eBkxga49a39eTseCHUeIYMVxUrGgX%2FUVpsdlcde%2BmXvZF0LtK3M%2B8GF0Di14WwNv2E3xjyyAJDTUHVfeKjTVq2VNtBctvspAhqGWk9mc5w8g7Bau2C9xyAa89Xzgm%2Bf13sUBQ%3D%3D&sign_type=RSA2&timestamp=2022-10-23+01%3A06%3A43&version=1.0";

export enum ErrorEnum {
  No_Money = 0,
  No_Pay_Way = 1,
  System_Error = 2,
  SMS = 3,
  Not_Login = 4,
  Need_Reload = 6,
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
