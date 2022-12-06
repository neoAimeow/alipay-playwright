import React, { useState } from "react";
import { Button, Card, Checkbox, Form, Input, Modal } from "antd";
import { trpc } from "../../../../utils/trpc";
import { TRPCError } from "@trpc/server";
import { UserInfo } from "../../../../api/types/user";

const LoginView: React.FC = () => {
  // const validAccounts = trpc.account.getValidAccount.useQuery();

  const tContext = trpc.useContext();

  const onFinish = async (values: Record<string, string | boolean>) => {
    const { username, password, remember, autologin } = values;
    if (username && password) {
      try {
        const result: UserInfo = await tContext.user.login.fetch({
          username: username as string,
          password: password as string,
        });
      } catch (ex) {
        Modal.error({
          title: "登录失败",
          content: (ex as TRPCError).message,
        });
      }
    }
  };

  const onFinishFailed = (values: any) => {
    console.log("onFinishFailed:", values);
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
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="用户名:"
            name="username"
            rules={[{ required: true, message: "请输入登录帐号" }]}
          >
            <Input placeholder="请输入登录帐号" />
          </Form.Item>

          <Form.Item
            label="密码:"
            name="password"
            rules={[{ required: true, message: "密码不能为空" }]}
          >
            <Input.Password placeholder="请输入登录密码" />
          </Form.Item>

          <Form.Item
            name="remember"
            valuePropName="checked"
            wrapperCol={{ offset: 18, span: 16 }}
          >
            <Checkbox>记住密码</Checkbox>
          </Form.Item>

          <Form.Item
            name="autologin"
            valuePropName="autoLogin"
            wrapperCol={{ offset: 18, span: 16 }}
          >
            <Checkbox>自动登录</Checkbox>
          </Form.Item>

          <Form.Item
            wrapperCol={{ offset: 1, span: 22 }}
            // style={{ backgroundColor: '#000000' }}
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
