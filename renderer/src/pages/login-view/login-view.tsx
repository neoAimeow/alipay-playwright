import React, {  useEffect } from "react";
import { Button, Card, Checkbox, Form, Input, Modal } from "antd";
import { trpc } from "../../../../utils/trpc";
import { TRPCError } from "@trpc/server";
import { useNavigate } from "react-router-dom";

const LoginView: React.FC = () => {
  const navigate = useNavigate();

  const userContext = trpc.useContext().user;

  const userNameQuery = trpc.store.getStore.useQuery({ key: "username"});
  const passwordQuery = trpc.store.getStore.useQuery({ key: "password"});
  const autoLoginQuery = trpc.store.getStore.useQuery({ key: "autoLogin" });

  const storeMutation = trpc.store.setStore.useMutation();
  const memoryMutation = trpc.memory.setMemory.useMutation();
  const heartBeatMutation = trpc.user.heartBeat.useMutation();

  const loginFunc = (usernameParam: string, passwordParam: string) => {
    userContext.login
      .fetch({
        username: usernameParam,
        password: passwordParam,
      })
      .then((res) => {
        memoryMutation.mutate({ key: "userInfo", value: res });
        memoryMutation.mutate({ key: "is_login", value: "true" });
        res.token && memoryMutation.mutate({key: "token", value: res.token})
        setInterval(() => {
          // 开启心跳包
          heartBeatMutation.mutate({username: usernameParam})
        }, 15000)

        navigate("account");
      })
      .catch((ex) => {
        Modal.error({
          title: "登录失败",
          content: (ex as TRPCError).message,
        });
      });
  };

  useEffect(() => {
    const username = userNameQuery.data;
    const password = passwordQuery.data;
    const autoLogin = autoLoginQuery.data;
    console.error("auto login", username, password, autoLogin);

    if (autoLogin) {
      if (username && password) {
        loginFunc(username as string, password as string);
      }
    }
  }, [autoLoginQuery.data, passwordQuery.data, userNameQuery.data]);

  const onFinish = (values: Record<string, string | boolean>) => {
    const { un, pwd, al } = values;
    if (un && pwd) {
      al && storeMutation.mutate({ key: "autoLogin", value: al });
      un && storeMutation.mutate({ key: "username", value: un });
      pwd && storeMutation.mutate({ key: "password", value: pwd });
      loginFunc(un as string, pwd as string);
    }
  };

  return (
    <div className="login-card">
      <Card title="KFC自动化支付工具" bordered={false} style={{ width: 400 }}>
        <Form
          name="basic"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 18 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
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

          <Form.Item
            wrapperCol={{ offset: 1, span: 22 }}
          >
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
    </div>
  );
};

export default LoginView;
