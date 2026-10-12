export type Question = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export const QUESTIONS: Question[] = [
  {
    q: "Em qual baía fica a ilha de Madre de Deus?",
    options: ["Baía de Guanabara", "Baía de Todos os Santos", "Baía de Camamu", "Baía de Aratu"],
    answer: 1,
    explain: "Madre de Deus é uma ilha na Baía de Todos os Santos, no Recôncavo Baiano.",
  },
  {
    q: "Qual ecossistema costeiro é berçário de peixes e caranguejos na ilha?",
    options: ["Cerrado", "Caatinga", "Manguezal", "Pampa"],
    answer: 2,
    explain: "O manguezal é Área de Preservação Permanente e abriga a reprodução de muitas espécies.",
  },
  {
    q: "Como as árvores ajudam na qualidade do ar?",
    options: ["Produzem poeira", "Filtram poluentes e absorvem CO₂", "Aumentam a temperatura", "Não ajudam"],
    answer: 1,
    explain: "As folhas retêm partículas e as árvores absorvem gás carbônico, liberando oxigênio.",
  },
  {
    q: "O que é uma 'ilha de calor'?",
    options: ["Uma ilha vulcânica", "Área urbana mais quente por falta de vegetação", "Praia ensolarada", "Um tipo de nuvem"],
    answer: 1,
    explain: "Asfalto e concreto absorvem calor. Sem árvores, a cidade fica vários graus mais quente.",
  },
  {
    q: "Qual atividade industrial é marcante em Madre de Deus?",
    options: ["Mineração de ouro", "Terminal de petróleo e derivados", "Fábrica de automóveis", "Usina nuclear"],
    answer: 1,
    explain: "A ilha abriga um grande terminal aquaviário de petróleo, o que aumenta a importância das áreas verdes.",
  },
  {
    q: "Qual órgão estadual da Bahia fiscaliza o meio ambiente?",
    options: ["INEMA", "DETRAN", "INSS", "ANATEL"],
    answer: 0,
    explain: "O INEMA (Instituto do Meio Ambiente e Recursos Hídricos) recebe denúncias ambientais na Bahia.",
  },
  {
    q: "Qual destas é uma árvore nativa boa para plantio urbano no litoral baiano?",
    options: ["Eucalipto", "Pinus", "Pitangueira", "Leucena"],
    answer: 2,
    explain: "A pitangueira é nativa da Mata Atlântica, dá frutos e atrai pássaros.",
  },
  {
    q: "Segundo o modelo do app, quanto da cobertura arbórea a ilha perdeu de 1994 a 2024?",
    options: ["Cerca de 5%", "Cerca de 10%", "Quase metade", "Nada"],
    answer: 2,
    explain: "De ~58% para ~31% de cobertura: uma perda de quase metade em 30 anos (estimativa educativa).",
  },
  {
    q: "Qual plataforma mostra mapas anuais de cobertura vegetal do Brasil desde 1985?",
    options: ["MapBiomas", "Netflix", "Wikipédia", "Spotify"],
    answer: 0,
    explain: "O MapBiomas usa imagens de satélite para mapear a vegetação ano a ano.",
  },
  {
    q: "Qual atitude mais ajuda a reverter a desarborização?",
    options: ["Cimentar o quintal", "Plantar e cuidar de árvores nativas", "Queimar folhas", "Cortar árvores 'por segurança'"],
    answer: 1,
    explain: "Plantar e cuidar por pelo menos 2 anos garante que a muda vire árvore.",
  },
];
