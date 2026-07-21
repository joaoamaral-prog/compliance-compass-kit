import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  Download,
  MessageCircle,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: QuizPage,
});

// ==== Configuráveis ====
const WEBHOOK_URL = "COLOQUE_AQUI_A_URL_DO_WEBHOOK";
const DOWNLOAD_URL_PLANILHA = "COLOQUE_AQUI_O_LINK_DO_ARQUIVO";
const WHATSAPP_NUMBER = "5511939558582";

type Option = { label: string; points: 0 | 5 | 10 | 15 };
type Question = { id: string; area: string; text: string; options: Option[] };

const QUESTIONS: Question[] = [
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

type Lead = { nome: string; empresa: string; email: string; whatsapp: string };
type Stage = "intro" | "quiz" | "form" | "result";
type Tier = "baixo" | "moderado" | "alto";

function getTier(score: number): Tier {
  if (score <= 20) return "baixo";
  if (score <= 40) return "moderado";
  return "alto";
}

function tierLabel(t: Tier) {
  return t === "baixo" ? "Risco baixo" : t === "moderado" ? "Risco moderado" : "Risco alto";
}

function buildWhatsappLink(lead: Lead, label: string, score: number) {
  const text = encodeURIComponent(
    `Olá, sou ${lead.nome} da empresa ${lead.empresa}. Fiz o diagnóstico de risco regulatório e meu resultado foi "${label}" (${score} pontos). Gostaria de falar com um especialista.`,
  );
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${text}`;
}

function QuizPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    QUESTIONS.map(() => null),
  );
  const [lead, setLead] = useState<Lead>({ nome: "", empresa: "", email: "", whatsapp: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalScore = useMemo(
    () =>
      answers.reduce<number>(
        (acc, idx, i) => acc + (idx == null ? 0 : QUESTIONS[i].options[idx].points),
        0,
      ),
    [answers],
  );
  const tier = getTier(totalScore);

  const topAreas = useMemo(() => {
    return QUESTIONS.map((q, i) => ({
      area: q.area,
      points: answers[i] == null ? 0 : q.options[answers[i]!].points,
    }))
      .filter((a) => a.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 2)
      .map((a) => a.area);
  }, [answers]);

  function selectOption(idx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = idx;
      return next;
    });
  }

  function next() {
    if (answers[current] == null) return;
    if (current < QUESTIONS.length - 1) setCurrent((c) => c + 1);
    else setStage("form");
  }

  function prev() {
    if (current === 0) setStage("intro");
    else setCurrent((c) => c - 1);
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!lead.nome.trim() || !lead.empresa.trim() || !lead.email.trim() || !lead.whatsapp.trim()) {
      setFormError("Preencha todos os campos para continuar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      setFormError("Informe um e-mail válido.");
      return;
    }
    setSubmitting(true);

    const respostas = QUESTIONS.map((q, i) => {
      const idx = answers[i]!;
      const opt = q.options[idx];
      return { pergunta: q.text, resposta: opt.label, pontos: opt.points };
    });
    const respostas_resumo = respostas
      .map((r, i) => `P${i + 1}: ${r.pergunta} => ${r.resposta}`)
      .join(" | ");

    const payload = {
      nome: lead.nome,
      empresa: lead.empresa,
      email: lead.email,
      whatsapp: lead.whatsapp,
      pontuacao_total: totalScore,
      perfil_risco: tier,
      respostas,
      respostas_resumo,
      data_envio: new Date().toISOString(),
    };

    // Fire-and-forget: não bloqueia a transição em caso de erro
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error("Falha ao enviar lead para o webhook:", err);
    });

    // pequena espera para feedback visual do botão
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setStage("result");
    }, 400);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            BPO Paralegal
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        {stage === "intro" && <Intro onStart={() => setStage("quiz")} />}

        {stage === "quiz" && (
          <QuizStep
            current={current}
            total={QUESTIONS.length}
            question={QUESTIONS[current]}
            selected={answers[current]}
            onSelect={selectOption}
            onNext={next}
            onPrev={prev}
          />
        )}

        {stage === "form" && (
          <LeadForm
            lead={lead}
            setLead={setLead}
            onSubmit={submitLead}
            submitting={submitting}
            error={formError}
            onBack={() => setStage("quiz")}
          />
        )}

        {stage === "result" && submitted && (
          <Result
            lead={lead}
            score={totalScore}
            tier={tier}
            topAreas={topAreas}
          />
        )}
      </main>

      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-3xl px-6 text-xs text-muted-foreground">
          © BPO Paralegal
        </p>
      </footer>
    </div>
  );
}

// ============ Intro ============
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="animate-in fade-in duration-500 motion-reduce:animate-none">
      <div className="rounded-[var(--radius)] border border-border bg-card p-8 shadow-sm sm:p-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
          Gratuito · 2 minutos
        </div>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-card-foreground sm:text-4xl">
          Quais licenças da sua empresa vencem nos próximos 30 dias?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Se a resposta é <span className="font-medium text-foreground">"não sei"</span>, pode estar
          custando caro. Descubra seu nível de risco em 5 perguntas.
        </p>
        <button
          onClick={onStart}
          className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Começar diagnóstico
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

// ============ Quiz Step ============
function QuizStep({
  current,
  total,
  question,
  selected,
  onSelect,
  onNext,
  onPrev,
}: {
  current: number;
  total: number;
  question: Question;
  selected: number | null;
  onSelect: (i: number) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const progress = ((current + (selected != null ? 1 : 0)) / total) * 100;
  return (
    <section
      key={question.id}
      className="animate-in fade-in slide-in-from-right-4 duration-300 motion-reduce:animate-none"
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Questão {current + 1} de {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {question.area}
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-card-foreground sm:text-2xl">
          {question.text}
        </h2>

        <div className="mt-6 space-y-3">
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(i)}
                className={[
                  "flex w-full items-center gap-3 rounded-[var(--radius)] border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-foreground/30 hover:bg-secondary/60",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-border",
                  ].join(" ")}
                  aria-hidden
                >
                  {isSelected && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </span>
                <span className="text-sm text-card-foreground sm:text-base">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={selected == null}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {current === total - 1 ? "Ver diagnóstico" : "Próxima"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

// ============ Form ============
function LeadForm({
  lead,
  setLead,
  onSubmit,
  submitting,
  error,
  onBack,
}: {
  lead: Lead;
  setLead: (l: Lead) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
}) {
  const inputCls =
    "w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40";
  return (
    <section className="animate-in fade-in duration-300 motion-reduce:animate-none">
      <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
          Seu diagnóstico está pronto
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Preencha para liberar o resultado.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              Nome completo
            </label>
            <input
              type="text"
              value={lead.nome}
              onChange={(e) => setLead({ ...lead, nome: e.target.value })}
              className={inputCls}
              placeholder="Ex.: Ana Souza"
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              Empresa
            </label>
            <input
              type="text"
              value={lead.empresa}
              onChange={(e) => setLead({ ...lead, empresa: e.target.value })}
              className={inputCls}
              placeholder="Razão social ou nome fantasia"
              maxLength={160}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                E-mail corporativo
              </label>
              <input
                type="email"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                className={inputCls}
                placeholder="voce@empresa.com.br"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                WhatsApp
              </label>
              <input
                type="tel"
                value={lead.whatsapp}
                onChange={(e) => setLead({ ...lead, whatsapp: e.target.value })}
                className={inputCls}
                placeholder="(11) 99999-9999"
                maxLength={40}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Enviando...
                </>
              ) : (
                <>
                  Ver meu diagnóstico
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// ============ Result ============
function Result({
  lead,
  score,
  tier,
  topAreas,
}: {
  lead: Lead;
  score: number;
  tier: Tier;
  topAreas: string[];
}) {
  const label = tierLabel(tier);
  const wa = buildWhatsappLink(lead, label, score);
  const focus =
    topAreas.length === 0
      ? "nenhuma área crítica identificada"
      : topAreas.length === 1
        ? topAreas[0]
        : `${topAreas[0]} e ${topAreas[1]}`;

  const badge =
    tier === "baixo"
      ? { icon: ShieldCheck, color: "text-success", ring: "ring-success/30", bg: "bg-success/10" }
      : tier === "moderado"
        ? { icon: AlertTriangle, color: "text-warning", ring: "ring-warning/30", bg: "bg-warning/10" }
        : { icon: AlertOctagon, color: "text-destructive", ring: "ring-destructive/30", bg: "bg-destructive/10" };

  const Icon = badge.icon;

  return (
    <section className="animate-in fade-in duration-500 motion-reduce:animate-none">
      <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-10">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${badge.color} ${badge.ring} ${badge.bg}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label} · {score} pontos
        </div>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground sm:text-3xl">
          Diagnóstico de {lead.empresa}
        </h2>

        {tier === "baixo" && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {lead.nome}, a operação de{" "}
            <span className="font-medium text-foreground">{lead.empresa}</span> mostra boa maturidade regulatória
            {topAreas.length > 0 ? <> — atenção contínua em <span className="font-medium text-foreground">{focus}</span>.</> : "."}
          </p>
        )}

        {tier === "moderado" && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {lead.nome}, identificamos lacunas em{" "}
            <span className="font-medium text-foreground">{focus}</span>. Prioridade de atendimento nas próximas 48h.
          </p>
        )}

        {tier === "alto" && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {lead.nome}, exposição elevada em{" "}
            <span className="font-medium text-foreground">{focus}</span>. Atendimento prioritário aberto para {lead.empresa}.
          </p>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {tier === "baixo" && (
            <a
              href={DOWNLOAD_URL_PLANILHA}
              download
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="h-4 w-4" aria-hidden />
              Baixar planilha de controle de vencimentos
            </a>
          )}

          {tier === "moderado" && (
            <>
              <a
                href={wa}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Falar com um especialista agora
              </a>
              <a
                href={DOWNLOAD_URL_PLANILHA}
                download
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Download className="h-4 w-4" aria-hidden />
                Baixar planilha
              </a>
            </>
          )}

          {tier === "alto" && (
            <>
              <a
                href={wa}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-destructive px-6 py-3.5 text-base font-semibold text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                Falar agora com um especialista
              </a>
              <a
                href={DOWNLOAD_URL_PLANILHA}
                download
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Download className="h-4 w-4" aria-hidden />
                Baixar planilha
              </a>
            </>
          )}
        </div>

      </div>
    </section>
  );
}

