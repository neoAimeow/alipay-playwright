import { cookie_pre, ErrorEnum, ErrorMsg, PlayWrightContext } from "./type";
import { dialog } from "electron";
import { AccountMapper } from "../mapper/account.mapper";
import { prisma } from "../api/db/client";
import { Cookie } from "playwright";
import { AccountStateManager } from "../utils/account-state-manager";
import { SystemConfig } from "../api/types/config";
import { AccountInfo } from "../api/router/account";
import { Order } from "../api/router/order";
import { uploadPayResult } from "../api/request/order";
import { CacheManager } from "../utils/cache";

export async function catchError(
  context: PlayWrightContext
): Promise<ErrorMsg> {
  return new Promise(async (resolve, reject) => {
    const { page, isLogin } = context;

    await page.waitForTimeout(1000);

    // try {
    //   console.error(await page.content())
    //   const selector  = await page.waitForSelector(".adm-auto-center-content", { timeout:3000 });
    //   // const selector = await page.$(".adm-auto-center-content");
    //
    //   if (selector) {
    //     // h5pay-error__reload
    //     console.error("there is issue cause", "当前操作可能存在风险，为保护资金安全，我们中断了此次操作。如需帮助请致电95188")
    //     resolve({
    //       reason: ErrorEnum.Need_Refresh,
    //       message: "被风控了",
    //       context,
    //     });
    //   }
    //
    //   //
    // } catch (ex) {
    //
    // }


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

export async function click(
  context: PlayWrightContext,
  selector: string,
  errorHandler?: (context: PlayWrightContext, res: ErrorMsg) => void
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const { page, timeout } = context;
    catchError(context)
      .then((res) => {
        errorHandler && errorHandler(context, res);
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

export async function locate(
  context: PlayWrightContext,
  selector: string,
  callback?: () => void,
  errorHandler?: (context: PlayWrightContext, res: ErrorMsg) => void
): Promise<Boolean> {
  return new Promise((resolve, reject) => {
    const { page, timeout } = context;
    catchError(context)
      .then((res) => {
        errorHandler && errorHandler(context, res);
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

export async function type(
  context: PlayWrightContext,
  selector: string,
  word: string,
  errorHandler?: (context: PlayWrightContext, res: ErrorMsg) => void
): Promise<Boolean> {
  return new Promise(async (resolve, reject) => {
    const { page } = context;

    try {
      await page.type(selector, word, {
        delay: 20,
      });
      catchError(context)
        .then((res) => {
          errorHandler && errorHandler(context, res);
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

export async function invalidUser(id: number, reason: string): Promise<void> {
  return AccountMapper.getInstance(prisma).invalidUser(id, reason);
}

export async function saveCookies(
  account: string,
  cookies: Cookie[]
): Promise<void> {
  await CacheManager.getInstance(prisma).setStore(
    cookie_pre + account,
    JSON.stringify(cookies, null, 2)
  );
  AccountStateManager.getInstance().loginAccount(account);
}

export async function loadCookies(account: string): Promise<Cookie[]> {
  const data: string = (await CacheManager.getInstance(prisma).getStore(
    cookie_pre + account
  )) as string;
  return JSON.parse(data) as Cookie[];
}

export async function getSystemConfig(): Promise<SystemConfig> {
  return (
    ((await CacheManager.getInstance(prisma).getStore(
      "system_config"
    )) as SystemConfig) ?? {
      timeoutDuration: 15,
      isOpenSound: true,
      isCloseWindow: true,
    }
  );
}

export async function reportSuccess(
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

export async function reportFailed(
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
