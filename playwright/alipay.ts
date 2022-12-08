import { webkit, chromium, Browser, Page, devices, Cookie } from "playwright";
import { prisma } from "../api/db/client";
import { Account } from "@prisma/client";
import promiseDefer, { Deferred } from "../utils/defer";
import { CacheManager } from "../utils/cache";

const cookie_pre = "account_";
const loginUrl =
  "https://openapi.alipay.com/gateway.do?alipay_sdk=alipay-sdk-java-dynamicVersionNo&app_id=2017062007526455&biz_content=%7B%22store_id%22%3A%22GZH177%22%2C%22royalty_info%22%3A%7B%22royalty_detail_infos%22%3A%5B%7B%22trans_in%22%3A%22GZH177%22%2C%22trans_in_type%22%3A%22storeId%22%7D%5D%7D%2C%22extend_params%22%3A%7B%22pdSubBizScene%22%3A%22enterprisePay%22%7D%2C%22out_trade_no%22%3A%22AF10012159097214541025636%22%2C%22query_options%22%3A%5B%22fund_bill_list%22%2C%22voucher_detail_list%22%2C%22discount_goods_detail%22%2C%22enterprise_pay_info%22%5D%2C%22total_amount%22%3A10.0%2C%22subject%22%3A%22KFC_PREAF10012159097214541025636%22%2C%22business_params%22%3A%7B%22enterprise_pay_info%22%3A%22%7B%5C%22category_list%5C%22%3A%5B%7B%5C%22category%5C%22%3A%5C%22-1%5C%22%2C%5C%22price%5C%22%3A%5C%2210.0%5C%22%7D%5D%7D%22%7D%2C%22timeout_express%22%3A%2215m%22%2C%22product_code%22%3A%22FACE_TO_FACE_PAYMENT%22%2C%22body%22%3A%22ZnJvbT1QQ1QmYnJhbmQ9S0ZDX1BSRSZidT1LRkNfUFJFJnBvcnRhbFR5cGU9V0FQJnN0b3JlPUdaSDE3Nw%3D%3D%22%2C%22buyer_id%22%3A%2287972501069653051342%22%7D&charset=UTF-8&format=json&method=alipay.trade.wap.pay&notify_url=https%3A%2F%2Fpayks.yumchina.com%2FV2%2FHW%2FpayWeb%2Fpay.web.service%2Fpay%2FALIPAY%2FALI_WAP2%2F2159097214541025637%2F2017062007526455&return_url=https%3A%2F%2Forder.kfc.com.cn%2Fpreorder-taro%2FpreorderDetail%2Fpages%2FkfcOrderDetails%2Fdetail%2Findex%3ForderId%3D1666458391876245206%26isSettlePage%3Dtrue%26opener%3Dsettlement%26type%3D1&sign=oQTgRaBf6u35SJJ0gVQx1%2FgM58Gh%2BrcpvIxGhaxDzrAvIKaPtBZ8d5dqsHLS0m8yF%2F4HG%2BsD8xRrmCSDsh27o69sgxD3Ve205tfaGHa54lHIvWT%2BSUx879oirkydD%2BouajAXM3slNI%2FNGPqnw836775WlVuvUkIfGB1GWZ3qPh2P2GIRrbcuV47Ugxw7t1zLKqOKuQUkAs%2BCkz6H2eBkxga49a39eTseCHUeIYMVxUrGgX%2FUVpsdlcde%2BmXvZF0LtK3M%2B8GF0Di14WwNv2E3xjyyAJDTUHVfeKjTVq2VNtBctvspAhqGWk9mc5w8g7Bau2C9xyAa89Xzgm%2Bf13sUBQ%3D%3D&sign_type=RSA2&timestamp=2022-10-23+01%3A06%3A43&version=1.0";

//
// // 加载会话
//
// export const createNewPage = async (username: string) => {
//   const browser = await getBrowser();
//
//   const _context = await browser.newContext({ ...iPhone });
//   // 尝试加载已保存的会话
//   loadCookie(username, _context);
//
//   const _page = await _context.newPage();
//   return { _context, _page };
// };

export class AlipayPlayWright {
  private static instance: AlipayPlayWright | undefined;
  private cacheManager: CacheManager = CacheManager.getInstance(prisma);

  private constructor() {
  }

  public static getInstance(): AlipayPlayWright {
    if (!AlipayPlayWright.instance) {
      AlipayPlayWright.instance = new AlipayPlayWright();
    }

    return AlipayPlayWright.instance;
  }

  private defer: Deferred<Browser> | undefined;

  private async launchPlaywright(): Promise<Browser> {
    if (this.defer) {
      return this.defer.promise;
    }
    this.defer = promiseDefer<Browser>();
    const browser = await chromium.launch({
      headless: false,
      args: [
        "--disable-blink-features=AutomationControlled", // Web Driver 信息去除
      ],
    });
    this.defer.resolve(browser);
    return browser;
  }

  public async login(): Promise<void> {
    const account = await this.loadUsers();
    const browser = await this.launchPlaywright();

    account.map(async (item) => {
      const username = item.account
      const password = item.password
      const isShort = item.isShort
      const context = await browser.newContext(devices["iPhone 13"]);
      const page = await context.newPage();
      await page.goto(loginUrl);
      await page.locator(".h5RouteAppSenior__h5pay").click();
      await page.locator('.adm-input-element').fill(username);
      await page.locator("button:has-text('下一步')").click();

      await page.waitForEvent("requestfinished");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const content = await page.content();
      if (content.match("账号不存在")) {
        await this.invalidUser(username);
        return;
      } else if (content.match("输入短信验证码")) {
        await page.locator(".toAccountLoginWrap___2ir3r").click();
        await page.waitForTimeout(1000);

        await page.locator('.my-passcode-input-native-input').fill(password);

        await page.locator(".adm-button-large").click();

        await page.waitForTimeout(1000);
        const finalStepContent = await page.content();

        if (finalStepContent.match("支付密码不正确")) {
          await this.invalidUser(username);
        } else {
          // save cookie
          const cookies = await context.cookies()
          await this.saveCookies(username, cookies)
        }
      } else {
        if (isShort) {
          await page.locator('.my-passcode-input-native-input').fill(password);
        } else {
          console.error("isNotShort", password)
          await page.locator('.adm-input-element >> nth=1').fill(password);
        }

        await page.locator("button:has-text('下一步')").click();
        // save cookie
        const cookies = await context.cookies()
        await this.saveCookies(username, cookies)
      }
    });
  }

  // 加载可用帐号
  private loadUsers(): Promise<Account[]> {
    return prisma.account.findMany({ where: { valid: true } });
  }

  // 将用户加到黑名单中
  private async invalidUser(account: string): Promise<void> {
    const data = await prisma.account.findFirst({
      where: { account: account },
    });

    if (data) {
      await prisma.account.updateMany({
        data: {
          valid: false,
          version: {
            increment: 1,
          },
        },
        where: {
          account: account,
          version: data.version,
        },
      });
    }
  }

  private async saveCookies(account: string, cookies: Cookie[]): Promise<void> {
    await this.cacheManager.setStore(
      cookie_pre + account,
      JSON.stringify(cookies, null, 2)
    );
  }

  private async loadCookies(account: string): Promise<Cookie[]> {
    const data: string = (await this.cacheManager.getStore(
      cookie_pre + account
    )) as string;

    return JSON.parse(data) as Cookie[];
  }
}
