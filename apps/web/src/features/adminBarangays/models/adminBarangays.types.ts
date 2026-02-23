export type AdminBarangay = {
  id: string;
  name: string;
  city: string;
  province: string;
  code?: string;
  isActive: boolean;
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown[];
  };
};
