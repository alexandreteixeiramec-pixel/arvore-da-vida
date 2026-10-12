// Modelo educativo da arborização de Madre de Deus (BA).
// As manchas ficam DENTRO do contorno real da ilha (OpenStreetMap) e são
// aproximadas/ilustrativas, construídas a partir de tendências descritas em
// estudos da Baía de Todos os Santos e da série MapBiomas.

export const CURRENT_YEAR = 2026;
export const YEARS = [1996, 2006, 2016, 2026] as const;
export type Year = (typeof YEARS)[number];

// Centro e limites da ilha de Madre de Deus (OSM)
export const CENTER: [number, number] = [-12.7395, -38.61];
export const ISLAND_BOUNDS: [[number, number], [number, number]] = [
  [-12.7504, -38.6226],
  [-12.7277, -38.5968],
];

export type Patch = {
  id: string;
  name: string;
  type: "mata" | "mangue" | "restinga";
  center: [number, number];
  // raio em metros por ano [1996, 2006, 2016, 2026]; 0 = desapareceu
  r: [number, number, number, number];
  cause: string;
};

export const PATCHES: Patch[] = [
  { id: "p1", name: "Mata do alto da ilha", type: "mata", center: [-12.73766, -38.61221], r: [250, 210, 165, 120], cause: "Expansão de loteamentos nas encostas" },
  { id: "p2", name: "Encosta central", type: "mata", center: [-12.74144, -38.61608], r: [250, 180, 100, 0], cause: "Construções irregulares e cortes" },
  { id: "p3", name: "Mata da ponta sul", type: "mata", center: [-12.74575, -38.61884], r: [250, 225, 180, 140], cause: "Urbanização da orla sul" },
  { id: "p4", name: "Manguezal da costa norte", type: "mangue", center: [-12.73227, -38.61111], r: [250, 230, 200, 170], cause: "Aterros e esgoto sem tratamento" },
  { id: "p5", name: "Mata próxima ao terminal", type: "mata", center: [-12.73874, -38.60558], r: [240, 195, 120, 70], cause: "Área industrial, dutos e acessos" },
  { id: "p6", name: "Manguezal da costa oeste", type: "mangue", center: [-12.73659, -38.61829], r: [235, 215, 190, 160], cause: "Ocupação da margem e lixo" },
  { id: "p7", name: "Bosque do lado leste", type: "mata", center: [-12.73928, -38.5995], r: [190, 150, 90, 40], cause: "Novas ruas e casas" },
  { id: "p8", name: "Quintais arborizados do centro", type: "mata", center: [-12.74198, -38.61166], r: [155, 110, 50, 0], cause: "Pavimentação e corte de árvores" },
  { id: "p9", name: "Arvoredo do bairro norte", type: "mata", center: [-12.73389, -38.61497], r: [145, 110, 70, 30], cause: "Reformas sem replantio" },
  { id: "p10", name: "Restinga do nordeste", type: "restinga", center: [-12.73551, -38.60834], r: [140, 110, 70, 40], cause: "Ocupação desordenada" },
  { id: "p11", name: "Manguezal do canal sul", type: "mangue", center: [-12.74898, -38.62105], r: [110, 100, 85, 75], cause: "Assoreamento e lixo" },
  { id: "p12", name: "Mata ciliar do riacho", type: "mata", center: [-12.74198, -38.61995], r: [100, 70, 0, 0], cause: "Canalização do riacho" },
];

export const patchLossPct = (p: Patch, idx = 3) =>
  Math.round((1 - (p.r[idx] * p.r[idx]) / (p.r[0] * p.r[0])) * 100);

export type YearStats = {
  year: Year;
  coverage: number; // % da ilha com cobertura arbórea
  mangroveHa: number;
  treesPerPerson: number;
  population: number;
  pm10: number; // µg/m³ estimado
  surfaceTemp: number; // °C média superfície (verão)
  birdIndex: number; // % de espécies de aves avistadas vs 1996
  insectIndex: number; // % de insetos polinizadores vs 1996
};

export const STATS: YearStats[] = [
  { year: 1996, coverage: 58, mangroveHa: 410, treesPerPerson: 2.4, population: 11000, pm10: 28, surfaceTemp: 29.1, birdIndex: 100, insectIndex: 100 },
  { year: 2006, coverage: 49, mangroveHa: 385, treesPerPerson: 1.6, population: 14000, pm10: 33, surfaceTemp: 30.0, birdIndex: 86, insectIndex: 80 },
  { year: 2016, coverage: 39, mangroveHa: 350, treesPerPerson: 1.0, population: 18000, pm10: 38, surfaceTemp: 31.2, birdIndex: 71, insectIndex: 62 },
  { year: 2026, coverage: 31, mangroveHa: 322, treesPerPerson: 0.6, population: 20000, pm10: 43, surfaceTemp: 32.3, birdIndex: 58, insectIndex: 47 },
];

export type FaunaGroup = { icon: string; group: string; examples: string; lost: number; effect: string; migratory?: boolean };

export const FAUNA: FaunaGroup[] = [
  { icon: "feather", group: "Aves das árvores", examples: "Sabiá, sanhaço, bem-te-vi, beija-flor", lost: 38, effect: "Sem árvores frutíferas e locais de ninho" },
  { icon: "anchor", group: "Aves do manguezal", examples: "Garça-branca, socó, martim-pescador", lost: 30, effect: "Aterros reduziram áreas de pesca e repouso" },
  { icon: "navigation", group: "Aves migratórias", examples: "Maçarico-pintado, batuíra", lost: 42, effect: "Mudaram a parada da rota migratória para outras áreas da Baía", migratory: true },
  { icon: "sun", group: "Abelhas nativas", examples: "Jataí, uruçu, mandaçaia", lost: 48, effect: "Menos flores nativas para polinizar" },
  { icon: "wind", group: "Borboletas", examples: "Borboleta-azul, olho-de-boi", lost: 52, effect: "Calor e perda das plantas hospedeiras" },
  { icon: "star", group: "Vaga-lumes", examples: "Lampyridae", lost: 63, effect: "Luz artificial e fim da mata úmida" },
];

export const YEAR_STORY: Record<Year, string> = {
  1996: "Há 30 anos: a ilha ainda tinha matas nas encostas, quintais cheios de mangueiras e cajueiros, e manguezais contínuos.",
  2006: "Há 20 anos: novos bairros sobem as encostas. Manchas de mata começam a se fragmentar.",
  2016: "Há 10 anos: ruas pavimentadas, aterros na beira do mangue e perda de árvores nos quintais.",
  2026: "Hoje: restam fragmentos isolados. Menos sombra, mais calor, mais poeira no ar e menos pássaros.",
};

// Imagens reais de satélite (Esri World Imagery + arquivo histórico Wayback)
export const SAT_BEFORE = {
  label: "Satélite 2014",
  url: "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/10/{z}/{y}/{x}",
};
export const SAT_NOW = {
  label: `Satélite ${CURRENT_YEAR}`,
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

export const googleMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/@${lat},${lng},18z/data=!3m1!1e3`;

export const SOURCES = [
  { label: "MapBiomas – Cobertura e uso da terra", url: "https://plataforma.brasil.mapbiomas.org/cobertura" },
  { label: "Google Earth Timelapse (1984–hoje)", url: "https://earthengine.google.com/timelapse/#v=-12.7395,-38.61,14,latLng&t=0.0" },
  { label: "Google Maps – Madre de Deus", url: "https://www.google.com/maps/@-12.7395,-38.61,15z/data=!3m1!1e3" },
  { label: "Esri Wayback – fotos de satélite antigas", url: "https://livingatlas.arcgis.com/wayback/#ext=-38.6226,-12.7504,-38.5968,-12.7277" },
  { label: "WikiAves – aves registradas na região", url: "https://www.wikiaves.com.br/" },
  { label: "IBGE Cidades – Madre de Deus", url: "https://cidades.ibge.gov.br/brasil/ba/madre-de-deus/panorama" },
];

export const TIPS = [
  { icon: "feather", title: "Plante uma árvore nativa", text: "Pitanga, aroeira, ipê e oiti se adaptam bem ao litoral baiano e atraem pássaros." },
  { icon: "camera", title: "Registre e denuncie", text: "Fotografe cortes de árvores e aterros no mangue. Denuncie ao INEMA e à Prefeitura." },
  { icon: "users", title: "Mobilize a escola", text: "Organize um mutirão de plantio e limpeza do manguezal com a turma." },
  { icon: "droplet", title: "Cuide das mudas", text: "Rega nos primeiros 2 anos garante que a árvore sobreviva." },
  { icon: "sun", title: "Jardim para polinizadores", text: "Flores nativas em vasos e quintais trazem de volta abelhas e borboletas." },
  { icon: "message-circle", title: "Cobre o poder público", text: "Peça na Câmara um plano municipal de arborização urbana." },
];
