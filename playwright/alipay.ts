import { webkit, Browser, Page, devices } from "playwright";
import { prisma } from "../api/db/client";
import promiseDefer, { Deferred } from "../utils/defer";
import { AccountMapper } from "../mapper/account.mapper";
import { AccountStateManager, WorkState } from "../utils/account-state-manager";
import { AccountInfo } from "../api/router/account";
import { dialog } from "electron";
import { Order } from "../api/router/order";
import { BrowserContext } from "playwright-core";
import { OrderRecordMapper } from "../mapper/order-record.mapper";
import path from "path";
import { SystemConfig } from "../api/types/config";
import { retryDecorator } from "ts-retry-promise";
import {
  ErrorEnum,
  ErrorMsg,
  loginUrl,
  PayResult,
  PlayWrightContext,
} from "./type";
import {
  click,
  getSystemConfig,
  invalidUser,
  loadCookies,
  locate,
  reportFailed,
  reportSuccess,
  saveCookies,
  type,
} from "./alipay-utils";

export class AlipayPlayWright {
  private static instance: AlipayPlayWright | undefined;

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

    const executablePathObj: { executablePath?: string } = {};

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

    const config: SystemConfig = await getSystemConfig();
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
      console.error(`white list is `, this.loginWhiteList);
      const existAccount = this.loginWhiteList.find(
        (str: string) => str === item.account
      );

      if (existAccount) {
        reject("account exist in whiteList");
        return;
      }
      this.loginWhiteList.push(item.account);
      const browser = await this.launchPlaywright();

      const context = await browser.newContext(devices["iPhone 13"]);
      context.on("close", () => {
        console.error("disconnected");
      });

      const page = await context.newPage();

      const retryFunc = retryDecorator(this.loginLogic, {
        retries: 3,
        delay: 1000,
        retryIf: () => {
          console.error("is retrying");
          page.reload();
          return true;
        },
      });

      await retryFunc(item, context, page);
      await context.close();

      this.loginWhiteList = this.loginWhiteList.filter(
        (str) => str === item.account
      );
    });
  }

  private async loginLogic(
    item: AccountInfo,
    context: BrowserContext,
    page: Page
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
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

        await click(
          playwrightContext,
          ".h5RouteAppSenior__h5pay",
          (context, res) => this.handleError(context, res)
        );
        await type(
          playwrightContext,
          ".adm-input-element",
          item.account,
          (context, res) => this.handleError(context, res)
        );
        await click(
          playwrightContext,
          "button:has-text('下一步')",
           async (context, res) => {
            // console.error("下一步出错了", res)
            // if (res.reason === ErrorEnum.Need_Refresh) {
            //   console.error("被风控了")
            //   reject(new Error("被风控了，需要刷新"))
            // }

             await this.handleError(context, res);
           }
        );

        await page.waitForEvent("requestfinished");
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(1000);

        const content = await page.content();
        if (content.match("账号不存在")) {
          await invalidUser(item.id, "帐号不存在");
          reject(new Error("帐号不存在"));
        } else if (content.match("输入短信验证码")) {
          await click(
            playwrightContext,
            ".toAccountLoginWrap___2ir3r",
            (context, res) => this.handleError(context, res)
          );
          await page.waitForTimeout(1000);
          await page
            .locator(".my-passcode-input-native-input")
            .fill(item.password);
          await click(playwrightContext, ".adm-button-large", (context, res) =>
            this.handleError(context, res)
          );

          await page.waitForTimeout(1000);
          const finalStepContent = await page.content();

          if (finalStepContent.match("支付密码不正确")) {
            await invalidUser(item.id, "支付密码不正确");
          } else {
            // save cookie
            const cookies = await context.cookies();
            await saveCookies(item.account, cookies);
            resolve(true);
          }
        } else {
          if (item.isShort) {
            await type(
              playwrightContext,
              ".my-passcode-input-native-input",
              item.password,
              (context, res) => this.handleError(context, res)
            );
          } else {
            await type(
              playwrightContext,
              ".adm-input-element >> nth=1",
              item.password,
              (context, res) => this.handleError(context, res)
            );
          }

          await click(
            playwrightContext,
            "button:has-text('下一步')",
            (context, res) => this.handleError(context, res)
          );

          const cookies = await context.cookies();
          await saveCookies(item.account, cookies);
          resolve(true);
        }
      } catch (ex) {
        console.error(ex);
        reject(ex);
      }
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
        const cookies = await loadCookies(account.account);
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
        await click(
          playwrightContext,
          ".h5RouteAppSenior__h5pay",
          (context, res) => this.handleError(context, res)
        ).finally(async () => {
          await click(playwrightContext, ".cashierPreConfirm__btn")
            .then(async () => {
              if (!account.isShort) {
                await type(
                  playwrightContext,
                  ".adm-input-element",
                  account.password
                );
                await click(playwrightContext, ".pwdValidate__btn");
              } else {
                await type(
                  playwrightContext,
                  ".my-passcode-input-native-input",
                  account.password
                );
              }

              await locate(
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
                  await reportSuccess(account, order);
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
              await reportFailed(account, order, `${ex.message}`);
              await page.close();
              await context.close();
              reject(ex);
            });
        });
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
        await invalidUser(account.id, message);
        break;
      case ErrorEnum.No_Pay_Way:
        await invalidUser(account.id, message);
        break;
      case ErrorEnum.Not_Login:
        await this.loginAll();
        break;
      case ErrorEnum.Need_Reload:
        await click(context, ".h5pay-error__reload");
        break;
      default:
        break;
    }
  }
}
