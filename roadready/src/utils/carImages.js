export const FALLBACK_IMG = "/images/cars/logo.png";

export const localImageFor = (c) => {
  const brand = (c?.brandName || c?.brand || "").toLowerCase();
  const model = (c?.modelName || c?.model || "").toLowerCase();

  if (brand.includes("toyota") && model.includes("corolla"))
    return "/images/cars/toyota-corolla.png";

  if (brand.includes("ford"))
    return "/images/cars/Ford-3.png";

  if (brand.includes("honda") && (model.includes("city") || model.includes("civic")))
    return "/images/cars/Honda1.png";

  if (brand.includes("honda"))
    return "/images/cars/honda2.png";

  return FALLBACK_IMG;
};

const BAD_HOSTS = [/cdn\.example\.com/i, /placeholder/i];

export const srcForCar = (c) => {
  const raw = (c?.imageUrl || c?.imageURL || c?.image || "").trim();
  if (!raw || BAD_HOSTS.some((re) => re.test(raw)) || !/\.(png|jpe?g|webp|gif)$/i.test(raw)) {
    return localImageFor(c);
  }
  return raw;
};

export const carAlt = (c) =>
  `${(c?.brandName || c?.brand || "").trim()} ${(c?.modelName || c?.model || "").trim()}`
    .trim() || "Car";
