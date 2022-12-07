import { contextBridge, ipcRenderer } from "electron";

import React, { useEffect, useRef } from "react";
import { Button, Card, Space, Table, Input, Modal, Checkbox } from "antd";
import Column from "antd/es/table/Column";
import {
  PlusOutlined,
  PlaySquareOutlined,
  FormOutlined,
} from "@ant-design/icons";
// import promiseIpc from "electron-promise-ipc";

import { trpc } from "../../../../utils/trpc";
import { useNavigate } from "react-router-dom";
import { record } from "zod";

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
  const navigate = useNavigate();
  const inputValueRef = useRef<CreateAccountRef>({});

  const validAccounts = trpc.account.getValidAccount.useQuery();
  const invalidAccounts = trpc.account.getInvalidAccount.useQuery();
  const accountMutation = trpc.account.add.useMutation();
  const mutation = trpc.store.setStore.useMutation();
  return (
    <div className="card">
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
                  console.error(1111, ref);
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
                  accountMutation.mutate({
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
            onClick={() => {}}
          >
            批量添加
          </Button>

          <Button
            type="primary"
            shape="round"
            icon={<PlaySquareOutlined />}
            size="large"
          >
            启动
          </Button>
        </Space>

        <Table
          key="id"
          dataSource={validAccounts.data}
          rowKey={(record: { id: number }) => `${record.id}`}
          style={{ marginTop: "20px" }}
        >
          <Column title="id" dataIndex="id" key="id" width={50} />
          <Column title="支付宝帐号" dataIndex="account" key="id" />
          <Column
            title="是否为企业帐号"
            dataIndex="isEnterprise"
            key="isEnterprise"
            render={(record) => <div>{record}</div>}
          />
          <Column title="是否为长密码" dataIndex="isShort" key="isShort" />
          <Column title="是否已登录" dataIndex="isAlipayLogin" key="name" />
          <Column title="工作状态" dataIndex="state" key="name" />
          <Column title="操作" dataIndex="state" key="name" />
        </Table>
      </Card>
    </div>
  );
};

export default AccountView;
