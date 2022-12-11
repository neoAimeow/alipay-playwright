import { Log, PrismaClient } from "@prisma/client";

export class LogMapper {
  private static instance: LogMapper | undefined;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): LogMapper {
    if (!LogMapper.instance) {
      LogMapper.instance = new LogMapper(prisma);
    }

    return LogMapper.instance;
  }

  public async getAllLog(): Promise<Log[]> {
    return this.prisma.log.findMany();
  }

  public async getLogWithAccountId(accountId: number): Promise<Log[]> {
    return this.prisma.log.findMany({
      where: { accountId: accountId },
    });
  }

  public async addLog(
    accountId: number,
    level: string,
    message: string
  ): Promise<void> {
    await this.prisma.log.create({
      data: {
        level: level,
        message: message,
        accountId: accountId,
      },
    });
  }
}
