// @ts-nocheck
import axios from "axios";
import { loginAPICall } from "./login.service";

beforeEach(() => jest.clearAllMocks());

test("posts login model to Authentication/login", async () => {
  const model = { email: "jane@example.com", password: "secret" };
  const fake = { data: { token: "mock-jwt" } };
  axios.post.mockResolvedValue(fake);

  const res = await loginAPICall(model);

  expect(axios.post).toHaveBeenCalledWith("Authentication/login", model);
  expect(res).toEqual(fake);
});
