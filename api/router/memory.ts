import { t } from "../context";
import { z } from "zod";
import { supportType } from "../../utils/cache";

export const cacheMap = new Map<string, supportType>();

export const Memory_Enum = ["is_login", "username", "token"] as const;

export const memoryRouter = t.router({
  getMemory: t.procedure
    .input(z.object({ key: z.enum(Memory_Enum) }))
    .query(({ input }) => {
      return cacheMap.get(input.key);
    }),
  setMemory: t.procedure
    .input(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    )
    .mutation(({ input }) => {
      cacheMap.set(input.key, input.value);
      return true;
    }),
  deleteMemory: t.procedure
    .input(z.object({ key: z.string() }))
    .mutation(({ input }) => {
      cacheMap.delete(input.key);
      return true;
    }),
});
