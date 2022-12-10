import { PrismaClient } from "@prisma/client";

export type supportType =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | undefined
  | string[]
  | unknown;

export class CacheManager {
  private static instance: CacheManager | undefined;

  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(prisma);
    }

    return CacheManager.instance;
  }

  public async getStore(key: string): Promise<supportType> {
    const cache = await this.prisma.cache.findFirst({
      where: { key: key },
    });
    if (cache) {
      const data = JSON.parse(cache.value) as { obj: supportType };
      return data.obj;
    } else {
      return undefined;
    }
  }

  public async setStore(key: string, value: supportType) {
    if (!key || !value) {
      return;
    }
    const insertStr: string = JSON.stringify({
      obj: value,
    });

    const data = await this.prisma.cache.findFirst({
      where: { key: key },
    });

    if (data) {
      await this.prisma.cache.updateMany({
        data: {
          value: insertStr,
          version: {
            increment: 1,
          },
        },
        where: {
          id: data.id,
          version: data.version,
        },
      });
    } else {
      await this.prisma.cache.create({
        data: { key: key, value: insertStr },
      });
    }
    return true;
  }

  public async delete(key: string): Promise<boolean> {
    const data = await this.prisma.cache.findFirst({
      where: { key: key },
    });
    if (data) {
      await this.prisma.cache.delete({
        where: { id: data.id },
      });
    }

    return true;
  }
}
