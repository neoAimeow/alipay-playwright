import React, { useContext, useLayoutEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";
import "./style.css";
import { Outlet, useNavigate } from "react-router-dom";
import LoginView from "../login-view/login-view";
import { MyContext } from "../../PlaywrightContext";
import { trpc } from "../../../../utils/trpc";
import { SystemConfig } from "../../../../api/types/config";
// import eventBus from "../../../../utils/event";

const { Header, Content, Footer, Sider } = Layout;

const items: MenuProps["items"] = [
  { key: "1", icon: React.createElement(UserOutlined), label: "帐号管理" },
  // { key: "2", icon: React.createElement(UserOutlined), label: "订单状态" },
  // { key: "3", icon: React.createElement(UserOutlined), label: "运行日志" },
  { key: "4", icon: React.createElement(UserOutlined), label: "设置" },
];
const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const myContext = useContext(MyContext);
  const context = trpc.useContext();

  const onClick: MenuProps["onClick"] = (e) => {
    switch (e.key) {
      case "1":
        navigate("account");
        break;
      case "2":
        navigate("order-list");
        break;
      // case "3":
      //   navigate("log");
      //   break;
      case "4":
        navigate("config");
        break;
    }
  };
  return myContext.isLogin ? (
    <div className="home-view">
      <Layout hasSider>
        <Sider
          theme="light"
          width="150px"
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div className="logo">
            <img width="100" alt="logo" src={logo} />
          </div>
          <Menu
            theme="light"
            mode="inline"
            defaultSelectedKeys={["1"]}
            onClick={onClick}
            items={items}
          />
        </Sider>
        <Layout className="site-layout" style={{ marginLeft: 150 }}>
          <Header
            className="site-layout-background"
            style={{ padding: 0, backgroundColor: "#ffffff" }}
          />
          <Content
            style={{
              margin: "24px 16px 0",
              overflow: "initial",
              minHeight: "100vh",
            }}
          >
            <Outlet />
          </Content>
          <Footer style={{ textAlign: "center" }}>
            {/*Ant Design ©2018 Created by Ant UED*/}
          </Footer>
        </Layout>
      </Layout>
    </div>
  ) : (
    <LoginView
      isLoginCallBack={async () => {
        myContext.setIsLogin(true);

        const config = (await context.store.getStore.fetch({
          key: "system_config",
        })) as SystemConfig;
        console.error("config is ", config);
        if (config.autoLoginAlipay) {
          console.error("autoLogin and login alipay");
          myContext.setIsAlipayAccountLoading(true);
          await window.playwright.loginAll();
          myContext.setIsAlipayAccountLoading(false);
        }
      }}
    />
  );
};

export default HomeView;
