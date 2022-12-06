type supportType =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | unknown;

import { t } from "../context";
import { z } from "zod";

const map = new Map<string, supportType>();

export const Memory_Enum = ["Salmon", "Tuna", "Trout"] as const;

export const memoryRouter = t.router({
  getMemory: t.procedure
    .input(z.object({ key: z.enum(Memory_Enum) }))
    .query(({ input }) => {
      return map.get(input.key);
    }),
  setMemory: t.procedure
    .input(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    )
    .mutation(({ input }) => {
      map.set(input.key, input.value);
      return true;
    }),
  deleteMemory: t.procedure
    .input(z.object({ key: z.string() }))
    .mutation(({ input }) => {
      map.delete(input.key);
      return true;
    }),
});
