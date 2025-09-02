import axios from "axios";
import { registerAPICall } from "./auth.service"; // adjust filename if needed

beforeEach(() => {
  jest.clearAllMocks();
});

test("registerAPICall posts to Authentication/register with payload", async () => {
  const payload = { email: "jane@example.com", password: "pass123" };
  const fakeResponse = { data: { userId: 1, email: "jane@example.com" } };

  axios.post.mockResolvedValue(fakeResponse);

  const res = await registerAPICall(payload);

  expect(axios.post).toHaveBeenCalledWith("Authentication/register", payload);
  expect(res).toEqual(fakeResponse);
});
