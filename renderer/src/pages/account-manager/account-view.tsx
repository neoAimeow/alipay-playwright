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

interface CreateAccountRef {
  account?: string;
  password?: string;
  isShort?: boolean;
  isEnterprise?: boolean;
}

const createAccountModal = (param: {
  ref: {
    current: CreateAccountRef;
  };
  onOk?: (ref: CreateAccountRef) => void;
  id?: number;
}) => {
  Modal.confirm({
    title: "创建帐号",
    icon: <FormOutlined />,
    content: (
      <div>
        <Input
          onChange={({ target: { value } }) => {
            param.ref.current.account = value;
          }}
        />
        <Input
          onChange={({ target: { value } }) => {
            param.ref.current.password = value;
          }}
        />
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
  const inputValueRef = useRef<CreateAccountRef>({});

  const context = trpc.useContext();

  const accountAddMutation = trpc.account.add.useMutation();
  const accountInvalidAccountMutation =
    trpc.account.invalidAccount.useMutation();
  const accountValidAccountMutation = trpc.account.validAccount.useMutation();

  useLayoutEffect(() => {
    reloadData();
  }, []);

  const reloadData = useCallback(() => {
    const fetchData = async () => {
      const validAccount = await context.account.getValidAccount.fetch();
      setAccounts(validAccount);

      const invalidAccount = await context.account.getInvalidAccount.fetch();
      setInvalidAccounts(invalidAccount);
    };
    fetchData().catch((ex) => {
      console.error(ex);
    });
  }, [context.account.getInvalidAccount, context.account.getValidAccount]);

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
                createAccountModal({
                  ref: inputValueRef,
                  onOk: (ref: CreateAccountRef) => {
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
                // const data = await trpcClient.account.getValidAccount.query();
                // console.error(1111, data);
                window.playwright.login();
                // ipcRenderer.send("launchPlaywright");
              }}
            >
              批量添加
            </Button>

            <Button
              type="primary"
              shape="round"
              icon={<PlaySquareOutlined />}
              size="large"
              onClick={async () => {
                // window.playwright.login();
                // accountLoginMutation.mutate({account:"2547960062@qq.com"})
                // const list = await context.account.getValidAccount.fetch();
                // setAccounts(list)
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
            <Column
              title="操作"
              dataIndex="account"
              key="account"
              render={(value) => (
                <div>
                  <Button
                    onClick={() => {
                      const invalidAccountMutate = async () => {
                        await accountInvalidAccountMutation.mutateAsync({
                          account: value as string,
                        });
                      };
                      invalidAccountMutate()
                        .then(() => {
                          reloadData();
                        })
                        .catch(() => {});
                    }}
                  >
                    设为失效
                  </Button>
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
              title="操作"
              dataIndex="account"
              key="account"
              render={(value) => (
                <div>
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
                        .catch(() => {});
                    }}
                  >
                    恢复正常
                  </Button>
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
