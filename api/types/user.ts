export interface UserInfo {
  token: string;
  info: User;
}

export interface User {
  id: number;
  shop_name: string;
  password: string;
  remark: string;
  created: Date;
  agiso_token: string;
  config: any;
  promotions: Record<string, unknown>;
  KFCAccounts: Record<string, unknown>;
  alipays: Record<string, unknown>;
}
