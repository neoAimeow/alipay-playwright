import { Account, PrismaClient } from "@prisma/client";
import { AccountStateManager } from "../utils/account-state-manager";
import { AccountInfo } from "../api/router/account";
import { OrderRecordMapper } from "./order-record.mapper";

// electron中不能直接用prisma或其它数据通信。所以统一通过trpc来做数据处理。
// 但是在ipcRenderer可直接用prisma。且用trpc会有bug，所以在handler中直接用

function isEqual(element: string, account: string) {
  return element === account;
}

export class AccountMapper {
  private static instance: AccountMapper | undefined;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): AccountMapper {
    if (!AccountMapper.instance) {
      AccountMapper.instance = new AccountMapper(prisma);
    }

    return AccountMapper.instance;
  }

  public async getValidAccount(): Promise<AccountInfo[]> {
    const accounts = await this.prisma.account.findMany({
      where: { valid: true },
    });
    const arr = AccountStateManager.getInstance().getLoginUserList();
    const results: AccountInfo[] = [];

    accounts.forEach((item) => {
      AccountStateManager.getInstance().addAccount(item.account);
    });

    await Promise.all(
      accounts.map(async (item) => {
        const accountInfo: AccountInfo = { ...item };
        accountInfo.isLogin = arr.some((element) =>
          isEqual(element, item.account)
        );
        const accountState = AccountStateManager.getInstance().getAccountState(
          item.account
        );
        accountInfo.workState = accountState?.workState;

        const paymentInfo: { count: number; payment: number } =
          await OrderRecordMapper.getInstance(
            this.prisma
          ).getPaymentInfoWithAccountId(item.id);
        accountInfo.count = paymentInfo.count;
        accountInfo.payment = paymentInfo.payment;

        results.push(accountInfo);
      })
    );
    const sortArr = results.sort((a, b) => a.id - b.id);

    return sortArr;
  }

  public async getInvalidAccount(): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      where: { valid: false },
    });
    accounts.forEach((value) => {
      AccountStateManager.getInstance().addAccount(value.account);
    });
    return accounts;
  }

  public async add(
    account: string,
    password: string,
    isShort: boolean
  ): Promise<void> {
    await this.prisma.account.create({
      data: {
        account: account,
        password: password,
        isShort: isShort,
        invalidReason: "",
        valid: true,
      },
    });
  }

  public async update(
    id: number,
    password: string,
    isShort: boolean
  ): Promise<void> {
    await this.prisma.account.update({
      data: {
        password: password,
        isShort: isShort,
        invalidReason: "",
        valid: true,
      },
      where: { id: id },
    });
  }

  public async remove(id: number): Promise<void> {
    await this.prisma.account.delete({ where: { id: id } });
  }

  public async validUser(account: string): Promise<void> {
    const data = await this.prisma.account.findFirst({
      where: { account: account },
    });

    if (data) {
      await this.prisma.account.updateMany({
        data: {
          valid: true,
          invalidReason: "",
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

  public async invalidUser(id: number, reason: string): Promise<void> {
    const data = await this.prisma.account.findFirst({
      where: { id: id },
    });

    if (data) {
      await this.prisma.account.updateMany({
        data: {
          valid: false,
          invalidReason: reason,
          version: {
            increment: 1,
          },
        },
        where: {
          id: id,
          version: data.version,
        },
      });
    }
  }

  public async disableAccount(account: string): Promise<void> {
    const data = await this.prisma.account.findFirst({
      where: { account: account },
    });
    if (data) {
      const createPrism = this.prisma.accountTemp.create({
        data: {
          account: data.account,
          password: data.password,
          isShort: data.isShort,
        },
      });
      const deletePrism = this.prisma.account.delete({
        where: { id: data.id },
      });

      await this.prisma.$transaction([createPrism, deletePrism]);
    }
  }
}
