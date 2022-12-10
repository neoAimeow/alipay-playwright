import { OrderRecord, PrismaClient } from "@prisma/client";
import { AccountMapper } from "./account-mapper";
import { AccountStateManager } from "../utils/account-state-manager";
export class OrderRecordMapper {
  private static instance: OrderRecordMapper | undefined;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): OrderRecordMapper {
    if (!OrderRecordMapper.instance) {
      OrderRecordMapper.instance = new OrderRecordMapper(prisma);
    }

    return OrderRecordMapper.instance;
  }

  public async getAll(): Promise<OrderRecord[]> {
    return this.prisma.orderRecord.findMany();
  }

  public async getRecordWithAccountId(accountId: number): Promise<OrderRecord[]> {
    return this.prisma.orderRecord.findMany({where:{accountId: accountId}})
  }

  public async getPaymentInfoWithAccountId(accountId: number): Promise<{count:number; payment:number}> {
    const count = await this.prisma.orderRecord.count({
      where: {
        accountId
      },
    })

    const aggregations = await this.prisma.orderRecord.aggregate({
      _sum: {
        payment:true
      },
      where: {accountId}
    })

    return {count, payment:aggregations._sum.payment ?? 0}
  }

  public async addRecord(accountId: number, payment: number): Promise<void> {
    await this.prisma.orderRecord.create({
      data: {
        accountId: accountId,
        payment: payment,
      },
    });
  }

  public async removeRecord(id: number): Promise<void> {
    await this.prisma.orderRecord.delete({where:{id:id}})
  }

}
