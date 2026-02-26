import antfu from "@antfu/eslint-config";
import pluginRouter from "@tanstack/eslint-plugin-router";

const tanstackRouterConfigs = pluginRouter.configs["flat/recommended"].map(config => ({
  ...config,
  files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
}));

export default antfu({
  formatters: true,
  react: true,
  typescript: true,
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
  ignores: [
    // Markdown
    "**/*.md",
    "**/.agents/**",
    // Alova DevTools 自动生成的文件
    "alova.config.ts",
    "apps/frontend/src/api/*",
    "!apps/frontend/src/api/index.ts",
    // Drizzle ORM 迁移文件
    "apps/backend/src/db/migrations",
    "apps/frontend/src/routeTree.gen.ts",
    // shadcn ui
    "apps/frontend/src/components/ui/*",
    "**/*.lock",
  ],
}, ...tanstackRouterConfigs, {
  files: ["**/*.{js,jsx,ts,tsx,vue}"],
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    "style/brace-style": ["error", "1tbs", { allowSingleLine: true }],
    "ts/strict-boolean-expressions": ["error", {
      allowString: true, // 允许 if (str)，因为 React 中字符串多半是有值的
      allowNumber: false, // 绝对禁止 if (num)，这是 React 报错重灾区（显示 0）
      allowNullableObject: true,
      allowNullableBoolean: true,
    }],
  },
});
