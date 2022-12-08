import { Account, PrismaClient } from "@prisma/client";

// electron中不能直接用prisma或其它数据通信。所以统一通过trpc来做数据处理。
// 但是在ipcRenderer可直接用prisma。且用trpc会有bug，所以在handler中直接用
export class Mapper {
  private static instance: Mapper | undefined;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): Mapper {
    if (!Mapper.instance) {
      Mapper.instance = new Mapper(prisma);
    }

    return Mapper.instance;
  }

  public getValidAccount(): Promise<Account[]> {
    return this.prisma.account.findMany({ where: { valid: true } });
  }

  public getInvalidAccount(): Promise<Account[]> {
    return this.prisma.account.findMany({ where: { valid: false } });
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
}
