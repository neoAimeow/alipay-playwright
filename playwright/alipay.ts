import {
  webkit,
  firefox,
  Browser,
  Page,
  devices,
  Cookie,
  chromium,
} from "playwright";
import { prisma } from "../api/db/client";
import promiseDefer, { Deferred } from "../utils/defer";
import { CacheManager } from "../utils/cache";
import { AccountMapper } from "../mapper/account.mapper";
import { AccountStateManager, WorkState } from "../utils/account-state-manager";
import { AccountInfo } from "../api/router/account";
import { dialog } from "electron";
import { Order } from "../api/router/order";
import { BrowserContext } from "playwright-core";
import { uploadPayResult } from "../api/request/order";
import { OrderRecordMapper } from "../mapper/order-record.mapper";
import path from "path";
import { SystemConfig } from "../api/types/config";

const cookie_pre = "account_";
const loginUrl =
  "https://openapi.alipay.com/gateway.do?alipay_sdk=alipay-sdk-java-dynamicVersionNo&app_id=2017062007526455&biz_content=%7B%22store_id%22%3A%22GZH177%22%2C%22royalty_info%22%3A%7B%22royalty_detail_infos%22%3A%5B%7B%22trans_in%22%3A%22GZH177%22%2C%22trans_in_type%22%3A%22storeId%22%7D%5D%7D%2C%22extend_params%22%3A%7B%22pdSubBizScene%22%3A%22enterprisePay%22%7D%2C%22out_trade_no%22%3A%22AF10012159097214541025636%22%2C%22query_options%22%3A%5B%22fund_bill_list%22%2C%22voucher_detail_list%22%2C%22discount_goods_detail%22%2C%22enterprise_pay_info%22%5D%2C%22total_amount%22%3A10.0%2C%22subject%22%3A%22KFC_PREAF10012159097214541025636%22%2C%22business_params%22%3A%7B%22enterprise_pay_info%22%3A%22%7B%5C%22category_list%5C%22%3A%5B%7B%5C%22category%5C%22%3A%5C%22-1%5C%22%2C%5C%22price%5C%22%3A%5C%2210.0%5C%22%7D%5D%7D%22%7D%2C%22timeout_express%22%3A%2215m%22%2C%22product_code%22%3A%22FACE_TO_FACE_PAYMENT%22%2C%22body%22%3A%22ZnJvbT1QQ1QmYnJhbmQ9S0ZDX1BSRSZidT1LRkNfUFJFJnBvcnRhbFR5cGU9V0FQJnN0b3JlPUdaSDE3Nw%3D%3D%22%2C%22buyer_id%22%3A%2287972501069653051342%22%7D&charset=UTF-8&format=json&method=alipay.trade.wap.pay&notify_url=https%3A%2F%2Fpayks.yumchina.com%2FV2%2FHW%2FpayWeb%2Fpay.web.service%2Fpay%2FALIPAY%2FALI_WAP2%2F2159097214541025637%2F2017062007526455&return_url=https%3A%2F%2Forder.kfc.com.cn%2Fpreorder-taro%2FpreorderDetail%2Fpages%2FkfcOrderDetails%2Fdetail%2Findex%3ForderId%3D1666458391876245206%26isSettlePage%3Dtrue%26opener%3Dsettlement%26type%3D1&sign=oQTgRaBf6u35SJJ0gVQx1%2FgM58Gh%2BrcpvIxGhaxDzrAvIKaPtBZ8d5dqsHLS0m8yF%2F4HG%2BsD8xRrmCSDsh27o69sgxD3Ve205tfaGHa54lHIvWT%2BSUx879oirkydD%2BouajAXM3slNI%2FNGPqnw836775WlVuvUkIfGB1GWZ3qPh2P2GIRrbcuV47Ugxw7t1zLKqOKuQUkAs%2BCkz6H2eBkxga49a39eTseCHUeIYMVxUrGgX%2FUVpsdlcde%2BmXvZF0LtK3M%2B8GF0Di14WwNv2E3xjyyAJDTUHVfeKjTVq2VNtBctvspAhqGWk9mc5w8g7Bau2C9xyAa89Xzgm%2Bf13sUBQ%3D%3D&sign_type=RSA2&timestamp=2022-10-23+01%3A06%3A43&version=1.0";

enum ErrorEnum {
  No_Money = 0,
  No_Pay_Way = 1,
  System_Error = 2,
  SMS = 3,
  Not_Login = 4,
  Need_Reload = 6,
}

interface ErrorMsg {
  reason: ErrorEnum;
  message: string;
  context: PlayWrightContext;
}

interface PlayWrightContext {
  browserContext: BrowserContext;
  page: Page;
  timeout: number;
  // order: Order;
  account: AccountInfo;
  isLogin: boolean;
}

interface PayResult {
  success: boolean;
  amountStr: string;
}

export class AlipayPlayWright {
  private static instance: AlipayPlayWright | undefined;
  private cacheManager: CacheManager = CacheManager.getInstance(prisma);

  private constructor() {}

  public static getInstance(): AlipayPlayWright {
    if (!AlipayPlayWright.instance) {
      AlipayPlayWright.instance = new AlipayPlayWright();
    }

    return AlipayPlayWright.instance;
  }

  private defer: Deferred<Browser> | undefined;
  private queue: Order[] = [];
  private isRunning = false;
  private whiteList: string[] = [];
  private loginWhiteList: string[] = [];

  private async launchPlaywright(): Promise<Browser> {
    if (this.defer) {
      return this.defer.promise;
    }
    this.defer = promiseDefer<Browser>();

    let executablePathObj: { executablePath?: string } = {};

    if (process.platform !== "darwin") {
      executablePathObj.executablePath =
        process.env.NODE_ENV === "development"
          ? path.join(
              process.cwd(),
              "buildResources/ms-playwright-win/Playwright.exe"
            )
          : path.join(
              process.resourcesPath,
              "buildResources/ms-playwright-win/Playwright.exe"
            );
    }

    const config: SystemConfig = await this.getSystemConfig();
    console.error("config", config);

    const browser = await webkit.launch({
      ...executablePathObj,
      headless: config.isCloseWindow ?? true,
      args: [
        "--disable-blink-features=AutomationControlled", // Web Driver 信息去除
      ],
    });

    this.defer.resolve(browser);
    return browser;
  }

  public async login(item: AccountInfo): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const existAccount = this.loginWhiteList.find(
        (str: string) => str === item.account
      );

      if (existAccount) {
        reject("account exist in whiteList");
        return;
      }
      this.loginWhiteList.push(item.account);
      const browser = await this.launchPlaywright();
      const id = item.id;
      const username = item.account;
      const password = item.password;
      const isShort = item.isShort;
      const context = await browser.newContext(devices["iPhone 13"]);
      context.on("close", () => {
        console.error("disconnected");
      });

      const page = await context.newPage();

      const playwrightContext: PlayWrightContext = {
        browserContext: context,
        page,
        timeout: 3000,
        account: item,
        isLogin: true,
      };

      await page.goto(loginUrl, {
        timeout: 30000,
        waitUntil: "domcontentloaded",
      });

      await this.click(playwrightContext, ".h5RouteAppSenior__h5pay");
      await this.type(playwrightContext, ".adm-input-element", username);
      await this.click(playwrightContext, "button:has-text('下一步')");

      await page.waitForEvent("requestfinished");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const content = await page.content();
      if (content.match("账号不存在")) {
        await this.invalidUser(id, "帐号不存在");
        await context.close();
        return;
      } else if (content.match("输入短信验证码")) {
        await this.click(playwrightContext, ".toAccountLoginWrap___2ir3r");
        await page.waitForTimeout(1000);
        await page.locator(".my-passcode-input-native-input").fill(password);
        await this.click(playwrightContext, ".adm-button-large");

        await page.waitForTimeout(1000);
        const finalStepContent = await page.content();

        if (finalStepContent.match("支付密码不正确")) {
          await this.invalidUser(id, "支付密码不正确");
        } else {
          // save cookie
          const cookies = await context.cookies();
          await this.saveCookies(username, cookies);
          await context.close();
        }
      } else {
        if (isShort) {
          await this.type(
            playwrightContext,
            ".my-passcode-input-native-input",
            password
          );
        } else {
          await this.type(
            playwrightContext,
            ".adm-input-element >> nth=1",
            password
          );
        }

        await this.click(playwrightContext, "button:has-text('下一步')");

        const cookies = await context.cookies();
        await this.saveCookies(username, cookies);
        await context.close();
      }
      this.loginWhiteList = this.loginWhiteList.filter(
        (str) => str === item.account
      );
    });
  }

  public async loginAll(): Promise<void> {
    const account = await AccountMapper.getInstance(prisma).getValidAccount();
    await Promise.all(
      account.map(async (item) => {
        await this.login(item);
      })
    );
  }

  public async addTasks(orders: Order[]): Promise<void> {
    orders.map((item) => {
      const existOrder = this.whiteList.find(
        (str: string) => str === item.kfcOrderId
      );
      if (!existOrder) {
        this.queue.push(item);
        this.whiteList.push(item.kfcOrderId);
      }
    });
    await this.runTask();
  }

  private async runTask(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    const accounts = await AccountMapper.getInstance(prisma).getValidAccount();
    const validAccounts = accounts.filter(
      (account: AccountInfo) =>
        account.isLogin &&
        account.valid &&
        account.workState === WorkState.ON_CALL
    );

    if (validAccounts.length === 0) {
      return;
    }

    if (this.queue.length === 0) {
      this.isRunning = false;
      return;
    }

    this.isRunning = true;

    await Promise.all(
      validAccounts.map(async (item) => {
        const order = this.queue.shift();
        if (order && item) {
          this.pay(order, item).finally(async () => {
            this.isRunning = false;
            await AccountStateManager.getInstance().accountToOnCall(
              item.account
            );
            await this.runTask();
          });
        } else {
          this.isRunning = false;
          await this.runTask();
        }
      })
    ).finally(async () => {
      this.isRunning = false;
      await this.runTask();
    });
  }

  public async pay(order: Order, account: AccountInfo): Promise<PayResult> {
    return new Promise(async (resolve, reject) => {
      await AccountStateManager.getInstance().accountToWork(account.account);
      const browser = await this.launchPlaywright();
      if (account && order && order.payUrl) {
        const context = await browser.newContext(devices["iPhone 13"]);
        await context.clearCookies();
        const cookies = await this.loadCookies(account.account);
        await context.addCookies(cookies);
        const page = await context.newPage();

        await page.goto(order.payUrl, {
          timeout: 30000,
          waitUntil: "domcontentloaded",
        });

        const playwrightContext: PlayWrightContext = {
          browserContext: context,
          page,
          timeout: 3000,
          account,
          isLogin: false,
        };
        await this.click(playwrightContext, ".h5RouteAppSenior__h5pay").finally(
          async () => {
            await this.click(playwrightContext, ".cashierPreConfirm__btn")
              .then(async () => {
                if (!account.isShort) {
                  await this.type(
                    playwrightContext,
                    ".adm-input-element",
                    account.password
                  );
                  await this.click(playwrightContext, ".pwdValidate__btn");
                } else {
                  await this.type(
                    playwrightContext,
                    ".my-passcode-input-native-input",
                    account.password
                  );
                }

                await this.locate(
                  playwrightContext,
                  ".cashierActivity__msg",
                  async () => {
                    const moneySelector = await page.$(
                      ".cashierActivity__content-money--price"
                    );
                    const amountStr = (await moneySelector?.innerText()) ?? "0";
                    await OrderRecordMapper.getInstance(prisma).addRecord(
                      account.id,
                      Number(amountStr)
                    );
                    await this.reportSuccess(account, order);
                    const result = {
                      amountStr: (await moneySelector?.innerText()) ?? "0",
                      success: true,
                    };
                    console.error("result is ", result);
                    await page.close();
                    await context.close();

                    resolve(result);
                  }
                );
              })
              .catch(async (ex) => {
                await this.reportFailed(account, order, `${ex.message}`);
                await page.close();
                await context.close();
                reject(ex);
              });
          }
        );
      }
    });
  }

  private catchError(context: PlayWrightContext): Promise<ErrorMsg> {
    return new Promise(async (resolve, reject) => {
      const { page, isLogin } = context;

      await page.waitForTimeout(800);

      // TODO: 优化耗时
      try {
        const selector = await page.$(".my-adm-input__label");
        if (selector && !isLogin) {
          resolve({ reason: ErrorEnum.Not_Login, message: "未登录", context });
        }
      } catch (ex) {}

      try {
        const selector = await page.$(".adm-error-block-description-title");
        if ((await selector?.textContent()) === "系统繁忙") {
          // h5pay-error__reload
          resolve({
            reason: ErrorEnum.Need_Reload,
            message: "系统繁忙",
            context,
          });
        }
      } catch (ex) {}

      try {
        const selector = await page.$(".adm-error-block-description-title");

        if (selector) {
          resolve({
            reason: ErrorEnum.System_Error,
            message: (await selector?.innerText()) ?? "系统错误",
            context,
          });
        }
      } catch (ex) {}

      try {
        const selector = await page.$(".channelWrap-warning__content--account");
        if (selector && !isLogin) {
          resolve({
            reason: ErrorEnum.No_Pay_Way,
            message: "当前没有可以直接使用的付款方式",
            context,
          });
        }
      } catch (ex) {}

      try {
        const selector = await page.$(".sms-verify__title");
        if (selector && !isLogin) {
          resolve({
            reason: ErrorEnum.SMS,
            message: "需要输入验证码",
            context,
          });
        }
      } catch (ex) {}

      try {
        const selector = await page.$(".channelWrap-warning__content");
        if (selector && !isLogin) {
          resolve({
            reason: ErrorEnum.No_Money,
            message: "没有余额了",
            context,
          });
        }
      } catch (ex) {}

      console.error("reject all");
      reject();
    });
  }

  private async click(
    context: PlayWrightContext,
    selector: string
  ): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      const { page, timeout } = context;
      this.catchError(context)
        .then((res) => {
          this.handleError(context, res);
          reject(res);
        })
        .catch(async () => {
          try {
            await page.waitForSelector(selector, { timeout });
            await page.locator(selector).click();
            resolve(true);
          } catch (ex) {
            reject(ex);
          }
        });
    });
  }

  private async locate(
    context: PlayWrightContext,
    selector: string,
    callback?: () => void
  ): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      const { page, timeout } = context;
      this.catchError(context)
        .then((res) => {
          this.handleError(context, res);
          reject(res);
        })
        .catch(async () => {
          try {
            await page.waitForSelector(selector, { timeout });
            callback && callback();
            resolve(true);
          } catch (ex) {
            reject(ex);
          }
        });
    });
  }

  private async type(
    context: PlayWrightContext,
    selector: string,
    word: string
  ): Promise<Boolean> {
    return new Promise(async (resolve, reject) => {
      const { page } = context;

      try {
        await page.type(selector, word, {
          delay: 20,
        });
        this.catchError(context)
          .then((res) => {
            this.handleError(context, res);
            reject(res);
          })
          .catch((ex) => {
            resolve(true);
          });
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private async handleError(
    context: PlayWrightContext,
    errorMsg: ErrorMsg
  ): Promise<void> {
    const { page, browserContext, account } = context;
    const { reason, message } = errorMsg;
    console.error(reason, message);
    switch (reason) {
      case ErrorEnum.SMS:
        await dialog
          .showMessageBox({
            type: "warning", //弹出框类型
            title: "提示",
            message: "请输入验证码",
            buttons: ["知道了"],
          })
          .then((res) => console.log(res));
        // 需要告警
        break;
      case ErrorEnum.System_Error:
        break;
      case ErrorEnum.No_Money:
        await this.invalidUser(account.id, message);
        break;
      case ErrorEnum.No_Pay_Way:
        await this.invalidUser(account.id, message);
        break;
      case ErrorEnum.Not_Login:
        await this.loginAll();
        break;
      case ErrorEnum.Need_Reload:
        await this.click(context, ".h5pay-error__reload");
        break;
      default:
        break;
    }
  }

  // 将用户加到黑名单中
  private async invalidUser(id: number, reason: string): Promise<void> {
    return AccountMapper.getInstance(prisma).invalidUser(id, reason);
  }

  private async saveCookies(account: string, cookies: Cookie[]): Promise<void> {
    await this.cacheManager.setStore(
      cookie_pre + account,
      JSON.stringify(cookies, null, 2)
    );
    AccountStateManager.getInstance().loginAccount(account);
  }

  private async loadCookies(account: string): Promise<Cookie[]> {
    const data: string = (await this.cacheManager.getStore(
      cookie_pre + account
    )) as string;
    return JSON.parse(data) as Cookie[];
  }

  private async getSystemConfig(): Promise<SystemConfig> {
    return (
      ((await this.cacheManager.getStore("system_config")) as SystemConfig) ?? {
        timeoutDuration: 15,
        isOpenSound: true,
        isCloseWindow: true,
      }
    );
  }

  private async reportSuccess(
    account: AccountInfo,
    order: Order
  ): Promise<void> {
    await uploadPayResult({
      alipay: account.account,
      errorCode: 0,
      errorMsg: "支付成功",
      orderId: `${order.kfcOrderId}`,
    });
  }

  private async reportFailed(
    account: AccountInfo,
    order: Order,
    errorMsg: string
  ): Promise<void> {
    await uploadPayResult({
      alipay: account.account,
      errorCode: -1,
      errorMsg: `支付失败，错误内容：${errorMsg}`,
      orderId: `${order.kfcOrderId}`,
    });
  }
}
