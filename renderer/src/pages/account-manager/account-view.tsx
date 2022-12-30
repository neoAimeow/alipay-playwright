import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button, Card, Space, Table, Input, Modal, Checkbox } from "antd";
import Column from "antd/es/table/Column";
import {
  PlusOutlined,
  PlaySquareOutlined,
  FormOutlined,
} from "@ant-design/icons";

import { trpc } from "../../../../utils/trpc";
import { AccountInfo } from "../../../../api/router/account";
import { Order } from "../../../../api/router/order";
import useIntervalAsync from "../../../../utils/use-interval";
import { containsOnlyNumber } from "../../../../utils/string-util";
import { MyContext } from "../../PlaywrightContext";

interface AccountRef {
  account?: string;
  password?: string;
}

const accountModal = (param: {
  type: "create" | "update";
  ref: {
    current: AccountRef;
  };
  onOk?: (ref: AccountRef) => void;
  id?: number;
  account?: AccountInfo;
}) => {
  Modal.confirm({
    title: param.type === "create" ? "添加帐号" : "修改帐号",
    icon: <FormOutlined />,
    content: (
      <div>
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Space>
            <div>支付宝帐号：</div>
            <Input
              placeholder={
                param.type === "create" ? "" : param.account?.account ?? ""
              }
              disabled={param.type !== "create"}
              onChange={({ target: { value } }) => {
                param.ref.current.account = value;
              }}
            />
          </Space>
          <Space>
            <div>支付密码：</div>
            <Input
              style={{ marginLeft: 14 }}
              onChange={({ target: { value } }) => {
                param.ref.current.password = value;
              }}
            />
          </Space>
        </Space>
      </div>
    ),
    onOk: () => {
      param.onOk?.(param.ref.current);
      param.ref.current = {};
    },
  });
};

const AccountView: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [invalidAccounts, setInvalidAccounts] = useState<AccountInfo[]>([]);
  const inputValueRef = useRef<AccountRef>({});
  const [loginLoadings, setLoginLoadings] = useState<boolean[]>([]);

  const context = trpc.useContext();

  const accountAddMutation = trpc.account.add.useMutation();
  const accountUpdateMutation = trpc.account.updateAccount.useMutation();
  const accountInvalidAccountMutation =
    trpc.account.invalidAccount.useMutation();
  const accountValidAccountMutation = trpc.account.validAccount.useMutation();
  const accountDisableMutation = trpc.account.disableAccount.useMutation();
  const myContext = useContext(MyContext);

  const enterLoginLoading = (index: number) => {
    setLoginLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings];
      newLoadings[index] = true;
      return newLoadings;
    });
  };

  const outLoginLoading = (index: number) => {
    setLoginLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings];
      newLoadings[index] = false;
      return newLoadings;
    });
  };

  const reloadData = useCallback(() => {
    const fetchData = async () => {
      const validAccount = await context.account.getValidAccount.fetch();
      setAccounts(validAccount);

      const invalidAccount = await context.account.getInvalidAccount.fetch();
      setInvalidAccounts(invalidAccount);

      const orders = await context.order.getOrder.fetch();
      window.playwright.pay(orders);
    };
    fetchData().catch((ex) => {
      console.error(ex);
    });
  }, []);

  useIntervalAsync(reloadData, 3000);

  return (
    <div className="card">
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title="帐号管理" bordered={false} style={{ width: "100%" }}>
          <Space>
            <Button
              type="primary"
              shape="round"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                accountModal({
                  ref: inputValueRef,
                  type: "create",
                  onOk: (ref: AccountRef) => {
                    const { account, password } = ref;
                    if (
                      !account ||
                      account == "" ||
                      password == "" ||
                      !password
                    ) {
                      return;
                    }

                    const isShort =
                      containsOnlyNumber(password) && password.length === 6;

                    accountAddMutation.mutate({
                      account: account,
                      password: password,
                      isShort: isShort,
                    });
                  },
                });
              }}
            >
              添加帐号
            </Button>
          </Space>

          <Table
            key="id"
            dataSource={accounts}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            <Column
              title="帐号"
              dataIndex="account"
              key="id"
              width={200}
              align="center"
            />
            <Column
              title="工作状态"
              dataIndex="isLogin"
              key="isLogin"
              width={120}
              align="center"
              render={(record) => (
                <div>
                  {record ? (
                    <div style={{ color: "green" }}>工作中</div>
                  ) : (
                    <div style={{ color: "red" }}>等待登录</div>
                  )}
                </div>
              )}
            />
            <Column
              title="单数"
              dataIndex="count"
              key="count"
              width={120}
              align="center"
            />
            <Column
              title="金额"
              dataIndex="payment"
              key="payment"
              width={120}
              align="center"
            />
            <Column
              title="操作"
              dataIndex="id"
              key="id"
              align="center"
              render={(value, record, index) => (
                <div>
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ display: "flex" }}
                  >
                    <Space>
                      <Button
                        onClick={() => {
                          const invalidAccountMutate = async () => {
                            await accountInvalidAccountMutation.mutateAsync({
                              id: value as number,
                              reason: "手动失效",
                            });
                          };
                          invalidAccountMutate()
                            .then(() => {
                              reloadData();
                            })
                            .catch((ex) => {
                              console.error(ex);
                            });
                        }}
                      >
                        设为失效
                      </Button>

                      <Button
                        onClick={() => {
                          accountModal({
                            ref: inputValueRef,
                            type: "update",
                            account: record as AccountInfo,
                            onOk: (ref: AccountRef) => {
                              const { password } = ref;
                              if (password == "" || !password) {
                                return;
                              }
                              const isShort =
                                containsOnlyNumber(password) &&
                                password.length === 6;

                              accountUpdateMutation.mutate({
                                id: value as number,
                                password: password,
                                isShort: isShort,
                              });
                            },
                          });
                        }}
                      >
                        编辑
                      </Button>
                    </Space>

                    <Space>
                      <Button
                        loading={
                          loginLoadings[index] ||
                          !myContext.isAlipayAccountLogin
                        }
                        disabled={(record as AccountInfo).isLogin}
                        onClick={async () => {
                          console.error(record);
                          enterLoginLoading(index);
                          await window.playwright.login(record as AccountInfo);
                          outLoginLoading(index);
                        }}
                      >
                        {(record as AccountInfo).isLogin ? "已登录" : "未登录"}
                      </Button>

                      <Button
                        onClick={() => {
                          const disableMutate = async () => {
                            await accountDisableMutation.mutateAsync({
                              account: value as string,
                            });
                          };
                          disableMutate()
                            .then(() => {
                              reloadData();
                            })
                            .catch((ex) => {
                              console.error(ex);
                            });
                        }}
                      >
                        删除帐号
                      </Button>
                    </Space>
                  </Space>
                </div>
              )}
            />
          </Table>
        </Card>

        <Card title="失效帐号" bordered={false} style={{ width: "100%" }}>
          <Table
            key="id"
            dataSource={invalidAccounts}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            <Column
              title="支付宝帐号"
              dataIndex="account"
              align="center"
              key="id"
              width={300}
            />
            <Column
              title="失效原因"
              dataIndex="invalidReason"
              align="center"
              key="id"
              width={300}
            />

            <Column
              title="操作"
              dataIndex="account"
              align="center"
              key="account"
              render={(value) => (
                <div>
                  <Space>
                    <Button
                      onClick={() => {
                        const validAccountMutate = async () => {
                          await accountValidAccountMutation.mutateAsync({
                            account: value as string,
                          });
                        };
                        validAccountMutate()
                          .then(() => {
                            reloadData();
                          })
                          .catch((ex) => {
                            console.error(ex);
                          });
                      }}
                    >
                      恢复正常
                    </Button>
                    <Button
                      onClick={() => {
                        const disableMutate = async () => {
                          await accountDisableMutation.mutateAsync({
                            account: value as string,
                          });
                        };
                        disableMutate()
                          .then(() => {
                            reloadData();
                          })
                          .catch((ex) => {
                            console.error(ex);
                          });
                      }}
                    >
                      删除帐号
                    </Button>
                  </Space>
                </div>
              )}
            />
          </Table>
        </Card>
      </Space>
    </div>
  );
};

export default AccountView;
