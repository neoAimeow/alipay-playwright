import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button, Card, Space, Table, Input, Modal, Checkbox } from "antd";
import Column from "antd/es/table/Column";
import {
  PlusOutlined,
  PlaySquareOutlined,
  FormOutlined,
} from "@ant-design/icons";
// import promiseIpc from "electron-promise-ipc";

import { trpc } from "../../../../utils/trpc";
import { AccountInfo } from "../../../../api/router/account";
import { Order } from "../../../../api/router/order";

interface AccountRef {
  account?: string;
  password?: string;
  isShort?: boolean;
  isEnterprise?: boolean;
}

const accountModal = (param: {
  type: "create" | "update";
  ref: {
    current: AccountRef;
  };
  onOk?: (ref: AccountRef) => void;
  id?: number;
  account?: AccountInfo;
}) => {
  Modal.confirm({
    title: param.type === "create" ? "创建帐号" : "修改帐号",
    icon: <FormOutlined />,
    content: (
      <div>
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Input
            value={param.type === "create" ? "" : param.account?.account ?? ""}
            disabled={param.type !== "create"}
            onChange={({ target: { value } }) => {
              param.ref.current.account = value;
            }}
          />
          <Input
            onChange={({ target: { value } }) => {
              param.ref.current.password = value;
            }}
          />
          <Space>
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
          </Space>
        </Space>
      </div>
    ),
    onOk: () => {
      param.onOk?.(param.ref.current);
      param.ref.current = {};
    },
  });
};

const AccountView: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [invalidAccounts, setInvalidAccounts] = useState<AccountInfo[]>([]);
  const inputValueRef = useRef<AccountRef>({});
  const [orders, setOrders] = useState<Order[]>([]);

  const context = trpc.useContext();

  const accountAddMutation = trpc.account.add.useMutation();
  const accountUpdateMutation = trpc.account.updateAccount.useMutation();
  const accountInvalidAccountMutation =
    trpc.account.invalidAccount.useMutation();
  const accountValidAccountMutation = trpc.account.validAccount.useMutation();
  const accountDisableMutation = trpc.account.disableAccount.useMutation();

  useLayoutEffect(() => {
    reloadData();
  }, []);

  const reloadData = useCallback(() => {
    const fetchData = async () => {
      const validAccount = await context.account.getValidAccount.fetch();
      setAccounts(validAccount);

      const invalidAccount = await context.account.getInvalidAccount.fetch();
      setInvalidAccounts(invalidAccount);

      const orders = await context.order.getOrder.fetch();
      setOrders(orders);
    };
    fetchData().catch((ex) => {
      console.error(ex);
    });
  }, [
    context.account.getInvalidAccount,
    context.account.getValidAccount,
    context.order.getOrder,
  ]);

  return (
    <div className="card">
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title="帐号管理" bordered={false} style={{ width: "100%" }}>
          <Space>
            <Button
              type="primary"
              shape="round"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                accountModal({
                  ref: inputValueRef,
                  type: "create",
                  onOk: (ref: AccountRef) => {
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
                    accountAddMutation.mutate({
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
              onClick={() => {
                window.playwright.login();
              }}
            >
              批量添加
            </Button>

            <Button
              type="primary"
              shape="round"
              icon={<PlaySquareOutlined />}
              size="large"
              onClick={() => {
                const order1 = {
                  id: 1,
                  payUrl:
                    "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020222037133171&sign=Y9ERmPiLT%2B%2BJPjvZv8T637xvqqe8jYhu%2B1qC0NZtaZBNVKB7DUzoPmco74ws1f94cm2B226WGrzeTj%2B9U9GhocXyw48qDSAggSp2mCAs8r6Pleub62lROzCVl2gABRjtRN6lI43qDV9EkR0kasZtXsE3CbdlNSxohq%2B5sUgMRRs%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020222037133171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220025U99625075221007856&partner=2088311465207164&alipay_exterface_invoke_assign_sign=_d_n_alx_i_y_py_lm_q8s0t62e2_aovezx_f2fu_sva_o_p5q_ri5i6nahl_a7_sez_xew%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946435335472992%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                };
                const order2 = {
                  id: 2,
                  payUrl:
                    "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020220772351171&sign=T2S4z0E6PndpxMxCpij0cgR2vUnmeTFVNB%2Bp7f6Od5hCMmvCt3nBkcI4K%2BjJSgWpBuIwMriTag4f54HWZm8UK6r7DlFd2QnzYGg6CQSsfKVGa95kjckfs0tRuW%2FQTA2dsCgCyQtCFg5hdoB68iuvTSVGhoUz9vVO%2F%2Ft0h192dlE%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020220772351171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220050U00735934956278441&partner=2088311465207164&alipay_exterface_invoke_assign_sign=i_htcc_qf_n8eu_f_dcf_c_ch0_yqy_p_a_v_t_nn_h0fe_p0me_fmgpk%2B9g_vp_b4_y5_n_v_b_a%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946433899965280%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                };
                const order3 = {
                  id: 3,
                  payUrl:
                    "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221407788171&sign=oNllnUO3p4vkTQNCdsio9XRijDjJho81wh8HP2T2A0FEmxuOs49hLNiEfmyle1ZsTL47ahkX6jJxGGYawv59JHLLUZiMyQDWynW8rF0WGcvV7xfUqSknojsePwQI9iqgfB0poNfflfk6QhOP0ENQpztzdOVDFL2NWwtqN4DRQAY%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221407788171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220106U01400020787609889&partner=2088311465207164&alipay_exterface_invoke_assign_sign=_ml7_j_m_y_mc_jwx_aft_in_u4mdo17_l_yf_m_wqu_n_s6a_hz_p7_n_j_w_to_x_fw_wg%2F8qle_a%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946434478451552%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                };
                const order4 = {
                  id: 4,
                  payUrl:
                    "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020220934489171&sign=mFhP29PbxRK0XHBBkRfbR1kNG1zHRLNT41WqUtaL025REl8tnbLiHQlt2FF2DU9IVvgM6cPgt%2F36C3yvgi0F1N5o9%2FYIY5P67Npt8OfxQ3IRTX2Ve4nl2UmytnDJQUirVZM84pNM%2BtzlrClZgCVCckdwDp7M7o77PQRjMrrQeyg%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020220934489171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220126U02217572802697485&partner=2088311465207164&alipay_exterface_invoke_assign_sign=_f_cvw9%2B_p_sojga_su_llej3_m_i_dj8max_r%2Fpyc_z_qk2m_fwitc0kc_u_y_r2_o_n_m5_a%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946434478451552%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                };
                // const order5 = {
                //   id: 5,
                //   payUrl:
                //     "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221882720171&sign=UKFfYes4Tah3v1m2hcQh%2FczIoiOolEgiopjcPorSYQivUYMkr%2FEkp4mstsMTgkA3%2Fq%2B6ZHx5sO0auzARp1y9gGvg3Kf%2BQOc98MKvOYASdG8kNcIwxkOAG8jgQVU3W33DwLXTtnOneGMpyZ1MplUlJ5bUnZFDnIfU%2Bo%2BKSLG4A2M%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221882720171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220138U02609740268706745&partner=2088311465207164&alipay_exterface_invoke_assign_sign=i1_v_eegkhk_mai_l_q_q_gt0_x_e_tm_vh9_f%2B_l_j8_t0_btua_pfb_i_x_a%2Fz_vlf_ee8f_a0_q%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946434478451552%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                // };
                // const order6 = {
                //   id: 6,
                //   payUrl:
                //     "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221411383171&sign=jBaN16zf7oKWF0Rnk6XQHut1gPrkGm5kydjQ%2FWZUjrEVPWULXmWB%2BycQZ9yO4Alguk1cA4Rg9HCV0cCeeusF3pIz17d3FjNBN5TPWWjc5w6SNSS%2BjU4QTH%2F4ml%2B4TtjD5xbRSxZ6os2db66unHJPs900V1q11FFWEg4WFyxYiPo%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221411383171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220201U03593556584207522&partner=2088311465207164&alipay_exterface_invoke_assign_sign=_x5_tut_uofcx1_t_atd_d_u8_j_q_e_hue_d_ld_gckjk_nmps_u_nef9_pa%2Fju_p_bh_zjljw%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946434478451552%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                // };
                // const order7 = {
                //   id: 7,
                //   payUrl:
                //     "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221412013171&sign=Y0aU2CqxnBnQs5dYniK1WAFIaa77uSEWDR6%2FsON375fe7lt2NEj%2BR%2BoIj3KIsOtvc9vG%2Fqtajm9WWGdqbm5HPUB2R1i7SgVN5B8k52G4D%2BS3zoLZhuLUz7Q2EtSqWik8j%2FYerhJlHhGe6DDDiWQqZNd573hYBI7EtC2BBn3pAPY%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221412013171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220211U04005773968419360&partner=2088311465207164&alipay_exterface_invoke_assign_sign=_dq3intk%2Fw_o_zuz_h3t%2Fu6sr0_pvb48_t_x7b6_o_r_hy1_y_m_d_uh_m_jl89_i_rn_m_x_p_a%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946434478451552%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                // };
                // const order8 = {
                //   id: 8,
                //   payUrl:
                //     "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020220938399171&sign=myepEvhJeiEkjO1PEcFwKYtwwlptQifP5QE5wTTzZw23%2F1h08rgHn9e9F5FM2EDrROxS5ovOQmQR6qslDYzNzFpZ0QrHkhUql4wIAAEBTembeMw743Mnx6Yu3D6sUPJxbvUUC%2FY9OJpU23Dkk0JSoH82v%2FBmgZ%2BSfzEEqQXqJdk%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020220938399171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220224U04552332534524321&partner=2088311465207164&alipay_exterface_invoke_assign_sign=gl%2F_r_jd_f_i_n_e%2Bd2_v_iiqrm7to_l%2B_b_ba_uu_q_uhj_btp_ph%2B_w_i_t0_joxz_g_gk_y_pn_a%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946434478451552%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                // };
                // const order9 = {
                //   id: 9,
                //   payUrl:
                //     "https://mclient.alipay.com/home/exterfaceAssign.htm?_input_charset=utf-8&subject=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221886584171&sign=U94SOa0TKpEfIBBxhFUj4MiNiDhcCUUlevCV1Cn4bE9SJQ25XSMI1yt8n49IicM9K3AQrjdpiPTM1riez7AFII%2BxsO6izjaQsGvGd38PLP1Egz0hvrwUq77sJ6Jvataf4jozehG8AR8Dw8pE%2FNh3ct11TvHtE9Kdx3qDIil3054%3D&it_b_pay=60m&body=%E7%BE%8E%E5%9B%A2%E8%AE%A2%E5%8D%95-22121111100400000020221886584171&notify_url=http%3A%2F%2F10.110.162.16%3A8966%2Fexchange%2Fbank%2Fnotify%2F233%2Fpay_notify%2F363%2F412%2F103%2Fset111004%2Fbg0&alipay_exterface_invoke_assign_model=cashier&alipay_exterface_invoke_assign_target=mapi_direct_trade.htm&payment_type=1&out_trade_no=20221211220235U05107532841934551&partner=2088311465207164&alipay_exterface_invoke_assign_sign=_mp_i_d_x_ia8sd8y_q_k_s%2F0n_b1d6lr4_h_zq_kg_hmw431_d%2B_v3%2Bp_p_at_fune_aj_i_n_a%3D%3D&service=alipay.wap.create.direct.pay.by.user&total_fee=11.80&return_url=https%3A%2F%2Fmeishi.meituan.com%2Fi%2Forder%2Fresult%2F4899946434478451552%3F&sign_type=RSA&seller_id=2088311465207164&alipay_exterface_invoke_assign_client_ip=111.192.166.211",
                // };

                window.playwright.pay([
                  order1,
                  order2,
                  order3,
                  order4,
                  // order5,
                  // order6,
                  // order7,
                  // order8,
                  // order9,
                ]);
              }}
            >
              启动
            </Button>
          </Space>

          <Table
            key="id"
            dataSource={accounts}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            <Column title="id" dataIndex="id" key="id" width={50} />
            <Column
              title="支付宝帐号"
              dataIndex="account"
              key="id"
              width={300}
            />
            <Column
              title="是否为企业帐号"
              dataIndex="isEnterprise"
              width={150}
              key="isEnterprise"
              render={(record) => <div>{record ? "是" : "否"}</div>}
            />
            <Column
              title="是否短密码"
              dataIndex="isShort"
              key="isShort"
              width={120}
              render={(record) => <div>{record ? "是" : "否"}</div>}
            />
            <Column
              title="是否已登录"
              dataIndex="isLogin"
              key="isLogin"
              width={120}
              render={(record) => <div>{record ? "是" : "否"}</div>}
            />
            <Column title="工作状态" dataIndex="state" key="name" width={120} />
            <Column
              title="支付单数"
              dataIndex="count"
              key="count"
              width={120}
            />
            <Column
              title="支付金额"
              dataIndex="payment"
              key="payment"
              width={120}
            />
            <Column
              title="操作"
              dataIndex="id"
              key="id"
              render={(value, record) => (
                <div>
                  <Space>
                    <Button
                      onClick={() => {
                        const invalidAccountMutate = async () => {
                          await accountInvalidAccountMutation.mutateAsync({
                            id: value as number,
                          });
                        };
                        invalidAccountMutate()
                          .then(() => {
                            reloadData();
                          })
                          .catch((ex) => {
                            console.error(ex);
                          });
                      }}
                    >
                      设为失效
                    </Button>

                    <Button
                      onClick={() => {
                        console.error(1111, record);
                        accountModal({
                          ref: inputValueRef,
                          type: "update",
                          account: record as AccountInfo,
                          onOk: (ref: AccountRef) => {
                            const {
                              password,
                              isShort = false,
                              isEnterprise = false,
                            } = ref;
                            if (password == "" || !password) {
                              return;
                            }
                            accountUpdateMutation.mutate({
                              id: value as number,
                              password: password,
                              isShort: isShort,
                              isEnterprise: isEnterprise,
                            });
                          },
                        });
                      }}
                    >
                      编辑
                    </Button>

                    <Button
                      onClick={() => {
                        const disableMutate = async () => {
                          await accountDisableMutation.mutateAsync({
                            account: value as string,
                          });
                        };
                        disableMutate()
                          .then(() => {
                            reloadData();
                          })
                          .catch((ex) => {
                            console.error(ex);
                          });
                      }}
                    >
                      删除帐号
                    </Button>
                  </Space>
                </div>
              )}
            />
          </Table>
        </Card>

        <Card title="订单列表" bordered={false} style={{ width: "100%" }}>
          <Table
            key="id"
            dataSource={orders}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            <Column
              title="kfcOrderId"
              dataIndex="kfcOrderId"
              key="kfcOrderId"
              width={50}
            />
            <Column
              title="taobaoOrderId"
              dataIndex="taobaoOrderId"
              key="taobaoOrderId"
              width={300}
            />
            <Column
              title="支付链接"
              dataIndex="payUrl"
              key="payUrl"
              render={(value) => (
                <div>
                  <a href={value as string}>支付链接</a>
                </div>
              )}
            />
          </Table>
        </Card>

        <Card title="失效帐号" bordered={false} style={{ width: "100%" }}>
          <Table
            key="id"
            dataSource={invalidAccounts}
            rowKey={(record: { id: number }) => `${record.id}`}
            style={{ marginTop: "20px" }}
          >
            <Column title="id" dataIndex="id" key="id" width={50} />
            <Column
              title="支付宝帐号"
              dataIndex="account"
              key="id"
              width={300}
            />
            <Column
              title="操作"
              dataIndex="account"
              key="account"
              render={(value) => (
                <div>
                  <Space>
                    <Button
                      onClick={() => {
                        const validAccountMutate = async () => {
                          await accountValidAccountMutation.mutateAsync({
                            account: value as string,
                          });
                        };
                        validAccountMutate()
                          .then(() => {
                            reloadData();
                          })
                          .catch((ex) => {
                            console.error(ex);
                          });
                      }}
                    >
                      恢复正常
                    </Button>
                    <Button
                      onClick={() => {
                        const disableMutate = async () => {
                          await accountDisableMutation.mutateAsync({
                            account: value as string,
                          });
                        };
                        disableMutate()
                          .then(() => {
                            reloadData();
                          })
                          .catch((ex) => {
                            console.error(ex);
                          });
                      }}
                    >
                      删除帐号
                    </Button>
                  </Space>
                </div>
              )}
            />
          </Table>
        </Card>
      </Space>
    </div>
  );
};

export default AccountView;
