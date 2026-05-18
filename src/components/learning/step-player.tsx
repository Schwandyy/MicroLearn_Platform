"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "@/i18n/routing";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Trophy,
  X,
  Download,
  Monitor,
  Usb,
  Cable,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadboard } from "./breadboard-svg";
import { BlinkSchematic } from "./blink-schematic";
import { BoardVariantProvider, useBoardVariant } from "./board-variant-context";
import { BoardPicker } from "./board-picker";
import { applyLessonTemplate, applyLessonTemplateDeep, makeLessonContext } from "@/lib/lesson-template";
import { MiniSimulator } from "./mini-simulator";
import { CodeWalkthrough } from "./code-walkthrough";
import { BomCards, type BomItemView } from "./bom-cards";
import { Esp32PinVisual } from "./esp32-pin-visual";
import { MentorChat } from "./mentor-chat";
import { EspFlashButton } from "./esp-flash-button";
import {
  LessonCompletionModal,
  type CompletionPayload,
} from "./lesson-completion-modal";
import { HelpRequestPrompt } from "./help-request-prompt";
import { UnverifiedLessonBanner } from "./unverified-banner";

export type StepKind =
  | "INTRO"
  | "PARTS"
  | "SAFETY"
  | "BUILD"
  | "CODE_WALK"
  | "SIMULATE"
  | "QUIZ"
  | "CELEBRATE"
  | "EXPLAIN"
  | "SETUP";

export interface StepView {
  id: string;
  kind: StepKind;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
}

export interface LessonFirmware {
  url: string;
  chip: "esp32" | "esp32s3" | "esp32c3" | "esp32s2" | "esp8266" | null;
  flashAddress: string | null;
}

export function StepPlayer({
  lessonId,
  lessonTitle,
  lessonSummary,
  steps,
  bom,
  safetyNotes,
  xpReward,
  locale,
  alreadyCompleted,
  mentorAvailable,
  firmware,
  verifiedOnHardware,
}: {
  lessonId: string;
  lessonTitle: string;
  lessonSummary: string;
  steps: StepView[];
  bom: BomItemView[];
  safetyNotes: string | null;
  xpReward: number;
  locale: "de" | "en";
  alreadyCompleted: boolean;
  mentorAvailable: boolean;
  firmware: LessonFirmware | null;
  verifiedOnHardware: boolean;
}) {
  const t = useTranslations("lesson");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  // Quiz-Gate: pro QUIZ-Step merken, ob korrekt gelöst (key = step.id)
  const [quizPassed, setQuizPassed] = useState<Record<string, boolean>>({});
  const [completion, setCompletion] = useState<CompletionPayload | null>(null);
  const total = steps.length;
  const current = steps[stepIndex];
  const currentQuizPassed = current?.kind === "QUIZ" ? Boolean(quizPassed[current.id]) : true;

  const goNext = () => {
    // QUIZ-Steps blockieren das Weiterklicken bis korrekt beantwortet
    if (current?.kind === "QUIZ" && !currentQuizPassed) return;
    if (stepIndex < total - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    // Last step → complete lesson
    if (alreadyCompleted) {
      router.push("/dashboard");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      const data: Partial<CompletionPayload> & {
        alreadyCompleted?: boolean;
      } = await res.json().catch(() => ({}));
      if (data.alreadyCompleted) {
        router.push("/dashboard");
        return;
      }
      setCompletion({
        xpGained: data.xpGained ?? xpReward,
        streak: data.streak ?? null,
        newBadges: data.newBadges ?? [],
        certificate: data.certificate ?? null,
      });
    });
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const progressPct = Math.round(((stepIndex + 1) / total) * 100);

  return (
    <BoardVariantProvider>
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {!verifiedOnHardware && <UnverifiedLessonBanner />}
      <header className="border-b px-4 py-3">
        <div className="container flex items-center gap-4">
          <button
            type="button"
            aria-label="exit"
            onClick={() => router.push("/dashboard")}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <Progress value={progressPct} className="h-3 flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {stepIndex + 1}/{total}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* pb-32 schafft Platz oberhalb des sticky Footers — sonst werden
            Quiz-Optionen / Simulator-Choices vom „Weiter"-Button überdeckt. */}
        <div className="container max-w-2xl py-6 pb-32 md:py-8 md:pb-32">
          {!current ? (
            <p>—</p>
          ) : (
            <StepBody
              step={current}
              lessonTitle={lessonTitle}
              lessonSummary={lessonSummary}
              bom={bom}
              safetyNotes={safetyNotes}
              xpReward={xpReward}
              locale={locale}
              firmware={firmware}
              alreadyCompleted={alreadyCompleted}
              onQuizPass={() =>
                setQuizPassed((prev) =>
                  prev[current.id] ? prev : { ...prev, [current.id]: true },
                )
              }
            />
          )}
        </div>
      </main>

      <footer className="border-t bg-card px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:py-4">
        <div className="container flex max-w-2xl items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={stepIndex === 0 || isPending}
            aria-label={t("back")}
            className="px-2 sm:px-4"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("back")}</span>
          </Button>
          <NextButton
            stepKind={current?.kind ?? "INTRO"}
            isLast={stepIndex === total - 1}
            isPending={isPending}
            onClick={goNext}
            stepPayload={current?.payload ?? null}
            disabled={current?.kind === "QUIZ" && !currentQuizPassed}
            hintWhenDisabled={
              current?.kind === "QUIZ" ? t("quizGateHint") : undefined
            }
          />
        </div>
      </footer>

      <MentorChat
        lessonId={lessonId}
        available={mentorAvailable}
        stepContext={
          current
            ? { title: current.title, body: current.body, kind: current.kind }
            : null
        }
      />

      <LessonCompletionModal
        open={completion !== null}
        payload={completion}
        locale={locale}
        onClose={() => {
          setCompletion(null);
          router.push("/dashboard");
        }}
      />

      {!alreadyCompleted && completion === null && (
        <HelpRequestPrompt lessonId={lessonId} />
      )}
    </div>
    </BoardVariantProvider>
  );
}

function StepBody({
  step: rawStep,
  lessonTitle,
  lessonSummary,
  bom,
  safetyNotes,
  xpReward,
  locale,
  firmware,
  alreadyCompleted,
  onQuizPass,
}: {
  step: StepView;
  lessonTitle: string;
  lessonSummary: string;
  bom: BomItemView[];
  safetyNotes: string | null;
  xpReward: number;
  locale: "de" | "en";
  firmware: LessonFirmware | null;
  alreadyCompleted: boolean;
  onQuizPass: () => void;
}) {
  const t = useTranslations("lesson");
  const { signalPinLabel } = useBoardVariant();
  // Step-Texte + Payload werden mit den Platzhaltern {{SIGNAL_LABEL}} und
  // {{SIGNAL_GPIO}} versehen, die beim Render gegen den aktuell gewählten
  // Signal-Pin (default D2) ersetzt werden. So zeigen Step-Body, Code-Walk
  // und Quiz live die richtige GPIO-Nummer/Label.
  const tpl = makeLessonContext(signalPinLabel);
  const step: StepView = {
    ...rawStep,
    title: applyLessonTemplate(rawStep.title, tpl),
    body: applyLessonTemplate(rawStep.body, tpl),
    payload: rawStep.payload ? applyLessonTemplateDeep(rawStep.payload, tpl) : null,
  };
  const payload = step.payload ?? {};

  switch (step.kind) {
    case "INTRO":
      return (
        <div className="space-y-6 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl">{lessonTitle}</h1>
          <p className="text-lg text-muted-foreground">{lessonSummary}</p>
          {step.body && <p className="text-base">{step.body}</p>}
        </div>
      );
    case "PARTS":
      return (
        <div className="space-y-5">
          <header className="text-center">
            <h2 className="text-2xl font-bold">{t("youNeed")}</h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          <BomCards items={bom} />
        </div>
      );
    case "SAFETY":
      return (
        <div className="space-y-6">
          <Card className="border-amber-400 bg-amber-50/60 dark:bg-amber-900/20">
            <CardContent className="grid gap-3 p-6">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-xl font-bold">{t("safetyFirst")}</h2>
              </div>
              <p className="text-base leading-relaxed">{step.body}</p>
              {safetyNotes && (
                <p className="rounded-md bg-amber-100/60 p-3 text-sm leading-relaxed dark:bg-amber-900/30">
                  {safetyNotes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    case "BUILD": {
      const instruction =
        ((payload as Record<string, unknown>)[
          `instruction_${locale}`
        ] as string | undefined) ?? step.body;
      const buildStage = (payload as { buildStage?: 1 | 2 | 3 | "all" })
        .buildStage;
      return (
        <div className="space-y-6">
          <header>
            <h2 className="text-2xl font-bold">{step.title || t("buildIt")}</h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          {(payload as { schematic?: string }).schematic === "blink-premium" ? (
            <BlinkSchematic
              buildStage={
                buildStage === "all"
                  ? "all"
                  : buildStage === 1
                    ? 1
                    : buildStage === 2
                      ? 2
                      : 3
              }
            />
          ) : (
            <Breadboard
              ledColor={
                (payload as { ledColor?: "red" | "green" | "yellow" | "blue" })
                  .ledColor ?? "red"
              }
              highlightWires={
                ((payload as { highlightWires?: ("3v3" | "gnd" | "signal")[] })
                  .highlightWires) ?? []
              }
              buildStage={buildStage}
            />
          )}
          {instruction && (
            <Card>
              <CardContent className="p-4">
                <p className="text-base leading-relaxed">👉 {instruction}</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }
    case "CODE_WALK": {
      const code = (payload as { code?: string }).code ?? "";
      const lines =
        ((payload as { lines?: Array<{
          from: number;
          to: number;
          explain_de: string;
          explain_en: string;
        }> }).lines) ?? [];
      return (
        <div className="space-y-5">
          <header>
            <h2 className="text-2xl font-bold">
              {step.title || t("understandCode")}
            </h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          <CodeWalkthrough code={code} lines={lines} locale={locale} />
          {firmware?.url && (
            <EspFlashButton
              firmwareUrl={firmware.url}
              chip={firmware.chip}
              flashAddress={firmware.flashAddress}
            />
          )}
        </div>
      );
    }
    case "SIMULATE":
      return (
        <div className="space-y-5">
          <header>
            <h2 className="text-2xl font-bold">{step.title || t("whatHappens")}</h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          <MiniSimulator
            payload={payload as Record<string, never>}
            locale={locale}
          />
        </div>
      );
    case "QUIZ":
      return (
        <QuizStep
          payload={payload}
          body={step.body}
          title={step.title}
          locale={locale}
          onPass={onQuizPass}
        />
      );
    case "CELEBRATE":
      return (
        <div className="space-y-6 py-10 text-center">
          <Trophy className="mx-auto h-16 w-16 text-amber-500" />
          <h1 className="text-3xl font-bold">{t("celebrateTitle")}</h1>
          <p className="text-lg text-muted-foreground">
            {alreadyCompleted
              ? t("celebrateBodyReplay")
              : t("celebrateBody", {
                  xp:
                    ((payload as { xpAward?: number }).xpAward) ?? xpReward,
                })}
          </p>
        </div>
      );
    case "SETUP":
      return (
        <SetupStep
          title={step.title}
          body={step.body}
          payload={payload as Record<string, unknown>}
          locale={locale}
        />
      );
    case "EXPLAIN": {
      const highlightPin = (payload as { highlightPin?: "GPIO2" | "GND" | "3V3" })
        .highlightPin;
      const showBreadboardExplainer = Boolean(
        (payload as { showBreadboardExplainer?: boolean }).showBreadboardExplainer,
      );
      const breadboardVariant = (payload as { breadboardVariant?: "boardOnly" | "boardWithHighlight" | "insertHint" | "full" })
        .breadboardVariant;
      const hasSpecificVisual = Boolean(highlightPin || showBreadboardExplainer || breadboardVariant);
      // Fallback-Hero: thematisches Emoji + Gradient, damit EXPLAIN-Steps
      // ohne spezifisches Diagramm trotzdem visuell aufgewertet sind.
      const heroEmoji = pickExplainEmoji(step.title, step.body);
      return (
        <div className="space-y-5">
          <header>
            <h2 className="text-2xl font-bold">{step.title}</h2>
          </header>
          {/* Board-Picker erscheint im „Das ist dein ESP32"-Step (= Step mit
              highlightPin oder dem Pin-Visual). So wählt der Schüler GENAU
              EINMAL pro Lesson, welches Board er physisch vor sich hat. */}
          {highlightPin && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <BoardPicker />
              </CardContent>
            </Card>
          )}
          {highlightPin && <Esp32PinVisual highlightPin={highlightPin} />}
          {/* Konsistenz: ALLE Brett-Visuals nutzen BlinkSchematic — sowohl in
              den EXPLAIN-Steps als auch in den BUILD-Steps. So sehen Brett +
              ESP über die ganze Lesson identisch aus. */}
          {showBreadboardExplainer && (
            <BlinkSchematic mode="boardWithHighlight" buildStage={0} />
          )}
          {breadboardVariant === "boardOnly" && (
            <BlinkSchematic mode="boardOnly" buildStage={0} />
          )}
          {breadboardVariant === "boardWithHighlight" && (
            <BlinkSchematic mode="boardWithHighlight" buildStage={0} />
          )}
          {breadboardVariant === "insertHint" && (
            <BlinkSchematic mode="insertHint" buildStage={0} />
          )}
          {breadboardVariant === "full" && (
            <BlinkSchematic mode="build" buildStage={0} />
          )}
          {!hasSpecificVisual && (
            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-amber-500/10 to-emerald-500/10 py-10">
              <span className="text-7xl" role="img" aria-hidden>
                {heroEmoji}
              </span>
            </div>
          )}
          <Card>
            <CardContent className="p-6">
              <p className="text-base leading-relaxed">{step.body}</p>
              {(payload as { keyPoint_de?: string; keyPoint_en?: string })[
                `keyPoint_${locale}`
              ] && (
                <p className="mt-3 rounded-md bg-primary/10 p-3 text-sm font-medium">
                  💡{" "}
                  {(payload as Record<string, string>)[`keyPoint_${locale}`]}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
  }
}

function QuizStep({
  payload,
  title,
  body,
  locale,
  onPass,
}: {
  payload: Record<string, unknown>;
  title: string;
  body: string;
  locale: "de" | "en";
  onPass: () => void;
}) {
  const t = useTranslations("lesson");
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const prompt =
    (payload[`prompt_${locale}`] as string | undefined) ?? body ?? "";
  const options =
    (payload.options as
      | Array<{ key: string; label_de: string; label_en: string }>
      | undefined) ?? [];
  const correctKey = payload.correctKey as string | undefined;
  const explanation = payload[`explanation_${locale}`] as string | undefined;
  const isCorrect = submitted && answer === correctKey;
  const isWrong = submitted && answer !== correctKey;
  const firedRef = useRef(false);

  useEffect(() => {
    if (isCorrect && !firedRef.current) {
      firedRef.current = true;
      onPass();
    }
  }, [isCorrect, onPass]);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold">{title || t("quizPrompt")}</h2>
      </header>
      <Card>
        <CardContent className="grid gap-4 p-6">
          <p className="text-base font-medium">{prompt}</p>
          <RadioGroup
            value={answer ?? ""}
            onValueChange={(v) => {
              if (!submitted) setAnswer(v);
            }}
            className="grid gap-3"
          >
            {options.map((o) => {
              const id = `quiz-${o.key}`;
              const label = locale === "de" ? o.label_de : o.label_en;
              return (
                <label
                  key={o.key}
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                    submitted && o.key === correctKey && "border-emerald-500 bg-emerald-50/60",
                    submitted && answer === o.key && o.key !== correctKey && "border-destructive bg-destructive/10",
                    !submitted && "hover:border-primary",
                  )}
                >
                  <RadioGroupItem value={o.key} id={id} className="mt-1" disabled={submitted} />
                  <Label htmlFor={id} className="cursor-pointer text-base font-normal">
                    {label}
                  </Label>
                </label>
              );
            })}
          </RadioGroup>

          {!submitted ? (
            <Button
              type="button"
              disabled={!answer}
              onClick={() => setSubmitted(true)}
              size="lg"
              className="w-full sm:w-auto sm:self-end"
            >
              {t("checkAnswer")}
            </Button>
          ) : isCorrect ? (
            <div className="grid gap-2">
              <p className="rounded-md bg-emerald-50/60 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                ✓ {t("correct")}
              </p>
              {explanation && (
                <p className="rounded-md bg-primary/5 p-3 text-sm leading-relaxed">
                  💡 {explanation}
                </p>
              )}
            </div>
          ) : isWrong ? (
            <div className="grid gap-2">
              <p className="rounded-md bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                ✗ {t("wrong")}
              </p>
              {explanation && (
                <p className="rounded-md bg-amber-50/60 p-3 text-sm leading-relaxed dark:bg-amber-900/20">
                  🧭 {explanation}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAnswer(null);
                  setSubmitted(false);
                }}
              >
                {t("tryAgain")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function NextButton({
  stepKind,
  isLast,
  isPending,
  onClick,
  stepPayload,
  disabled,
  hintWhenDisabled,
}: {
  stepKind: StepKind;
  isLast: boolean;
  isPending: boolean;
  onClick: () => void;
  stepPayload: Record<string, unknown> | null;
  disabled?: boolean;
  hintWhenDisabled?: string;
}) {
  const t = useTranslations("lesson");
  void stepPayload;
  const label = isLast
    ? t("finish")
    : stepKind === "INTRO"
      ? t("letsGo")
      : t("next");
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        onClick={onClick}
        disabled={isPending || disabled}
        size="lg"
        title={disabled ? hintWhenDisabled : undefined}
      >
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      {disabled && hintWhenDisabled && (
        <span className="text-xs text-muted-foreground">{hintWhenDisabled}</span>
      )}
    </div>
  );
}

// Fallback-Hero für EXPLAIN-Steps ohne spezifisches Diagramm. Pickt ein
// Emoji basierend auf Stichwörtern in Titel + Body. Kein KI-Aufruf —
// einfache Heuristik, im Zweifel der allgemeine Lampe-Emoji.
function pickExplainEmoji(title: string, body: string): string {
  const haystack = `${title} ${body}`.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/wlan|wifi|wi-?fi/, "📶"],
    [/mqtt|broker/, "📡"],
    [/firmware|ota|update/, "📦"],
    [/temperatur|hitze|kalt|warm/, "🌡️"],
    [/luftdruck|barometer|wetter|atmosphäre|höhe/, "🌤️"],
    [/feuchte|wasser|pflanze|boden/, "💧"],
    [/licht|hell|dunkel|fotowiderstand|ldr/, "💡"],
    [/ultraschall|abstand|fledermaus/, "🦇"],
    [/bewegung|pir/, "🚶"],
    [/oled|display|bildschirm|pixel/, "📺"],
    [/neopixel|farb|rgb/, "🎨"],
    [/motor|drehung|servo|stepper|antrieb/, "⚙️"],
    [/buzzer|ton|melodie|musik|hertz/, "🎵"],
    [/gyro|lage|beschleunig|orientierung/, "🧭"],
    [/strom|spannung|widerstand|ohm|volt/, "⚡"],
    [/pin|gpio|schaltung|verbindung/, "🔌"],
    [/webserver|http|browser/, "🌐"],
  ];
  for (const [pat, emoji] of rules) {
    if (pat.test(haystack)) return emoji;
  }
  return "💡";
}

interface SetupChecklistItem {
  iconKey?: "download" | "usb" | "monitor" | "cable" | "check";
  label_de?: string;
  label_en?: string;
  // Legacy-Format: {de, en} — wird automatisch in label_de/label_en gemappt
  // und URLs werden aus dem Text gezogen und als Button gerendert.
  de?: string;
  en?: string;
  hint_de?: string;
  hint_en?: string;
  link?: {
    label_de: string;
    label_en: string;
    url: string;
  };
}

const SETUP_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  download: Download,
  usb: Usb,
  monitor: Monitor,
  cable: Cable,
  check: CheckCircle2,
};

const URL_REGEX = /https?:\/\/[^\s)>"']+/i;

function normalizeChecklistItem(
  item: SetupChecklistItem,
  locale: "de" | "en",
): { label: string; hint?: string; link?: { url: string; label: string } } {
  // Modernes Format hat Vorrang
  if (item.label_de || item.label_en) {
    const label = (locale === "de" ? item.label_de : item.label_en) ?? "";
    const hint = locale === "de" ? item.hint_de : item.hint_en;
    const link = item.link
      ? {
          url: item.link.url,
          label: locale === "de" ? item.link.label_de : item.link.label_en,
        }
      : undefined;
    return { label, hint, link };
  }

  // Legacy-Format {de, en}
  const raw = (locale === "de" ? item.de : item.en) ?? "";
  const match = raw.match(URL_REGEX);
  if (match) {
    const url = match[0];
    const labelText = raw.replace(URL_REGEX, "").trim().replace(/[:\s]+$/, "");
    return {
      label: labelText || (locale === "de" ? "Link öffnen" : "Open link"),
      link: { url, label: locale === "de" ? "Öffnen" : "Open" },
    };
  }
  return { label: raw };
}

function SetupStep({
  title,
  body,
  payload,
  locale,
}: {
  title: string;
  body: string;
  payload: Record<string, unknown>;
  locale: "de" | "en";
}) {
  const t = useTranslations("lesson");
  const items = (payload.checklist as SetupChecklistItem[] | undefined) ?? [];
  const platformNotice =
    (payload[`platformNotice_${locale}`] as string | undefined) ?? null;
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold">{title}</h2>
        {body && <p className="mt-2 text-muted-foreground">{body}</p>}
      </header>

      {platformNotice && (
        <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Monitor className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
            <p className="text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-100">
              {platformNotice}
            </p>
          </CardContent>
        </Card>
      )}

      <ol className="grid gap-3">
        {items.map((item, idx) => {
          const Icon = SETUP_ICON_MAP[item.iconKey ?? "check"] ?? CheckCircle2;
          const norm = normalizeChecklistItem(item, locale);
          return (
            <li key={idx}>
              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="flex items-start gap-2 text-base font-semibold leading-snug">
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="break-words">{norm.label}</span>
                    </p>
                    {norm.hint && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {norm.hint}
                      </p>
                    )}
                    {norm.link && (
                      <a
                        href={norm.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {norm.link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      {(payload[`keyPoint_${locale}`] as string | undefined) && (
        <p className="rounded-md bg-primary/10 p-3 text-sm font-medium">
          💡 {payload[`keyPoint_${locale}`] as string}
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground">
        {t("setupFooterNote")}
      </p>
    </div>
  );
}
