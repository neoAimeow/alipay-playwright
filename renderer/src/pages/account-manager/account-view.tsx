import React, {
  useCallback,
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
    title: param.type === "create" ? "创建帐号" : "修改帐号",
    icon: <FormOutlined />,
    content: (
      <div>
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Input
            placeholder={
              param.type === "create" ? "" : param.account?.account ?? ""
            }
            disabled={param.type !== "create"}
            onChange={({ target: { value } }) => {
              param.ref.current.account = value;
            }}
          />
          <Input
            onChange={({ target: { value } }) => {
              param.ref.current.password = value;
            }}
          />
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
  const [orders, setOrders] = useState<Order[]>([]);

  const context = trpc.useContext();

  const accountAddMutation = trpc.account.add.useMutation();
  const accountUpdateMutation = trpc.account.updateAccount.useMutation();
  const accountInvalidAccountMutation =
    trpc.account.invalidAccount.useMutation();
  const accountValidAccountMutation = trpc.account.validAccount.useMutation();
  const accountDisableMutation = trpc.account.disableAccount.useMutation();

  useLayoutEffect(() => {
    reloadData();
  }, []);

  const reloadData = useCallback(() => {
    const fetchData = async () => {
      const validAccount = await context.account.getValidAccount.fetch();
      setAccounts(validAccount);

      const invalidAccount = await context.account.getInvalidAccount.fetch();
      setInvalidAccounts(invalidAccount);

      const orders = await context.order.getOrder.fetch();
      setOrders(orders);
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

            {/*<Button*/}
            {/*  type="primary"*/}
            {/*  shape="round"*/}
            {/*  icon={<PlusOutlined />}*/}
            {/*  size="large"*/}
            {/*  onClick={() => {*/}
            {/*    window.playwright.login();*/}
            {/*  }}*/}
            {/*>*/}
            {/*  批量添加*/}
            {/*</Button>*/}

            {/*  <Button*/}
            {/*    type="primary"*/}
            {/*    shape="round"*/}
            {/*    icon={<PlaySquareOutlined />}*/}
            {/*    size="large"*/}
            {/*    onClick={() => {*/}
            {/*      window.playwright.pay(orders);*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    启动*/}
            {/*  </Button>*/}
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
              render={(value, record) => (
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
                        onClick={() => {
                          window.playwright.login(record as AccountInfo);
                        }}
                      >
                        登录
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

        {/*<Card title="订单列表" bordered={false} style={{ width: "100%" }}>*/}
        {/*  <Table*/}
        {/*    key="kfcOrderId"*/}
        {/*    dataSource={orders}*/}
        {/*    rowKey={(record: { kfcOrderId: string | undefined }) =>*/}
        {/*      `${record.kfcOrderId}`*/}
        {/*    }*/}
        {/*    style={{ marginTop: "20px" }}*/}
        {/*  >*/}
        {/*    <Column*/}
        {/*      title="kfcOrderId"*/}
        {/*      dataIndex="kfcOrderId"*/}
        {/*      key="kfcOrderId"*/}
        {/*      width={50}*/}
        {/*    />*/}
        {/*    <Column*/}
        {/*      title="taobaoOrderId"*/}
        {/*      dataIndex="taobaoOrderId"*/}
        {/*      key="taobaoOrderId"*/}
        {/*      width={300}*/}
        {/*    />*/}
        {/*    <Column*/}
        {/*      title="支付链接"*/}
        {/*      dataIndex="payUrl"*/}
        {/*      key="payUrl"*/}
        {/*      render={(value) => (*/}
        {/*        <div>*/}
        {/*          <a href={value as string}>支付链接</a>*/}
        {/*        </div>*/}
        {/*      )}*/}
        {/*    />*/}
        {/*  </Table>*/}
        {/*</Card>*/}

        <Card title="失效帐号" bordered={false} style={{ width: "100%" }}>
          <Table
            key="id"
            dataSource={invalidAccounts}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            {/*<Column title="id" dataIndex="id" key="id" width={50} />*/}
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
