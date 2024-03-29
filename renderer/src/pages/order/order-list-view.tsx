import React from "react";
import { Button, Card, Checkbox, Form, Input } from "antd";

const OrderListView: React.FC = () => {
  const onFinish = (values: Record<string, string | boolean>) => {
    const { link } = values;
    const order1 = {
      id: 1,
      payUrl: link,
    };
    window.playwright.pay([order1]);
    // window.playwright.pay(new Order());
    // payIpc(link as string);
  };
  return (
    <div className="dash-card">
      <Card title="订单列表" bordered={false} style={{ width: "100%" }}>
        <Form
          name="basic"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="支付链接:"
            name="link"
            rules={[{ required: true, message: "请输入支付链接" }]}
          >
            <Input placeholder="请输入支付链接" />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 1, span: 22 }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", height: "45px" }}
            >
              支付
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default OrderListView;
