import { t } from "../context";
import { z } from "zod";
import request from "../../utils/axios";

// export const loginRouter = t.router({
//   login: t.procedure
//   .input(z.object({username:z.string(), password:z.string()}))
//   .query(async ({ ctx, input }) => {
//     const result = await request.post('', {
//       func: 'shopLogin',
//       user:input.username,
//       params: JSON.stringify({
//         user:input.username,
//         pass:input.password,
//         type: 'alipay'
//       }),
//     });
//     if (!result.data.code) {
//       await this.setUserInfo({
//         username: values.username,
//         password: values.password,
//       })

//       await this.setToken(data.data.token)
//       this.$router.push('/')

//       this.setHeartBeatTimerId(
//         setInterval(() => {
//           this.$api.user.heartBeat({
//             user: values.username,
//             status: 1,
//           })
//         }, 15000)
//       )
//     } else {
//       this.$info({
//         title: data.message,
//       })
//     }

//     return ctx.prisma.order.findMany();
//   }),

// });
