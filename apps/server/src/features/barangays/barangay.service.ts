import { BarangayModel } from "./barangay.model";

export async function findBarangayByPoint(
  lng: number,
  lat: number,
  opts?: { city?: string; province?: string }
) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  const filter: any = {
    isActive: true,
    geometry: {
      $geoIntersects: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
      },
    },
  };

  if (opts?.city) filter.city = opts.city;
  if (opts?.province) filter.province = opts.province;

  return BarangayModel.findOne(filter).select("name city province").lean();
}
