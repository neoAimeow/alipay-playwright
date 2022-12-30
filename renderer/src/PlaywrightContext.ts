import { createContext } from "react";

// export interface IPlaywrightContext {
//   isLogin: boolean;
//   setIsLogin: () => {};
// }

export const MyContext = createContext({
  isLogin: true,
  setIsLogin: (isLogin: boolean) => {},
});
