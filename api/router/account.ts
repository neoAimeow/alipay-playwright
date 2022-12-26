import { t } from "../context";
import { z } from "zod";
import { AccountMapper } from "../../mapper/account.mapper";
import { Account } from "@prisma/client";
import {
  AccountState,
  AccountStateManager,
  WorkState,
} from "../../utils/account-state-manager";

export interface AccountInfo extends Account {
  isLogin?: boolean;
  workState?: WorkState;
  count?: number;
  payment?: number;
}

export const accountRouter = t.router({
  getValidAccount: t.procedure.query(async ({ ctx }) => {
    return AccountMapper.getInstance(ctx.prisma).getValidAccount();
  }),

  getInvalidAccount: t.procedure.query(async ({ ctx }) => {
    return AccountMapper.getInstance(ctx.prisma).getInvalidAccount();
  }),

  add: t.procedure
    .input(
      z.object({
        account: z.string(),
        password: z.string(),
        isShort: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      return AccountMapper.getInstance(ctx.prisma).add(
        input.account,
        input.password,
        input.isShort
      );
    }),

  updateAccount: t.procedure
    .input(
      z.object({
        id: z.number(),
        password: z.string(),
        isShort: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      return AccountMapper.getInstance(ctx.prisma).update(
        input.id,
        input.password,
        input.isShort
      );
    }),

  remove: t.procedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      return AccountMapper.getInstance(ctx.prisma).remove(input.id);
    }),

  loginAccount: t.procedure
    .input(z.object({ account: z.string() }))
    .mutation(({ input }) => {
      return AccountStateManager.getInstance().loginAccount(input.account);
    }),

  offsetLoginAccount: t.procedure
    .input(z.object({ account: z.string() }))
    .mutation(({ input }) => {
      return AccountStateManager.getInstance().offsetLoginAccount(
        input.account
      );
    }),

  getLoginUserList: t.procedure.query(() => {
    return AccountStateManager.getInstance().getLoginUserList();
  }),

  validAccount: t.procedure
    .input(z.object({ account: z.string() }))
    .mutation(({ ctx, input }) => {
      return AccountMapper.getInstance(ctx.prisma).validUser(input.account);
    }),

  invalidAccount: t.procedure
    .input(z.object({ id: z.number(), reason: z.string() }))
    .mutation(({ ctx, input }) => {
      return AccountMapper.getInstance(ctx.prisma).invalidUser(
        input.id,
        input.reason
      );
    }),

  disableAccount: t.procedure
    .input(z.object({ account: z.string() }))
    .mutation(({ ctx, input }) => {
      return AccountMapper.getInstance(ctx.prisma).disableAccount(
        input.account
      );
    }),

  accountToWork: t.procedure
    .input(z.object({ account: z.string() }))
    .mutation(({ input }) => {
      return AccountStateManager.getInstance().accountToWork(input.account);
    }),

  accountToOnCall: t.procedure
    .input(z.object({ account: z.string() }))
    .mutation(({ input }) => {
      return AccountStateManager.getInstance().accountToOnCall(input.account);
    }),

  accountToError: t.procedure
    .input(z.object({ account: z.string() }))
    .mutation(({ input }) => {
      return AccountStateManager.getInstance().accountToError(input.account);
    }),
});
