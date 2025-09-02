// @ts-nocheck
import axios from "axios";
import { meAPICall, getAllUsersAPICall } from "./user.service";

beforeEach(() => {
  jest.clearAllMocks();
});

test("meAPICall calls GET /Users/me", async () => {
  const fakeResponse = { data: { id: 1, email: "jane@example.com" } };
  axios.get.mockResolvedValue(fakeResponse);

  const res = await meAPICall();

  expect(axios.get).toHaveBeenCalledWith("Users/me");
  expect(res).toEqual(fakeResponse);
});

test("getAllUsersAPICall calls GET /Users", async () => {
  const fakeResponse = { data: [{ id: 1 }, { id: 2 }] };
  axios.get.mockResolvedValue(fakeResponse);

  const res = await getAllUsersAPICall();

  expect(axios.get).toHaveBeenCalledWith("Users");
  expect(res).toEqual(fakeResponse);
});
