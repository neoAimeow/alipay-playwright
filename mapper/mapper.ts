import { Account, PrismaClient } from "@prisma/client";
import { prisma } from "../api/db/client";
import { AccountStateManager } from "../utils/account-state-manager";
import { AccountInfo } from "../api/router/account";

// electron中不能直接用prisma或其它数据通信。所以统一通过trpc来做数据处理。
// 但是在ipcRenderer可直接用prisma。且用trpc会有bug，所以在handler中直接用

function isEqual(element:string, account: string) {
  return (element === account);
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
    const accounts = await this.prisma.account.findMany({ where: { valid: true } });
    const arr = AccountStateManager.getInstance().getLoginUserList();
    const results:AccountInfo[] = [];

    accounts.forEach((item)=>{
      AccountStateManager.getInstance().addAccount(item.account)
    })

    accounts.forEach((item)=>{
      const accountInfo:AccountInfo = {...item}
      accountInfo.isLogin = arr.some((element=>isEqual(element, item.account)));
      const accountState = AccountStateManager.getInstance().getAccountState(item.account);
      accountInfo.workState = accountState?.workState;
      results.push(accountInfo)
    })

    return results;
  }

  public async getInvalidAccount(): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({ where: { valid: false } });
    accounts.forEach((value)=>{
      AccountStateManager.getInstance().addAccount(value.account)
    })
    return accounts;
  }

  public async add(
    account: string,
    password: string,
    isShort: boolean,
    isEnterprise: boolean
  ): Promise<void> {
    await this.prisma.account.create({
      data: {
        account: account,
        password: password,
        isShort: isShort,
        isEnterprise: isEnterprise,
        valid: true,
      },
    });
  }

  public async remove(id: number): Promise<void> {
    await this.prisma.account.delete({ where: { id: id } });
  }

  public async invalidUser(account: string): Promise<void> {
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
}
