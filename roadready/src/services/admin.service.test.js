import axios from "axios";
import {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  setCarStatus,
  getBrands,
  getCarStatuses,
  toCarCreateDto,
  toCarUpdateDto,
} from "./admin.service";

beforeEach(() => {
  jest.clearAllMocks();
});

test("getCars calls GET /Cars", async () => {
  axios.get.mockResolvedValue({ data: [{ id: 1, modelName: "BMW" }] });

  const res = await getCars();
  expect(axios.get).toHaveBeenCalledWith("Cars");
  expect(res.data[0].modelName).toBe("BMW");
});

test("createCar calls POST /Cars with dto", async () => {
  const dto = { brandId: 1, modelName: "BMW" };
  axios.post.mockResolvedValue({ data: { id: 5, ...dto } });

  const res = await createCar(dto);
  expect(axios.post).toHaveBeenCalledWith("Cars", dto);
  expect(res.data.id).toBe(5);
});

test("setCarStatus calls PATCH with correct body", async () => {
  axios.patch.mockResolvedValue({ data: {} });

  await setCarStatus(10, 2);
  expect(axios.patch).toHaveBeenCalledWith("Cars/10/status", { statusId: 2 });
});

test("toCarCreateDto maps form input", () => {
  const form = {
    brandId: "1",
    modelName: " Civic ",
    year: "2020",
    dailyRate: "50",
    seats: "5",
    transmission: "Auto ",
    fuelType: "Petrol ",
    statusId: "2",
    imageUrl: "",
  };

  const dto = toCarCreateDto(form);
  expect(dto).toEqual({
    brandId: 1,
    modelName: "Civic",
    year: 2020,
    dailyRate: 50,
    seats: 5,
    transmission: "Auto",
    fuelType: "Petrol",
    statusId: 2,
    imageUrl: null,
  });
});
