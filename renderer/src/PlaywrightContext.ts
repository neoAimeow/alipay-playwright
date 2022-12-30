import { createContext } from "react";

// export interface IPlaywrightContext {
//   isLogin: boolean;
//   setIsLogin: () => {};
// }

export const MyContext = createContext({
  isLogin: false,
  setIsLogin: (isLogin: boolean) => {},
  isAlipayAccountLogin: false,
  setIsAlipayAccountLogin: (isAlipayAccountLogin: boolean) => {},
});
