import { describe, expect, it } from "vitest";
import { AppErrorCode } from "./codes";

describe("appErrorCode", () => {
  it("uses 40401 for NOT_FOUND", () => {
    expect(AppErrorCode.NOT_FOUND.code).toBe(40401);
  });

  it("uses default Chinese messages for base error codes", () => {
    expect(AppErrorCode.SYSTEM_ERROR.message).toBe("系统内部错误");
    expect(AppErrorCode.HTTP_ERROR.message).toBe("HTTP 异常");
    expect(AppErrorCode.VALIDATION_ERROR.message).toBe("请求参数校验失败");
    expect(AppErrorCode.NOT_FOUND.message).toBe("资源不存在");
    expect(AppErrorCode.UNAUTHORIZED.message).toBe("未认证或登录失效");
    expect(AppErrorCode.FORBIDDEN.message).toBe("无权限访问");
  });

  it("does not contain duplicated numeric codes", () => {
    const codes = Object.values(AppErrorCode).map(item => item.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});
