export type DagupanBarangayInfo = {
  name: string;
  code?: string;
  coordinates: [number, number]; // [lng, lat]
  landmarks?: string[];
  district?: string;
};

// 31 official barangays of Dagupan City, Pangasinan
export const DAGUPAN_BARANGAYS: DagupanBarangayInfo[] = [
  {
    name: "Bacayao Norte",
    coordinates: [120.3475, 16.0315],
    landmarks: ["Bacayao River", "Norte Elementary School"],
  },
  {
    name: "Bacayao Sur",
    coordinates: [120.3442, 16.0248],
    landmarks: ["Bacayao Sur Chapel", "Residential area"],
  },
  {
    name: "Barangay I (Poblacion)",
    coordinates: [120.3392, 16.0428],
    landmarks: ["City Plaza", "St. John the Evangelist Cathedral", "Poblacion Center"],
    district: "Downtown",
  },
  {
    name: "Barangay II (Poblacion)",
    coordinates: [120.3415, 16.0441],
    landmarks: ["Galvan Street Commercial Strip", "Downtown Dagupan"],
    district: "Downtown",
  },
  {
    name: "Barangay IV (Poblacion)",
    coordinates: [120.3432, 16.0465],
    landmarks: ["Perez Boulevard", "Burgos Street Market"],
    district: "Downtown",
  },
  {
    name: "Bolosan",
    coordinates: [120.3621, 16.0583],
    landmarks: ["Bolosan Elementary School", "Mangaldan Boundary"],
  },
  {
    name: "Bonuan Binloc",
    coordinates: [120.3695, 16.0825],
    landmarks: ["Binloc Beach", "Coastal community", "Tondaligan Park Extension"],
    district: "Bonuan",
  },
  {
    name: "Bonuan Boquig",
    coordinates: [120.3615, 16.0752],
    landmarks: ["Bonuan Boquig National High School", "Bangus Fishponds"],
    district: "Bonuan",
  },
  {
    name: "Bonuan Gueset",
    coordinates: [120.3512, 16.0792],
    landmarks: ["Tondaligan People's Park", "Bonuan Blue Beach", "CDRRMO Substation"],
    district: "Bonuan",
  },
  {
    name: "Calmay",
    coordinates: [120.3185, 16.0418],
    landmarks: ["Calmay River", "Island Barangay", "Calmay Elementary School"],
  },
  {
    name: "Carael",
    coordinates: [120.3278, 16.0475],
    landmarks: ["Carael Fisherfolk Wharf", "Pantal River Mouth"],
  },
  {
    name: "Caranglaan",
    coordinates: [120.3548, 16.0385],
    landmarks: ["Caranglaan Commercial District", "CSI the City Mall", "De Venecia Highway"],
  },
  {
    name: "Herrero",
    coordinates: [120.3475, 16.0442],
    landmarks: ["Herrero-Perez Barangay Hall", "Perez Boulevard"],
  },
  {
    name: "Lasip Chico",
    coordinates: [120.3485, 16.0221],
    landmarks: ["Lasip Chico Barangay Hall", "Southern Dagupan"],
  },
  {
    name: "Lasip Grande",
    coordinates: [120.3525, 16.0185],
    landmarks: ["Lasip Grande Elementary School", "Calasiao Border"],
  },
  {
    name: "Lomboy",
    coordinates: [120.3295, 16.0325],
    landmarks: ["Lomboy River Dike", "Agricultural sector"],
  },
  {
    name: "Lucao",
    coordinates: [120.3218, 16.0275],
    landmarks: ["CSI Market Square", "Judge Jose de Venecia Expressway", "Lucao District Hospital"],
  },
  {
    name: "Malued",
    coordinates: [120.3345, 16.0315],
    landmarks: ["Malued Elementary School", "San Miguel Barangay Access"],
  },
  {
    name: "Mamalingling",
    coordinates: [120.3725, 16.0425],
    landmarks: ["Mamalingling Rice Fields", "Eastern Boundary"],
  },
  {
    name: "Mangin",
    coordinates: [120.3785, 16.0495],
    landmarks: ["Mangin Barangay Hall", "Tebeng Road"],
  },
  {
    name: "Mayombo",
    coordinates: [120.3425, 16.0375],
    landmarks: ["Dagupan Doctors Villaflor Memorial Hospital", "Mayombo District"],
  },
  {
    name: "Pantal",
    coordinates: [120.3365, 16.0492],
    landmarks: ["Pantal River Port", "Fish Port", "Pantal Bridge"],
  },
  {
    name: "Poblacion Oeste",
    coordinates: [120.3345, 16.0415],
    landmarks: ["Dagupan City Hall Complex", "City Museum", "CDRRMO Central Command"],
    district: "Downtown",
  },
  {
    name: "Pogo Chico",
    coordinates: [120.3385, 16.0355],
    landmarks: ["Pogo Chico Chapel", "Residential Center"],
  },
  {
    name: "Pogo Grande",
    coordinates: [120.3362, 16.0305],
    landmarks: ["Pogo Grande Elementary School", "Sports Complex Area"],
  },
  {
    name: "Pugaro Suit",
    coordinates: [120.3092, 16.0515],
    landmarks: ["Pugaro Island", "Mangrove Sanctuary", "Fisheries Reserve"],
  },
  {
    name: "Salapingao",
    coordinates: [120.3125, 16.0625],
    landmarks: ["Salapingao Coastal School", "Oyster Farm Zone"],
  },
  {
    name: "Salisay",
    coordinates: [120.3685, 16.0615],
    landmarks: ["Salisay Barangay Hall", "Agricultural area"],
  },
  {
    name: "Tambac",
    coordinates: [120.3585, 16.0485],
    landmarks: ["Tambac Elementary School", "Tambac Baywalk"],
  },
  {
    name: "Tapuac",
    coordinates: [120.3325, 16.0375],
    landmarks: ["University of Luzon", "Colegio de Dagupan", "Tapuac Commercial"],
    district: "Academic District",
  },
  {
    name: "Tebeng",
    coordinates: [120.3755, 16.0545],
    landmarks: ["Tebeng Elementary School", "East Dagupan Highway"],
  },
];
