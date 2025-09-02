import { useState } from "react";

export default function ImageUrl({ car, className }){
  const [src, setSrc] = useState(() => choose(car));

  function choose(c){
    const url = (c?.imageUrl || c?.imageURL || c?.image || "").trim().replace(/^["']|["']$/g,"");
    if (url && /^https?:\/\//i.test(url)) return url;  // URL from API
    const b = (c?.brandName || c?.brand || "").toLowerCase();
    const t = (c?.transmission || "").toLowerCase();
    const f = (c?.fuelType || "").toLowerCase();
    if (b==="toyota" && t==="manual") return "/images/Cars/Toyotamanual.png";
    if (b==="toyota") return "/images/Cars/Toyota.png";
    if (b==="honda" && t==="manual") return "/images/Cars/Hondamanual.png";
    if (b==="honda" && f==="petrol") return "/images/Cars/HondaPetrol.png";
    if (b==="ford") return "/images/Cars/Ford.png";
    return "/images/Cars/placeholder.png";
  }

  return (
    <img
      src={src}
      className={className}
      alt={[car?.brandName || "Car", car?.model || ""].filter(Boolean).join(" ")}
      loading="lazy"
      onError={() => setSrc("/images/Cars/placeholder.png")}
    />
  );
}
