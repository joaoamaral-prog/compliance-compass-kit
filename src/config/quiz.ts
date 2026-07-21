// ============================================================
// Configurações do Quiz — BPO Paralegal
// Edite este arquivo para alterar textos, perguntas, links etc.
// ============================================================

// URL do webhook (Zapier, Make, n8n) que receberá os leads
export const WEBHOOK_URL = "COLOQUE_AQUI_A_URL_DO_WEBHOOK";

// Link do arquivo/planilha para download no resultado
export const DOWNLOAD_URL_PLANILHA = "COLOQUE_AQUI_O_LINK_DO_ARQUIVO";

// Número de WhatsApp (formato internacional, só dígitos)
export const WHATSAPP_NUMBER = "5511939558582";

// Nome exibido no header e rodapé
export const BRAND_NAME = "BPO Paralegal";

// ============================================================
// Textos das telas
// ============================================================
export const TEXTS = {
  intro: {
    badge: "Gratuito · 2 minutos",
    title: "Quais licenças da sua empresa vencem nos próximos 30 dias?",
    subtitle:
      'Se a resposta é "não sei", pode estar custando caro. Descubra seu risco em 5 perguntas.',
    cta: "Começar diagnóstico",
  },
  form: {
    title: "Seu diagnóstico está pronto",
    subtitle: "Preencha para liberar o resultado.",
    cta: "Ver meu diagnóstico",
  },
  result: {
    baixo: "Boa maturidade regulatória.",
    moderado: "Lacunas identificadas. Prioridade nas próximas 48h.",
    alto: "Exposição elevada. Atendimento prioritário aberto.",
  },
};

// ============================================================
// Tipos e perguntas
// ============================================================
export type Option = { label: string; points: 0 | 5 | 10 | 15 };
export type Question = { id: string; area: string; text: string; options: Option[] };

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    area: "Escala operacional",
    text: "Quantas unidades ou filiais a sua empresa possui hoje?",
    options: [
      { label: "Apenas 1", points: 0 },
      { label: "De 2 a 5", points: 5 },
      { label: "De 6 a 20", points: 10 },
      { label: "Mais de 20", points: 15 },
    ],
  },
  {
    id: "q2",
    area: "Controle de vencimentos",
    text: "Como é feito hoje o controle de vencimento de alvarás, licenças e certidões?",
    options: [
      { label: "Sistema centralizado com alertas automáticos", points: 0 },
      { label: "Planilha própria, atualizada manualmente", points: 5 },
      { label: "Cada unidade cuida por conta própria", points: 10 },
      { label: "Não existe um controle formal", points: 15 },
    ],
  },
  {
    id: "q3",
    area: "Histórico de autuações",
    text: "Nos últimos 12 meses, a empresa já sofreu multa ou autuação por pendência documental?",
    options: [
      { label: "Não, nunca", points: 0 },
      { label: "Quase aconteceu, mas resolvemos a tempo", points: 5 },
      { label: "Sim, uma vez", points: 10 },
      { label: "Sim, mais de uma vez", points: 15 },
    ],
  },
  {
    id: "q4",
    area: "Governança interna",
    text: "Existe um responsável dedicado à gestão regulatória e societária da empresa?",
    options: [
      { label: "Sim, equipe ou pessoa dedicada", points: 0 },
      { label: "Sim, mas dividido com outras funções", points: 5 },
      { label: "Não, é resolvido conforme a necessidade surge", points: 10 },
      { label: "Não sabemos ao certo quem cuida disso hoje", points: 15 },
    ],
  },
  {
    id: "q5",
    area: "Complexidade jurisdicional",
    text: "A empresa atua em mais de um estado, com legislações diferentes entre si?",
    options: [
      { label: "Não, apenas um município", points: 0 },
      { label: "Sim, dentro de um mesmo estado", points: 5 },
      { label: "Sim, em vários estados", points: 10 },
      { label: "Sim, em vários estados com legislações bem distintas entre si", points: 15 },
    ],
  },
];

// ============================================================
// Faixas de risco (limites de pontuação)
// ============================================================
export const TIER_THRESHOLDS = {
  baixo: 20, // <= 20 pontos
  moderado: 40, // <= 40 pontos; acima disso é "alto"
};