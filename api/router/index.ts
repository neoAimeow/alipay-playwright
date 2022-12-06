import { t } from "../context";
import { accountRouter } from "./account";
import { orderRecordRouter } from "./order-record";
import { storeRouter } from "./store";
import { userRouter } from "./login";
import { orderRouter } from "./order";

export const appRouter = t.router({
  account: accountRouter,
  orderRecord: orderRecordRouter,
  store: storeRouter,
  user: userRouter,
  order: orderRouter,
});

export type AppRouter = typeof appRouter;
