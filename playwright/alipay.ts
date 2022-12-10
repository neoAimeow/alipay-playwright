import { webkit, chromium, Browser, Page, devices, Cookie } from "playwright";
import { prisma } from "../api/db/client";
import { Account } from "@prisma/client";
import promiseDefer, { Deferred } from "../utils/defer";
import { CacheManager } from "../utils/cache";
import { AccountMapper } from "../mapper/mapper";
import { memoryMap } from "../api/router/memory";
import { AccountStateManager, WorkState } from "../utils/account-state-manager";
import { AccountInfo } from "../api/router/account";

const cookie_pre = "account_";
const loginUrl =
  "https://openapi.alipay.com/gateway.do?alipay_sdk=alipay-sdk-java-dynamicVersionNo&app_id=2017062007526455&biz_content=%7B%22store_id%22%3A%22GZH177%22%2C%22royalty_info%22%3A%7B%22royalty_detail_infos%22%3A%5B%7B%22trans_in%22%3A%22GZH177%22%2C%22trans_in_type%22%3A%22storeId%22%7D%5D%7D%2C%22extend_params%22%3A%7B%22pdSubBizScene%22%3A%22enterprisePay%22%7D%2C%22out_trade_no%22%3A%22AF10012159097214541025636%22%2C%22query_options%22%3A%5B%22fund_bill_list%22%2C%22voucher_detail_list%22%2C%22discount_goods_detail%22%2C%22enterprise_pay_info%22%5D%2C%22total_amount%22%3A10.0%2C%22subject%22%3A%22KFC_PREAF10012159097214541025636%22%2C%22business_params%22%3A%7B%22enterprise_pay_info%22%3A%22%7B%5C%22category_list%5C%22%3A%5B%7B%5C%22category%5C%22%3A%5C%22-1%5C%22%2C%5C%22price%5C%22%3A%5C%2210.0%5C%22%7D%5D%7D%22%7D%2C%22timeout_express%22%3A%2215m%22%2C%22product_code%22%3A%22FACE_TO_FACE_PAYMENT%22%2C%22body%22%3A%22ZnJvbT1QQ1QmYnJhbmQ9S0ZDX1BSRSZidT1LRkNfUFJFJnBvcnRhbFR5cGU9V0FQJnN0b3JlPUdaSDE3Nw%3D%3D%22%2C%22buyer_id%22%3A%2287972501069653051342%22%7D&charset=UTF-8&format=json&method=alipay.trade.wap.pay&notify_url=https%3A%2F%2Fpayks.yumchina.com%2FV2%2FHW%2FpayWeb%2Fpay.web.service%2Fpay%2FALIPAY%2FALI_WAP2%2F2159097214541025637%2F2017062007526455&return_url=https%3A%2F%2Forder.kfc.com.cn%2Fpreorder-taro%2FpreorderDetail%2Fpages%2FkfcOrderDetails%2Fdetail%2Findex%3ForderId%3D1666458391876245206%26isSettlePage%3Dtrue%26opener%3Dsettlement%26type%3D1&sign=oQTgRaBf6u35SJJ0gVQx1%2FgM58Gh%2BrcpvIxGhaxDzrAvIKaPtBZ8d5dqsHLS0m8yF%2F4HG%2BsD8xRrmCSDsh27o69sgxD3Ve205tfaGHa54lHIvWT%2BSUx879oirkydD%2BouajAXM3slNI%2FNGPqnw836775WlVuvUkIfGB1GWZ3qPh2P2GIRrbcuV47Ugxw7t1zLKqOKuQUkAs%2BCkz6H2eBkxga49a39eTseCHUeIYMVxUrGgX%2FUVpsdlcde%2BmXvZF0LtK3M%2B8GF0Di14WwNv2E3xjyyAJDTUHVfeKjTVq2VNtBctvspAhqGWk9mc5w8g7Bau2C9xyAa89Xzgm%2Bf13sUBQ%3D%3D&sign_type=RSA2&timestamp=2022-10-23+01%3A06%3A43&version=1.0";

const payUrl = "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121011100400000020023904849790&sign=Cquy8ejd31kfJ8rr19m45Cpt1NVH3HZmJ%2BmaW3mVQg%2BrQT1gwgu8osEmnmNBwsNlRlTjkgkRh71KQvyo4wvlAsNxDP1l1g6Wrv6S38HDGI4pLVSv%2FHx%2F8XH7hO0g4JfhHZ4DqKm6Yjmtsy%2FhZPBRhPATrRrZ%2BPvOd%2F%2FCty8pETI%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121011100400000020023904849790&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221210144955U92292726253010579&partner=2088311465207164&alipay_exterface_invoke_assign_sign=_t_p6pb_qo_f5_ykz_tx9k_f_m1d_rp_mkuu_m_qj_t_z_q_ykrf_x59_a_w7_tn_l_y_cm5_g_wzfg%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=6.90&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946422690960457%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.227.101.227"

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


    await Promise.all(
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
          await context.close();
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
            await context.close();

          }
        } else {
          if (isShort) {
            await page.locator('.my-passcode-input-native-input').fill(password);
          } else {
            await page.locator('.adm-input-element >> nth=1').fill(password);
          }

          await page.locator("button:has-text('下一步')").click();
          // save cookie
          const cookies = await context.cookies()
          await this.saveCookies(username, cookies)
          await context.close();
        }
      }))
    // await browser.close();
    // this.defer = undefined
  }

  public async pay():Promise<void> {
    const browser = await this.launchPlaywright();
    const accounts = await this.loadUsers();
    const account = accounts.find((account)=>(account.isLogin && account.valid && (account.workState === WorkState.ON_CALL)))
    console.error("account", account, accounts);

    if (account) {
      const context = await browser.newContext(devices["iPhone 13"]);
      const cookies = await this.loadCookies(account.account);
      await context.addCookies(cookies)
      const page = await context.newPage();
      await page.goto(payUrl);


      await page.waitForEvent("requestfinished");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      await page.locator(".J-h5Pay", {hasText:"继续浏览器付款"}).click();

    }

    // browser.
  }

  // 加载可用帐号
  private loadUsers(): Promise<AccountInfo[]> {
    return AccountMapper.getInstance(prisma).getValidAccount()
  }

  // 将用户加到黑名单中
  private async invalidUser(account: string): Promise<void> {
    return AccountMapper.getInstance(prisma).invalidUser(account);
  }

  private async saveCookies(account: string, cookies: Cookie[]): Promise<void> {
    await this.cacheManager.setStore(
      cookie_pre + account,
      JSON.stringify(cookies, null, 2)
    );
    AccountStateManager.getInstance().loginAccount(account)
  }

  private async loadCookies(account: string): Promise<Cookie[]> {
    const data: string = (await this.cacheManager.getStore(
      cookie_pre + account
    )) as string;

    return JSON.parse(data) as Cookie[];
  }
}
