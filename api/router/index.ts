import { t } from "../context";
import { accountRouter } from "./account";
import { orderRecordRouter } from "./order-record";
import { storeRouter } from "./store";

export const appRouter = t.router({
  account: accountRouter,
  orderRecord: orderRecordRouter,
  store: storeRouter,
});

export type AppRouter = typeof appRouter;
