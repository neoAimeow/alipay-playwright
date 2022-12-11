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
// import promiseIpc from "electron-promise-ipc";

import { trpc } from "../../../../utils/trpc";
import { AccountInfo } from "../../../../api/router/account";
import { Order } from "../../../../api/router/order";

interface AccountRef {
  account?: string;
  password?: string;
  isShort?: boolean;
  isEnterprise?: boolean;
}

const accountModal = (param: {
  type: "create"|"update",
  ref: {
    current: AccountRef;
  };
  onOk?: (ref: AccountRef) => void;
  id?: number;
  account?: AccountInfo
}) => {
  Modal.confirm({
    title: param.type === "create" ? "创建帐号":"修改帐号",
    icon: <FormOutlined />,
    content: (
      <div>
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Input
            value={param.type === "create" ? "" : param.account?.account ?? ""}
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
          <Space>
            <Checkbox
              onChange={({ target: { value } }) => {
                param.ref.current.isShort = value as boolean;
              }}
            >
              是否为短密码
            </Checkbox>
            <Checkbox
              onChange={({ target: { value } }) => {
                console.error(value);
                param.ref.current.isEnterprise = value as boolean;
              }}
            >
              是否为企业帐号
            </Checkbox>
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
  const [orders, setOrders] = useState<Order[]>([])

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
      setOrders(orders)
    };
    fetchData().catch((ex) => {
      console.error(ex);
    });
  }, [context.account.getInvalidAccount, context.account.getValidAccount, context.order.getOrder]);

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
                    const {
                      account,
                      password,
                      isShort = false,
                      isEnterprise = false,
                    } = ref;
                    if (
                      !account ||
                      account == "" ||
                      password == "" ||
                      !password
                    ) {
                      return;
                    }
                    accountAddMutation.mutate({
                      account: account,
                      password: password,
                      isShort: isShort,
                      isEnterprise: isEnterprise,
                    });
                  },
                });
              }}
            >
              添加帐号
            </Button>

            <Button
              type="primary"
              shape="round"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                window.playwright.login();
              }}
            >
              批量添加
            </Button>

            <Button
              type="primary"
              shape="round"
              icon={<PlaySquareOutlined />}
              size="large"
              onClick={() => {

              }}
            >
              启动
            </Button>
          </Space>

          <Table
            key="id"
            dataSource={accounts}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            <Column title="id" dataIndex="id" key="id" width={50} />
            <Column
              title="支付宝帐号"
              dataIndex="account"
              key="id"
              width={300}
            />
            <Column
              title="是否为企业帐号"
              dataIndex="isEnterprise"
              width={150}
              key="isEnterprise"
              render={(record) => <div>{record ? "是" : "否"}</div>}
            />
            <Column
              title="是否短密码"
              dataIndex="isShort"
              key="isShort"
              width={120}
              render={(record) => <div>{record ? "是" : "否"}</div>}
            />
            <Column
              title="是否已登录"
              dataIndex="isLogin"
              key="isLogin"
              width={120}
              render={(record) => <div>{record ? "是" : "否"}</div>}
            />
            <Column title="工作状态" dataIndex="state" key="name" width={120} />
            <Column title="支付单数" dataIndex="count" key="count" width={120} />
            <Column title="支付金额" dataIndex="payment" key="payment" width={120} />
            <Column
              title="操作"
              dataIndex="id"
              key="id"
              render={(value, record) => (
                <div>
                  <Space>
                    <Button
                      onClick={() => {
                        const invalidAccountMutate = async () => {
                          await accountInvalidAccountMutation.mutateAsync({
                            id: value as number,
                          });
                        };
                        invalidAccountMutate()
                          .then(() => {
                            reloadData();
                          })
                          .catch((ex) => {
                            console.error(ex)
                          });
                      }}
                    >
                      设为失效
                    </Button>

                    <Button
                      onClick={() => {
                        console.error(1111, record)
                        accountModal({
                          ref: inputValueRef,
                          type: "update",
                          account: record as AccountInfo,
                          onOk: (ref: AccountRef) => {
                            const {
                              password,
                              isShort = false,
                              isEnterprise = false,
                            } = ref;
                            if (
                              password == "" ||
                              !password
                            ) {
                              return;
                            }
                            accountUpdateMutation.mutate({
                              id: value as number,
                              password: password,
                              isShort: isShort,
                              isEnterprise: isEnterprise,
                            });
                          },
                        });
                      }}
                    >
                      编辑
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
                            console.error(ex)
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

        <Card title="订单列表" bordered={false} style={{ width: "100%" }}>
          <Table
            key="id"
            dataSource={orders}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            <Column title="id" dataIndex="id" key="id" width={50} />
            <Column
              title="kfcOrderId"
              dataIndex="kfcOrderId"
              key="kfcOrderId"
              width={300}
            />
            <Column
              title="支付链接"
              dataIndex="payUrl"
              key="payUrl"
              render={(value) => (
                <div>
                  <a href={value as string}>支付链接</a>
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
            <Column title="id" dataIndex="id" key="id" width={50} />
            <Column
              title="支付宝帐号"
              dataIndex="account"
              key="id"
              width={300}
            />
            <Column
              title="操作"
              dataIndex="account"
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
                       console.error(ex)
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
                       console.error(ex)
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
