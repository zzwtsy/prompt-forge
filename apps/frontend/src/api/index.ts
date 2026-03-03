import { createAlova } from "alova";
import fetchAdapter from "alova/fetch";
import reactHook from "alova/react";
import { unwrapApiEnvelope } from "@/lib/api-envelope";
import { createApis, mountApis, withConfigType } from "./createApis";

export const alovaInstance = createAlova({
  statesHook: reactHook,
  baseURL: "",
  requestAdapter: fetchAdapter(),
  beforeRequest: (method) => {
    method.config.credentials = "include";
  },
  responded: {
    onSuccess: async (response) => {
      const payload = await response.json();
      return unwrapApiEnvelope(payload);
    },
  },
});

export const $$userConfigMap = withConfigType({});

const Apis = createApis(alovaInstance, $$userConfigMap);

mountApis(Apis);

export default Apis;
