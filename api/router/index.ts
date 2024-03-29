import { t } from "../context";
import { accountRouter } from "./account";
import { orderRecordRouter } from "./order-record";
import { storeRouter } from "./store";
import { userRouter } from "./user";
import { orderRouter } from "./order";
import { memoryRouter } from "./memory";

export const appRouter = t.router({
  account: accountRouter,
  orderRecord: orderRecordRouter,
  store: storeRouter,
  user: userRouter,
  order: orderRouter,
  memory: memoryRouter,
});

export type AppRouter = typeof appRouter;
