export interface SystemConfig {
  timeoutDuration?: number;
  isCloseWindow?: boolean;
  autoLoginAlipay?: boolean;
}

export const defaultSystemConfig = {
  timeoutDuration: 15,
  isCloseWindow: true,
  autoLoginAlipay: false,
};
