import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, Card, Checkbox, Form, Input, Modal, Space } from "antd";
import { trpc } from "../../../../utils/trpc";
import { TRPCError } from "@trpc/server";
import { FormOutlined } from "@ant-design/icons";
import { defaultUrl } from "../../../../utils/type";

interface ModelRef {
  hostUrl?: string;
}

const showModal = (param: {
  ref: {
    current: ModelRef;
  };
  hostUrl: string;
  onOk?: (ref: ModelRef) => void;
}) => {
  const { hostUrl = defaultUrl } = param;
  const modal = Modal.info({
    width: 600,
    title: "设置域名",
    icon: <FormOutlined />,
    closable: true,
    cancelText: null,
    okText: "设置",
    content: (
      <div style={{ width: "100%" }}>
        <Space>
          <Input
            style={{ width: 400 }}
            placeholder="请输入域名"
            defaultValue={hostUrl}
            onChange={({ target: { value } }) => {
              param.ref.current.hostUrl = value;
            }}
          />

          <Button
            onClick={() => {
              param.ref.current.hostUrl = defaultUrl;
              param.onOk?.(param.ref.current);
              param.ref.current = {};
              modal.destroy();
            }}
          >
            重置
          </Button>
        </Space>
      </div>
    ),

    onOk: () => {
      param.onOk?.(param.ref.current);
      param.ref.current = {};
    },
  });
};

interface LoginViewProps {
  isLoginCallBack: () => void;
}

const LoginView = (props: LoginViewProps) => {
  const { isLoginCallBack } = props;
  const inputValueRef = useRef<ModelRef>({});

  const userContext = trpc.useContext().user;
  const storeContext = trpc.useContext().store;

  const userNameQuery = trpc.store.getStore.useQuery({ key: "input_username" });
  const passwordQuery = trpc.store.getStore.useQuery({ key: "input_password" });
  const autoLoginQuery = trpc.store.getStore.useQuery({
    key: "input_autoLogin",
  });

  const storeMutation = trpc.store.setStore.useMutation();
  const heartBeatMutation = trpc.user.heartBeat.useMutation();

  const loginFunc = (usernameParam: string, passwordParam: string) => {
    userContext.login
      .fetch({
        username: usernameParam,
        password: passwordParam,
      })
      .then((res) => {
        storeMutation.mutate({ key: "userInfo", value: res });
        storeMutation.mutate({ key: "is_login", value: "true" });
        storeMutation.mutate({ key: "username", value: usernameParam });
        document.title = usernameParam;
        res.token && storeMutation.mutate({ key: "token", value: res.token });
        setInterval(() => {
          // 开启心跳包
          heartBeatMutation.mutate();
        }, 15000);

        isLoginCallBack();
      })
      .catch((ex) => {
        Modal.error({
          title: "登录失败",
          content: (ex as TRPCError).message,
        });
      });
  };

  useLayoutEffect(() => {
    const prepare = async () => {
      try {
        await userNameQuery.refetch();
        await passwordQuery.refetch();
        await autoLoginQuery.refetch();
      } catch (ex) {}
    };

    prepare().then(() => {
      const username = userNameQuery.data ?? "";
      const password = passwordQuery.data ?? "";
      const autoLogin = autoLoginQuery.data ?? false;
      console.error("auto login", username, password, autoLogin);

      if (autoLogin) {
        if (username && password) {
          loginFunc(username as string, password as string);
        }
      }
    });
  }, [autoLoginQuery.data, passwordQuery.data, userNameQuery.data]);

  const onFinish = (values: Record<string, string | boolean>) => {
    const { un, pwd, al } = values;
    if (un && pwd) {
      al && storeMutation.mutate({ key: "input_autoLogin", value: al });
      un && storeMutation.mutate({ key: "input_username", value: un });
      pwd && storeMutation.mutate({ key: "input_password", value: pwd });

      loginFunc(un as string, pwd as string);
    }
  };

  return (
    <div
      className="login-card"
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Space direction="vertical">
        <Card title="KFC自动化支付工具" bordered={false} style={{ width: 400 }}>
          <Form
            name="basic"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 18 }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            autoComplete="off"
          >
            {/*<Form.Item label="域名设置" name="hostUrl">*/}
            {/*  <Input name="hostUrl" style={{ width: 520 }} />*/}
            {/*</Form.Item>*/}

            <Form.Item
              label="用户名:"
              name="un"
              rules={[{ required: true, message: "请输入登录帐号" }]}
            >
              <Input placeholder="请输入登录帐号" />
            </Form.Item>

            <Form.Item
              label="密码:"
              name="pwd"
              rules={[{ required: true, message: "密码不能为空" }]}
            >
              <Input.Password placeholder="请输入登录密码" />
            </Form.Item>

            <Form.Item
              name="al"
              valuePropName="checked"
              wrapperCol={{ offset: 18, span: 16 }}
            >
              <Checkbox>自动登录</Checkbox>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 1, span: 22 }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%", height: "45px" }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Button
          // type="primary"
          style={{ width: "100%", height: "45px", marginTop: "50px" }}
          onClick={async () => {
            const url = await storeContext.getStore.fetch({ key: "base_url" });
            console.error("showModal", url);

            showModal({
              ref: inputValueRef,
              hostUrl: url as string,
              onOk: (url) => {
                const { hostUrl } = url;
                storeMutation.mutate({ key: "base_url", value: hostUrl });
              },
            });
          }}
        >
          设置域名
        </Button>
      </Space>
    </div>
  );
};

export default LoginView;
