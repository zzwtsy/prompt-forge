import { createAlova } from "alova";
import fetchAdapter from "alova/fetch";
import reactHook from "alova/react";
import { createApis, mountApis, withConfigType } from "./createApis";

export const alovaInstance = createAlova({
  statesHook: reactHook,
  baseURL: "",
  requestAdapter: fetchAdapter(),
  beforeRequest: (method) => {
    method.config.credentials = "include";
  },
  responded: (res) => {
    return res.json();
  },
});

export const $$userConfigMap = withConfigType({});

const Apis = createApis(alovaInstance, $$userConfigMap);

mountApis(Apis);

export default Apis;
