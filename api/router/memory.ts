import { t } from "../context";
import { z } from "zod";
import { supportType } from "../../utils/cache";

export const memoryMap = new Map<string, supportType>();

export const Memory_Enum = ["is_login", "username", "token", "login_user"] as const;

export const memoryRouter = t.router({
  getMemory: t.procedure
    .input(z.object({ key: z.enum(Memory_Enum) }))
    .query(({ input }) => {
      return memoryMap.get(input.key);
    }),
  setMemory: t.procedure
    .input(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    )
    .mutation(({ input }) => {
      memoryMap.set(input.key, input.value);
      return true;
    }),
  deleteMemory: t.procedure
    .input(z.object({ key: z.string() }))
    .mutation(({ input }) => {
      memoryMap.delete(input.key);
      return true;
    }),
});
