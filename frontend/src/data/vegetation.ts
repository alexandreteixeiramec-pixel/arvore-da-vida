// Modelo educativo da arborização de Madre de Deus (BA).
// As manchas são APROXIMADAS e ilustrativas, construídas a partir de tendências
// descritas em estudos multitemporais da Baía de Todos os Santos e da série
// MapBiomas (1985–2024). Para dados oficiais, consulte a plataforma MapBiomas.

export const YEARS = [1994, 2004, 2014, 2024] as const;
export type Year = (typeof YEARS)[number];

export const CENTER: [number, number] = [-12.7415, -38.6165];

export type Patch = {
  id: string;
  name: string;
  type: "mata" | "mangue" | "restinga";
  center: [number, number];
  // raio em metros por ano [1994, 2004, 2014, 2024]; 0 = desapareceu
  r: [number, number, number, number];
  cause?: string;
};

export const PATCHES: Patch[] = [
  { id: "p1", name: "Mata do alto da ilha", type: "mata", center: [-12.7365, -38.6180], r: [260, 220, 170, 120], cause: "Expansão de loteamentos" },
  { id: "p2", name: "Manguezal da costa norte", type: "mangue", center: [-12.7300, -38.6130], r: [240, 210, 180, 150], cause: "Aterros e esgoto" },
  { id: "p3", name: "Encosta central", type: "mata", center: [-12.7415, -38.6205], r: [230, 160, 90, 0], cause: "Construções irregulares" },
  { id: "p4", name: "Quintais arborizados do centro", type: "mata", center: [-12.7445, -38.6150], r: [170, 120, 60, 0], cause: "Pavimentação e corte de árvores" },
  { id: "p5", name: "Manguezal da costa oeste", type: "mangue", center: [-12.7395, -38.6315], r: [280, 250, 210, 170], cause: "Ocupação da margem" },
  { id: "p6", name: "Mata próxima ao terminal", type: "mata", center: [-12.7480, -38.6080], r: [220, 180, 100, 60], cause: "Área industrial / dutos" },
  { id: "p7", name: "Restinga da orla sul", type: "restinga", center: [-12.7505, -38.6200], r: [190, 150, 110, 70], cause: "Urbanização da orla" },
  { id: "p8", name: "Bosque do bairro leste", type: "mata", center: [-12.7380, -38.6060], r: [200, 150, 80, 40], cause: "Novas ruas e casas" },
  { id: "p9", name: "Manguezal do canal", type: "mangue", center: [-12.7340, -38.6250], r: [210, 190, 160, 140], cause: "Lixo e assoreamento" },
  { id: "p10", name: "Mata ciliar do riacho", type: "mata", center: [-12.7460, -38.6260], r: [160, 110, 0, 0], cause: "Canalização" },
  { id: "p11", name: "Arvoredo da praça antiga", type: "mata", center: [-12.7425, -38.6110], r: [120, 90, 60, 30], cause: "Reforma sem replantio" },
  { id: "p12", name: "Restinga do nordeste", type: "restinga", center: [-12.7330, -38.6040], r: [180, 140, 90, 50], cause: "Ocupação desordenada" },
];

export type YearStats = {
  year: Year;
  coverage: number; // % da ilha com cobertura arbórea
  mangroveHa: number; // hectares de manguezal
  treesPerPerson: number;
  population: number;
  pm10: number; // µg/m³ estimado
  surfaceTemp: number; // °C média superfície (verão)
};

export const STATS: YearStats[] = [
  { year: 1994, coverage: 58, mangroveHa: 410, treesPerPerson: 2.4, population: 11000, pm10: 28, surfaceTemp: 29.1 },
  { year: 2004, coverage: 49, mangroveHa: 385, treesPerPerson: 1.6, population: 14000, pm10: 33, surfaceTemp: 30.0 },
  { year: 2014, coverage: 39, mangroveHa: 350, treesPerPerson: 1.0, population: 18000, pm10: 38, surfaceTemp: 31.2 },
  { year: 2024, coverage: 31, mangroveHa: 322, treesPerPerson: 0.6, population: 20000, pm10: 43, surfaceTemp: 32.1 },
];

export const YEAR_STORY: Record<Year, string> = {
  1994: "Há 30 anos: a ilha ainda tinha matas nas encostas, quintais cheios de mangueiras e cajueiros, e manguezais contínuos.",
  2004: "Há 20 anos: novos bairros sobem as encostas. Manchas de mata começam a se fragmentar.",
  2014: "Há 10 anos: ruas pavimentadas, aterros na beira do mangue e perda de árvores nos quintais.",
  2024: "Hoje: restam fragmentos isolados. Menos sombra, mais calor e mais poeira no ar.",
};

export const SOURCES = [
  { label: "MapBiomas – Cobertura e uso da terra", url: "https://plataforma.brasil.mapbiomas.org/cobertura" },
  { label: "Google Earth Timelapse (1984–hoje)", url: "https://earthengine.google.com/timelapse/#v=-12.7415,-38.6165,13,latLng&t=0.0" },
  { label: "Google Maps – Madre de Deus", url: "https://www.google.com/maps/@-12.7415,-38.6165,14z/data=!3m1!1e3" },
  { label: "IBGE Cidades – Madre de Deus", url: "https://cidades.ibge.gov.br/brasil/ba/madre-de-deus/panorama" },
];

export const TIPS = [
  { icon: "feather", title: "Plante uma árvore nativa", text: "Pitanga, aroeira, ipê e oiti se adaptam bem ao litoral baiano." },
  { icon: "camera", title: "Registre e denuncie", text: "Fotografe cortes de árvores e aterros no mangue. Denuncie ao INEMA e à Prefeitura." },
  { icon: "users", title: "Mobilize a escola", text: "Organize um mutirão de plantio e limpeza do manguezal com a turma." },
  { icon: "droplet", title: "Cuide das mudas", text: "Rega nos primeiros 2 anos garante que a árvore sobreviva." },
  { icon: "trash-2", title: "Lixo fora do mangue", text: "O manguezal é berçário de peixes e caranguejos. Não descarte lixo nas margens." },
  { icon: "message-circle", title: "Cobre o poder público", text: "Peça na Câmara um plano municipal de arborização urbana." },
];
