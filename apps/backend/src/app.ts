import createApp from "@/lib/app/create-app";
import configureAuth from "@/lib/auth/configure";
import configureOpenAPI from "@/lib/openapi/configure";

const app = createApp();

configureOpenAPI(app);
configureAuth(app);

// 注意：路由按数组顺序挂载，后续新增模块时应关注潜在的路径覆盖关系。
const routes = [] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;
