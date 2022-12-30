import React, { useContext, useEffect, useState } from "react";
import { Button, Card, Checkbox, Form, Input, Tooltip, Modal } from "antd";
import { trpc } from "../../../../utils/trpc";
import { SystemConfig } from "../../../../api/types/config";
import { MyContext } from "../../PlaywrightContext";

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
  const deleteStoreMutation = trpc.store.deleteMany.useMutation();
  const heartDownMutation = trpc.user.heartBeatDown.useMutation();
  const context = useContext(MyContext);

  const onFinish = (values: Record<string, number | string | boolean>) => {
    console.error("保存成功");
    const {
      timeoutDuration,
      //  isOpenSound,
      isCloseWindow,
    } = values;
    const config: SystemConfig = {
      timeoutDuration: timeoutDuration as number,
      // isOpenSound: isOpenSound as boolean,
      isCloseWindow: isCloseWindow as boolean,
    };
    storeMutation.mutate({ key: "system_config", value: config });
    Modal.success({
      title: "确认",
      content: "保存成功",
    });
  };

  return (
    <div className="dash-card">
      <Card title="设置" bordered={false}>
        <div>当前版本号：1.0.7</div>
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

          {/*<Form.Item name="isOpenSound" valuePropName="checked">*/}
          {/*  <Checkbox>是否打开提示音</Checkbox>*/}
          {/*</Form.Item>*/}

          <Form.Item name="isCloseWindow" valuePropName="checked">
            <Checkbox>支付时是否隐藏窗口（重启生效）</Checkbox>
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
          onClick={async () => {
            await heartDownMutation.mutate();
            await deleteStoreMutation.mutateAsync({
              keys: [
                "input_username",
                "input_password",
                "input_autoLogin",
                "userInfo",
                "token",
                "",
              ],
            });
            await storeMutation.mutateAsync({
              key: "is_login",
              value: "false",
            });
            Modal.success({
              title: "确认",
              content: "登出成功",
              onOk: () => {
                context.setIsLogin(false);
              },
            });
          }}
        >
          退出登录
        </Button>
      </Card>
    </div>
  );
};

export default ConfigView;
