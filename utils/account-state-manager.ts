export enum WorkState {
  ON_CALL,
  IS_WORKING,
  ERROR_CAUSE,
}

export interface AccountState {
  isLogin: boolean;
  workState: WorkState;
}

export class AccountStateManager {
  private static instance: AccountStateManager | undefined;

  private constructor() {}

  public static getInstance(): AccountStateManager {
    if (!AccountStateManager.instance) {
      AccountStateManager.instance = new AccountStateManager();
    }

    return AccountStateManager.instance;
  }

  private accountMap = new Map<string, AccountState>();

  public addAccount(account: string): void {
    const accountObj = this.accountMap.get(account);
    // 如果已经往map中添加过，那就不需要再添加
    if (accountObj) {
      return;
    }

    this.accountMap.set(account, {
      isLogin: false,
      workState: WorkState.ON_CALL,
    });
  }

  public loginAccount(account: string): void {
    console.error("3333, subscribe", this.accountMap);
    const accountObj = this.accountMap.get(account);
    if (!accountObj) {
      return;
    }

    accountObj.isLogin = true;
  }

  public offsetLoginAccount(account: string): void {
    const accountObj = this.accountMap.get(account);
    if (!accountObj) {
      return;
    }
    accountObj.isLogin = false;
  }

  public getLoginUserList(): string[] {
    const arr: string[] = [];
    this.accountMap.forEach((value, key) => {
      if (value.isLogin) {
        arr.push(key);
      }
    });
    return arr;
  }

  public getAccountState(account: string): AccountState | undefined {
    return this.accountMap.get(account);
  }

  public accountToWork(account: string): void {
    this.changeWorkState(account, WorkState.IS_WORKING);
  }

  public accountToOnCall(account: string): void {
    this.changeWorkState(account, WorkState.ON_CALL);
  }

  public accountToError(account: string): void {
    this.changeWorkState(account, WorkState.ERROR_CAUSE);
  }

  private changeWorkState(account: string, state: WorkState): void {
    const accountObj = this.accountMap.get(account);
    if (!accountObj) {
      return;
    }

    accountObj.workState = state;
  }
}
