import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { Button, Card, Checkbox, Form, Input, Space, Modal } from "antd";
import { trpc } from "../../../../utils/trpc";
import {
  defaultSystemConfig,
  SystemConfig,
} from "../../../../api/types/config";
import { MyContext } from "../../PlaywrightContext";
import NumericInput from "./numeric-input";
import { CheckboxChangeEvent } from "antd/lib/checkbox";

const ConfigView: React.FC = () => {
  const [timeoutValue, setTimeoutValue] = useState<string>("15");
  const [autoLoginAlipay, setAutoLoginAlipay] = useState<boolean>(false);
  const [closeWindowsChecked, setCloseWindowsChecked] =
    useState<boolean>(false);
  const storeMutation = trpc.store.setStore.useMutation();
  const deleteStoreMutation = trpc.store.deleteMany.useMutation();
  const heartDownMutation = trpc.user.heartBeatDown.useMutation();
  const context = trpc.useContext();
  const myContext = useContext(MyContext);

  const onFinish = () => {
    const config: SystemConfig = {
      timeoutDuration: Number(timeoutValue),
      isCloseWindow: closeWindowsChecked,
      autoLoginAlipay: autoLoginAlipay,
    };
    console.error("systemConfig", config);
    storeMutation.mutate({ key: "system_config", value: config });
    Modal.success({
      title: "确认",
      content: "保存成功",
    });
  };

  useLayoutEffect(() => {
    const getConfig = async () => {
      context.store.getStore.refetch();
      const config = ((await context.store.getStore.fetch({
        key: "system_config",
      })) as SystemConfig) ?? {
        timeoutDuration: 15,
        isCloseWindow: true,
      };
      console.error("setCloseWindowsChecked", config);
      setCloseWindowsChecked(
        config.isCloseWindow ?? defaultSystemConfig.isCloseWindow
      );
      setAutoLoginAlipay(
        config.autoLoginAlipay ?? defaultSystemConfig.autoLoginAlipay
      );
      setTimeoutValue(
        `${config.timeoutDuration}` ?? defaultSystemConfig.timeoutDuration
      );
    };
    getConfig().catch(() => {});
  }, []);

  return (
    <div className="dash-card">
      <Card title="设置" bordered={false}>
        <Space direction="vertical">
          <div>当前版本号：1.0.13</div>
          <NumericInput
            style={{ width: 120 }}
            value={timeoutValue}
            onChange={setTimeoutValue}
          />
          <Checkbox
            checked={closeWindowsChecked}
            onChange={(e: CheckboxChangeEvent) => {
              setCloseWindowsChecked(e.target.checked);
            }}
          >
            支付时是否隐藏窗口（重启生效）
          </Checkbox>
          <Checkbox
            checked={autoLoginAlipay}
            onChange={(e: CheckboxChangeEvent) => {
              setAutoLoginAlipay(e.target.checked);
            }}
          >
            自动登录支付宝
          </Checkbox>

          <Space>
            <Button type="primary" htmlType="submit" onClick={onFinish}>
              保存设置
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              onClick={async () => {
                await heartDownMutation.mutateAsync();
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
                    myContext.setIsLogin(false);
                  },
                });
              }}
            >
              退出登录
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default ConfigView;
