import React, { useEffect, useState } from "react";
import { Button, Card, Checkbox, Form, Input, Tooltip, Modal } from "antd";
import { trpc } from "../../../../utils/trpc";
import { SystemConfig } from "../../../../api/types/config";
import { useLocation } from "react-router-dom";

interface NumericInputProps {
  style: React.CSSProperties;
  value: string;
  onChange: (value: string) => void;
}

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const NumericInput = (props: NumericInputProps) => {
  const { value, onChange } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = e.target;
    const reg = /^-?\d*(\.\d*)?$/;
    if (reg.test(inputValue) || inputValue === "" || inputValue === "-") {
      onChange(inputValue);
    }
  };

  // '.' at the end or only '-' in the input box.
  const handleBlur = () => {
    let valueTemp = value;
    if (value.endsWith(".") || value === "-") {
      valueTemp = value.slice(0, -1);
    }
    onChange(valueTemp.replace(/0*(\d+)/, "$1"));
  };

  const title = value ? (
    <span className="numeric-input-title">
      {value !== "-" ? formatNumber(Number(value)) : "-"}
    </span>
  ) : (
    "请输入时间"
  );

  return (
    <Tooltip
      trigger={["focus"]}
      title={title}
      placement="topLeft"
      overlayClassName="numeric-input"
    >
      <Input
        {...props}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="输入时间(s)"
        maxLength={16}
      />
    </Tooltip>
  );
};

const ConfigView: React.FC = () => {
  const [value, setValue] = useState("");
  const storeMutation = trpc.store.setStore.useMutation();
  const deleteStoreMutation = trpc.store.delete.useMutation();
  const heartDownMutation = trpc.user.heartBeatDown.useMutation();
  const location = useLocation();

  const onFinish = (values: Record<string, number | string | boolean>) => {
    Modal.confirm({
      title: "确认",
      content: "是否修改设置?",
      okText: "是",
      cancelText: "否",
      onOk: () => {
        const { timeoutDuration, isOpenSound, isCloseWindow } = values;
        const config: SystemConfig = {
          timeoutDuration: timeoutDuration as number,
          isOpenSound: isOpenSound as boolean,
          isCloseWindow: isCloseWindow as boolean,
        };
        storeMutation.mutate({ key: "system_config", value: config });
      },
    });
  };

  // const onLogout = () => {};

  return (
    <div className="dash-card">
      <Card title="设置" bordered={false}>
        <Form
          name="basic"
          onFinish={onFinish}
          // onFinishFailed={onFinishFailed}
        >
          <Form.Item label="超时时间" name="timeoutDuration">
            <NumericInput
              style={{ width: 120 }}
              value={value}
              onChange={setValue}
            />
          </Form.Item>

          <Form.Item name="isOpenSound" valuePropName="checked">
            <Checkbox>是否打开提示音</Checkbox>
          </Form.Item>

          <Form.Item name="isCloseWindow" valuePropName="checked">
            <Checkbox>支付时是否隐藏窗口</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </Form.Item>
        </Form>

        <Button
          type="primary"
          htmlType="submit"
          onClick={() => {
            deleteStoreMutation.mutate({ key: "input_username" });
            deleteStoreMutation.mutate({ key: "input_password" });
            deleteStoreMutation.mutate({ key: "input_autoLogin" });
            heartDownMutation.mutate();
            deleteStoreMutation.mutate({ key: "userInfo" });
            deleteStoreMutation.mutate({ key: "token" });
            storeMutation.mutate({ key: "is_login", value: "false" });
          }}
        >
          退出登录
        </Button>
      </Card>
      {/*<Button*/}
      {/*  type="primary"*/}
      {/*  onClick={onLogout}*/}
      {/*  style={{ marginLeft: 10, marginTop: 30 }}*/}
      {/*>*/}
      {/*  退出登录*/}
      {/*</Button>*/}
    </div>
  );
};

export default ConfigView;
