import { contextBridge, ipcRenderer } from "electron";

import React, { useEffect } from "react";
import { Button, Card, Space, Table } from "antd";
import Column from "antd/es/table/Column";
import { PlusOutlined, PlaySquareOutlined } from "@ant-design/icons";
// import promiseIpc from "electron-promise-ipc";

import { trpc } from "../../../../utils/trpc";
import { useNavigate } from "react-router-dom";

const AccountView: React.FC = () => {
  const navigate = useNavigate();
  const validAccounts = trpc.account.getValidAccount.useQuery();
  const invalidAccounts = trpc.account.getInvalidAccount.useQuery();
  // const store =
  const mutation = trpc.store.setStore.useMutation();
  const getAccount = trpc.store.getStore.useQuery({ key: "aaa" });
  const isLoginQuery = trpc.memory.getMemory.useQuery({ key: "is_login"});

  useEffect(()=> {
    if (!isLoginQuery.data ) {
      navigate("login");
    }
  }, [isLoginQuery.data])

  return (
    <div className="card">
      <Card title="帐号管理" bordered={false} style={{ width: "100%" }}>
        <div>{getAccount.data as string}</div>

        <Space>
          <Button
            type="primary"
            shape="round"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              window.playwrightPlay();
            }}
          >
            添加帐号
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
          <Column title="帐号" dataIndex="id" key="id" />
          <Column
            title="是否为企业帐号"
            dataIndex="isEnterprise"
            key="isEnterprise"
          />
          <Column title="是否已登录" dataIndex="name" key="name" />
          <Column title="工作状态" dataIndex="name" key="name" />
          {/* <Column
          title="是否启用"
          dataIndex="enabled"
          key="enabled"
          render={(record) => (record ? '启用' : '禁用')}
        /> */}
        </Table>
      </Card>
    </div>
  );
};

export default AccountView;
