import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { MedicalDocument } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { MedicalNeuralScannerArt } from '../components/art/MedicalNeuralScannerArt';
import { BiomarkerSpectrumArt } from '../components/art/BiomarkerSpectrumArt';
import { PillCapsuleArt } from '../components/art/PillCapsuleArt';
import { VoiceWaveArt } from '../components/art/VoiceWaveArt';
import {
  Reveal,
  Stagger,
  StaggerItem,
  WordReveal,
  Parallax,
  ScrollProgress,
  Counter,
  SpotlightCard,
  EASE_OUT_EXPO,
} from '../components/motion/primitives';
import {
  UploadCloud,
  Sparkles,
  Volume2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Globe2,
  HelpCircle,
  ChevronDown,
  Lock,
  Zap,
  Pill,
  MessageSquareQuote,
  CalendarClock,
  ScanLine,
  Star,
  Quote,
  Check,
  Building2,
  Stethoscope,
  Languages,
  FileHeart,
} from 'lucide-react';

interface LandingViewProps {
  onOpenUpload: () => void;
  onSelectSample: (doc: MedicalDocument) => void;
  onNavigateToDashboard: () => void;
}

/* ── Section heading: shared eyebrow + title + optional lede ─────────── */
const SectionHeading: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  align?: 'center' | 'left';
}> = ({ eyebrow, title, lede, align = 'center' }) => (
  <div className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
    <Reveal direction="none">
      <span className="eyebrow text-gradient-violet">{eyebrow}</span>
    </Reveal>
    <Reveal delay={0.08} className="mt-3">
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold font-display leading-[1.12] text-gradient-soft">
        {title}
      </h2>
    </Reveal>
    {lede && (
      <Reveal delay={0.16} className="mt-4">
        <p className="text-sm sm:text-base text-violet-200/60 leading-relaxed">{lede}</p>
      </Reveal>
    )}
  </div>
);

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenUpload,
  onSelectSample,
  onNavigateToDashboard,
}) => {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const [activeInteractiveToken, setActiveInteractiveToken] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isPlayingDemoVoice, setIsPlayingDemoVoice] = useState<boolean>(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  const sampleRx = SAMPLE_DOCUMENTS[0];
  const sampleLab = SAMPLE_DOCUMENTS[1];
  const sampleDischarge = SAMPLE_DOCUMENTS[2];

  const demoDocuments = [sampleRx, sampleLab, sampleDischarge];
  const activeDemo = demoDocuments[selectedDemoIndex] || sampleRx;

  /* Hero scroll choreography: content recedes as the fold leaves. */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(heroProgress, [0, 0.75], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], [0, 90]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.95]);

  /* Pipeline: the connector line draws itself as you scroll the section. */
  const pipelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: pipelineProgress } = useScroll({
    target: pipelineRef,
    offset: ['start 0.8', 'end 0.55'],
  });
  const lineScale = useSpring(pipelineProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  const sampleTokens = [
    { text: 'Atorvastatin 40mg', type: 'Medicine', confidence: 96, status: 'high', note: 'Standard pharmacopeia match. Clear optical typography. High confidence extraction.' },
    { text: 'Lisinopril 10?mg', type: 'Dosage Ambiguity', confidence: 62, status: 'low', note: 'Cursive digit swirl ambiguous between 10mg and 20mg. Flagged for pharmacist verification.' },
    { text: 'PO QHS', type: 'Latin Shorthand', confidence: 91, status: 'high', note: 'Decoded Latin abbreviation into "Take by mouth at bedtime with water".' },
    { text: 'Aspirin 81mg', type: 'Medicine', confidence: 94, status: 'high', note: 'Clear printed text. Anti-platelet regimen verified.' },
    { text: 'eGFR 48 mL/min', type: 'Lab Metric', confidence: 88, status: 'medium', note: 'Moderate deviation below standard 60 threshold. Doctor discussion prompt generated.' },
  ];

  const handleToggleVoiceDemo = () => {
    setIsPlayingDemoVoice(!isPlayingDemoVoice);
    if (!isPlayingDemoVoice && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        activeDemo.audioText || activeDemo.plainSummary.overview
      );
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingDemoVoice(false);
      utterance.onerror = () => setIsPlayingDemoVoice(false);
      window.speechSynthesis.speak(utterance);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  /* Honest product-scope metrics — each is a design guarantee or a
     countable capability, not an unverifiable performance claim. */
  const metrics = [
    { value: 5, suffix: '+', label: 'Narration languages', sub: 'EN · ES · HI · FR · ZH' },
    { value: 3, suffix: '', label: 'Clinical formats', sub: 'Rx · Labs · Discharge' },
    { value: 100, suffix: '%', label: 'Uncertain tokens flagged', sub: 'Never silently guessed' },
    { value: 0, suffix: '', label: 'Records retained', sub: 'Ephemeral by architecture' },
  ];

  const trustChips = [
    { icon: ShieldCheck, label: 'Non-Diagnostic by Design' },
    { icon: Lock, label: 'Zero-Retention Processing' },
    { icon: Languages, label: '5+ Language Narration' },
    { icon: ScanLine, label: 'Token-Level Confidence' },
    { icon: Stethoscope, label: 'Defers to Your Clinician' },
    { icon: FileHeart, label: 'Caregiver-Friendly Output' },
  ];

  const bentoFeatures = [
    {
      icon: ScanLine,
      title: 'Confidence Map',
      body: 'Every extracted token carries a certainty score. Ambiguous handwriting is surfaced in dashed amber rather than resolved by guesswork.',
      accent: 'from-violet-500/20 to-fuchsia-500/5',
      iconTint: 'text-violet-300 bg-violet-950/70 border-violet-500/40',
      span: 'lg:col-span-3 lg:row-span-2',
      feature: true,
    },
    {
      icon: Volume2,
      title: 'Multilingual Narration',
      body: 'Care plans read aloud at adjustable speed for elderly relatives and non-native speakers.',
      iconTint: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/40',
      span: 'lg:col-span-3',
    },
    {
      icon: Pill,
      title: 'Interaction Audit',
      body: 'Cross-checks the full regimen for drug-drug conflicts and food pairing constraints.',
      iconTint: 'text-pink-300 bg-pink-950/70 border-pink-500/40',
      span: 'lg:col-span-3',
    },
    {
      icon: CalendarClock,
      title: 'Schedule Timeline',
      body: 'Latin shorthand becomes a visual morning-to-night dosing timeline.',
      iconTint: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40',
      span: 'lg:col-span-2',
    },
    {
      icon: MessageSquareQuote,
      title: 'Doctor Questions',
      body: 'Generates the exact questions worth asking at your next appointment.',
      iconTint: 'text-amber-300 bg-amber-950/70 border-amber-500/40',
      span: 'lg:col-span-2',
    },
    {
      icon: Lock,
      title: 'Zero Retention',
      body: 'Documents are processed in-session and never used for training.',
      iconTint: 'text-purple-300 bg-purple-950/70 border-purple-500/40',
      span: 'lg:col-span-2',
    },
  ];

  const pipeline = [
    { n: '01', icon: Camera, title: 'Snap or Upload', body: "Photograph paper prescriptions with your phone, or drop lab PDFs and discharge summaries.", tint: 'violet' },
    { n: '02', icon: Sparkles, title: 'Score Confidence', body: 'Multi-pass OCR verifies tokens against pharmacopeias and visually flags low-confidence handwriting.', tint: 'pink' },
    { n: '03', icon: CheckCircle2, title: 'Plain Translation', body: 'Shorthand becomes a clear schedule with food advice and doctor discussion prompts.', tint: 'emerald' },
    { n: '04', icon: Volume2, title: 'Spoken Audio', body: 'Listen in your language at a comfortable speed, with synchronized text highlighting.', tint: 'cyan' },
  ];

  const testimonials = [
    {
      quote: 'I photographed my mother\'s discharge paperwork and finally understood the wound-care timeline. The flagged dose was exactly the one the pharmacist corrected.',
      name: 'Priya R.',
      role: 'Family caregiver',
      tint: 'violet',
    },
    {
      quote: 'The confidence scoring is the part that earns trust. It tells me what it could not read instead of inventing a number — that is the right default for medication.',
      name: 'Dr. Adeola M.',
      role: 'Primary care physician',
      tint: 'cyan',
    },
    {
      quote: 'My father listens to his care plan in Hindi every morning. He stopped calling me to ask which pill goes with dinner.',
      name: 'Vikram S.',
      role: 'Patient\'s son',
      tint: 'pink',
    },
  ];

  const plans = [
    {
      name: 'Personal',
      tagline: 'For individuals decoding their own documents.',
      monthly: 0,
      annual: 0,
      cta: 'Start free',
      features: [
        '5 documents per month',
        'Confidence map + plain translation',
        'English narration',
        'Zero-retention processing',
      ],
      highlighted: false,
    },
    {
      name: 'Family',
      tagline: 'For caregivers managing several people at once.',
      monthly: 12,
      annual: 9,
      cta: 'Start 14-day trial',
      features: [
        'Unlimited documents',
        'All 5+ narration languages',
        'Drug interaction audit',
        'Schedule timeline + reminders',
        'Up to 5 family profiles',
      ],
      highlighted: true,
    },
    {
      name: 'Clinic',
      tagline: 'For practices handing documents to patients.',
      monthly: null,
      annual: null,
      cta: 'Talk to us',
      features: [
        'Everything in Family',
        'Team workspace + audit log',
        'Custom language packs',
        'BAA available',
        'Priority support',
      ],
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: 'Is Medora AI a diagnostic medical tool?',
      a: 'No, absolutely not. Medora AI is strictly an explanatory medical document copilot. It explains what is written on documents you already received from a licensed healthcare provider, converts medical shorthand into plain language, and highlights handwriting uncertainties so you can review them with your doctor or pharmacist.',
    },
    {
      q: 'How does Medora handle unreadable or ambiguous doctor handwriting?',
      a: 'Instead of hallucinating or making dangerous guesses, Medora computes a token-level confidence score. Any ambiguous dosages, illegible medication names, or questionable numbers are highlighted with dashed amber alerts and flagged with "Ask your doctor" guidance.',
    },
    {
      q: 'Can elderly relatives or non-native speakers listen to the audio care plan?',
      a: 'Yes. Medora generates synchronized voice audio in 5+ languages (English, Spanish, Hindi, French, Mandarin) with adjustable playback speed and text-scaling for visual comfort.',
    },
    {
      q: 'How is patient health data and privacy protected?',
      a: 'Medora operates on a zero-data-retention architectural principle. Documents uploaded for explanation are processed ephemerally in-session and are never sold, retained for model training, or linked to external marketing trackers.',
    },
    {
      q: 'What happens if Medora cannot read part of my document?',
      a: 'That region is reported as low confidence rather than filled in. You will see the raw crop, the competing interpretations Medora considered, and a prompt to confirm with your pharmacist before acting on it.',
    },
  ];

  return (
    <div id="medora-landing-view" className="relative text-slate-100 overflow-hidden">
      <ScrollProgress />

      {/* ══════════════════════════════════════════════════════════
          1 · HERO
          ══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative bg-grid-fade pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6">
        {/* Concentrated glow behind the headline */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(90vw,52rem)] h-[28rem] bg-violet-600/18 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-[8%] w-72 h-72 bg-fuchsia-500/12 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          {/* Live badge with an orbiting conic sweep */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="inline-flex relative rounded-full p-[1px] overflow-hidden"
          >
            <span
              aria-hidden
              className="absolute inset-[-200%] animate-orbit-sweep bg-[conic-gradient(from_0deg,transparent_0%,#a855f7_18%,#22d3ee_28%,transparent_42%)]"
            />
            <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink-900/90 backdrop-blur-xl text-[11px] sm:text-xs font-bold tracking-wide text-violet-200">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              AI MEDICAL DOCUMENT COPILOT
              <span className="text-violet-500">·</span>
              <span className="text-cyan-300">CONFIDENCE MAP</span>
            </span>
          </motion.div>

          <WordReveal
            text="Decode messy prescriptions with radical confidence."
            accentFrom={3}
            delay={0.15}
            className="mt-7 text-[2.1rem] leading-[1.08] sm:text-6xl lg:text-[4.25rem] font-extrabold font-display tracking-tight text-white"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE_OUT_EXPO }}
            className="mt-6 text-sm sm:text-lg text-violet-200/65 max-w-2xl mx-auto leading-relaxed"
          >
            Medora turns handwritten prescriptions, dense lab panels, and discharge notes into
            spoken instructions in your language — while visibly disclosing every handwriting
            uncertainty instead of guessing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.68, ease: EASE_OUT_EXPO }}
            className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5"
          >
            <motion.button
              id="hero-upload-cta"
              onClick={onOpenUpload}
              whileHover={{ scale: 1.035, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="btn-sheen w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white font-bold text-sm sm:text-base shadow-[0_8px_32px_-8px_rgba(139,92,246,0.75)] flex items-center justify-center gap-2.5 min-h-[52px]"
            >
              <UploadCloud className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Upload or Scan Document</span>
            </motion.button>

            <motion.button
              id="hero-sample-cta"
              onClick={() => onSelectSample(sampleRx)}
              whileHover={{ scale: 1.035, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="glass-panel ring-gradient w-full sm:w-auto px-8 py-4 rounded-2xl text-violet-100 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 min-h-[52px]"
            >
              <Sparkles className="w-5 h-5 text-cyan-300" />
              <span>Try Live Interactive Rx</span>
            </motion.button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[11px] sm:text-xs text-violet-300/55 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Non-diagnostic guardrails
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 5+ languages, spoken
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-400" /> Character-level confidence
            </span>
          </motion.div>
        </motion.div>

        {/* Product shot — floats up on load, drifts with scroll */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.1, delay: 0.9, ease: EASE_OUT_EXPO }}
          className="relative z-10 mt-16 sm:mt-20 max-w-5xl mx-auto"
          style={{ perspective: 1200 }}
        >
          <div className="absolute -inset-x-12 -top-8 h-40 bg-violet-500/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <Reveal direction="right" distance={24}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-violet-200 text-[11px] font-bold tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  MULTI-PASS OPTICAL REVIEW
                </div>
              </Reveal>
              <Reveal direction="right" distance={24} delay={0.08}>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-gradient-soft leading-tight">
                  See what the AI reads before you take a dose.
                </h2>
              </Reveal>
              <Reveal direction="right" distance={24} delay={0.16}>
                <p className="text-sm text-violet-200/60 leading-relaxed">
                  Never guess at a doctor's handwriting. Medora colour-codes verified matches and
                  flags cursive ambiguity in warning amber — so the uncertainty is on the screen,
                  not in your medicine cabinet.
                </p>
              </Reveal>
              <Reveal direction="right" distance={24} delay={0.24}>
                <motion.button
                  onClick={onNavigateToDashboard}
                  whileHover={{ x: 4 }}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel card-lift text-white text-xs font-bold"
                >
                  <span>Launch Clinical Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-fuchsia-400 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <Parallax speed={34}>
                <motion.div whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
                  <MedicalNeuralScannerArt />
                </motion.div>
              </Parallax>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2 · TRUST MARQUEE
          ══════════════════════════════════════════════════════════ */}
      <section className="relative py-10 border-y border-violet-500/10 bg-ink-900/40 backdrop-blur-sm">
        <Reveal direction="none" className="text-center mb-6 px-4">
          <span className="eyebrow text-violet-400/60">Built on a few non-negotiables</span>
        </Reveal>
        <div className="marquee-viewport marquee-mask overflow-hidden">
          <div className="marquee-track gap-4">
            {[...trustChips, ...trustChips].map((chip, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 shrink-0 px-5 py-2.5 rounded-full glass-panel text-xs font-semibold text-violet-100/80 whitespace-nowrap"
              >
                <chip.icon className="w-4 h-4 text-violet-400" />
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3 · METRICS BAND
          ══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" gap={0.11}>
          {metrics.map((m) => (
            <StaggerItem key={m.label}>
              <div className="glass-panel ring-gradient card-lift rounded-2xl p-5 sm:p-7 h-full text-center sm:text-left">
                <div className="text-4xl sm:text-5xl font-extrabold font-display text-gradient-violet tabular-nums">
                  <Counter to={m.value} suffix={m.suffix} />
                </div>
                <div className="mt-3 text-xs sm:text-sm font-bold text-white">{m.label}</div>
                <div className="mt-1 text-[11px] text-violet-300/50 font-medium">{m.sub}</div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4 · BEFORE / AFTER COMPARISON
          ══════════════════════════════════════════════════════════ */}
      <section id="section-compare" className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 scroll-mt-28">
        <SectionHeading
          eyebrow="The translation gap"
          title={<>What you're handed, versus <span className="text-gradient-violet">what you can act on</span></>}
          lede="Switch between the three clinical formats Medora handles and watch the same document become a schedule you can follow."
        />

        <Reveal delay={0.1} blur className="mt-12">
          <div className="glass-panel ring-gradient rounded-3xl overflow-hidden">
            {/* Tab bar with a sliding layoutId pill */}
            <div className="bg-ink-950/60 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-500/12">
              <div className="flex items-center gap-3 overflow-x-auto">
                <span className="text-[10px] font-bold text-violet-400/70 uppercase shrink-0 tracking-widest">
                  Live comparison
                </span>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-800/60">
                  {demoDocuments.map((doc, idx) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDemoIndex(idx)}
                      className="relative px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      {selectedDemoIndex === idx && (
                        <motion.span
                          layoutId="compare-tab-pill"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_16px_-2px_rgba(139,92,246,0.8)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className={`relative z-10 ${selectedDemoIndex === idx ? 'text-white' : 'text-violet-300/70 hover:text-white'}`}>
                        {doc.type === 'prescription' ? 'Rx Cursive' : doc.type === 'lab_report' ? 'Lab Panel' : 'Discharge'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={() => onSelectSample(activeDemo)}
                whileHover={{ x: 3 }}
                className="text-xs text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1.5 self-end sm:self-auto cursor-pointer shrink-0"
              >
                Open in Copilot Console <ArrowRight className="w-3.5 h-3.5 text-fuchsia-400" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-violet-500/12">
              {/* ── Left: raw document ── */}
              <div className="p-5 sm:p-7 bg-ink-950/40 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-violet-500/12">
                    <div>
                      <span className="text-[10px] font-bold text-violet-400/70 uppercase tracking-widest">
                        The patient problem
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
                        {activeDemo.type === 'prescription'
                          ? 'Handwritten Clinic Prescription'
                          : activeDemo.type === 'lab_report'
                          ? 'Dense Numerical Lab Panel'
                          : 'Hospital Discharge Summary'}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[10px] font-bold shrink-0">
                      Confusing jargon
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeDemo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
                      className="mt-4 p-4 bg-ink-800/70 rounded-2xl border border-violet-500/20 font-serif space-y-2.5 text-xs sm:text-sm"
                    >
                      <div className="text-[11px] text-violet-300/50 font-sans flex items-center justify-between">
                        <span>{activeDemo.doctorName || 'Dr. S. Jenkins, MD'}</span>
                        <span>{activeDemo.clinicName || 'Heart Care Center'}</span>
                      </div>

                      {activeDemo.type === 'prescription' ? (
                        <div className="text-violet-100 italic space-y-1.5 border-y border-violet-500/15 py-3 leading-relaxed">
                          <p className="line-through opacity-40">1. Atorvastatin 40mg #30 - 1 tab PO QHS</p>
                          <p className="bg-amber-950/60 border border-amber-500/50 px-2 py-1 rounded font-bold text-amber-200 not-italic">
                            2. Lisinopril 10?mg - 1 tab PO QAM (swirl ambiguous with 20mg)
                          </p>
                          <p>3. Aspirin EC 81mg - 1 tab daily w/ food</p>
                          <p>4. Metformin ER 500mg - 1 tab PO with dinner</p>
                        </div>
                      ) : activeDemo.type === 'lab_report' ? (
                        <div className="text-violet-200 space-y-1.5 border-y border-violet-500/15 py-3 font-mono text-[11px]">
                          <p>GLUCOSE SERUM: 128 mg/dL [REF 70-99] HIGH*</p>
                          <p>HEMOGLOBIN A1C: 7.2 % [REF 4.0-5.6] HIGH*</p>
                          <p className="bg-amber-950/60 border border-amber-500/50 p-1.5 rounded font-bold text-amber-200">
                            eGFR CREATININE: 48 mL/min [REF &gt;60] ABNORMAL
                          </p>
                          <p>CHOLESTEROL TOTAL: 218 mg/dL [REF &lt;200] HIGH</p>
                        </div>
                      ) : (
                        <div className="text-violet-200 space-y-2 border-y border-violet-500/15 py-3 text-xs">
                          <p><strong>Primary Dx:</strong> Acute Uncomplicated Appendicitis s/p Lap Appendectomy</p>
                          <p><strong>Wound Care:</strong> Remove dressing POD#3. Steri-strips intact.</p>
                          <p className="bg-amber-950/60 border border-amber-500/50 px-2 py-1 rounded font-semibold text-amber-200">
                            <strong>Red Flags:</strong> Return to ED if T &gt; 101.5F, intractable emesis, or erythema.
                          </p>
                        </div>
                      )}

                      <div className="flex items-start gap-2 text-[11px] text-amber-300/90 font-sans font-semibold pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-px" />
                        <span>Latin shorthand (QHS, PO), numerical units, and cursive ambiguity all stack up at once.</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <p className="text-[11px] text-violet-300/40 italic">
                  Unreadable shorthand and unverified dosage numbers are a common source of medication misunderstandings.
                </p>
              </div>

              {/* ── Right: translated output ── */}
              <div className="p-5 sm:p-7 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-violet-500/12">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest">
                        What Medora delivers
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
                        Plain-Language Schedule & Safety Guard
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Safe & clear
                    </span>
                  </div>

                  <Stagger className="mt-4 space-y-3" gap={0.1} amount={0.2}>
                    <StaggerItem distance={16}>
                      <div className="p-3.5 rounded-2xl bg-ink-800/60 border border-violet-500/25 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">☀️ Morning with breakfast</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] tabular-nums">
                            91% certainty
                          </span>
                        </div>
                        <p className="text-violet-200/80 text-[11px] sm:text-xs leading-relaxed">
                          Take <strong className="text-white">Aspirin 81 mg</strong> with food to protect your heart and stomach.
                        </p>
                      </div>
                    </StaggerItem>

                    <StaggerItem distance={16}>
                      <motion.div
                        animate={{
                          boxShadow: [
                            '0 0 0 0 rgba(245,158,11,0)',
                            '0 0 24px -4px rgba(245,158,11,0.35)',
                            '0 0 0 0 rgba(245,158,11,0)',
                          ],
                        }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="p-3.5 rounded-2xl bg-amber-950/40 border-2 border-dashed border-amber-500/70 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-amber-200 flex items-center gap-1.5 text-xs sm:text-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            Lisinopril (blood pressure)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-amber-200 font-extrabold text-[10px] tabular-nums shrink-0">
                            64% uncertain
                          </span>
                        </div>
                        <p className="text-amber-200/85 font-medium text-[11px] sm:text-xs leading-relaxed">
                          ⚠️ <strong>Handwriting note:</strong> the dose is unclear between 10 mg and 20 mg.
                          Confirm with your pharmacist before taking.
                        </p>
                      </motion.div>
                    </StaggerItem>

                    <StaggerItem distance={16}>
                      <div className="p-3.5 rounded-2xl bg-ink-800/60 border border-violet-500/25 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">🌙 Evening with dinner</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] tabular-nums">
                            94% certainty
                          </span>
                        </div>
                        <p className="text-violet-200/80 text-[11px] sm:text-xs leading-relaxed">
                          Take <strong className="text-white">Atorvastatin 40 mg</strong> and{' '}
                          <strong className="text-white">Metformin 500 mg</strong> with dinner.
                        </p>
                      </div>
                    </StaggerItem>
                  </Stagger>
                </div>

                {/* Audio preview */}
                <div className="p-3 rounded-2xl bg-ink-950/70 border border-violet-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <motion.div
                      animate={isPlayingDemoVoice ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={{ duration: 1.1, repeat: isPlayingDemoVoice ? Infinity : 0 }}
                      className="w-7 h-7 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                    <span className="font-medium text-[11px] sm:text-xs text-violet-200/80 truncate">
                      {isPlayingDemoVoice ? 'Speaking translated care plan…' : 'Listen in English, Spanish, Hindi + 2 more'}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleVoiceDemo}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200 shrink-0 cursor-pointer px-2 py-1"
                  >
                    {isPlayingDemoVoice ? 'Stop' : 'Listen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5 · BENTO FEATURE GRID
          ══════════════════════════════════════════════════════════ */}
      <section id="section-features" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 scroll-mt-28">
        <SectionHeading
          eyebrow="Platform"
          title={<>Everything between the clinic door and <span className="text-gradient-violet">the right dose</span></>}
          lede="Six capabilities that work on the document you already have — no portal login, no chasing the practice for a rewrite."
        />

        <Stagger className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5" gap={0.08}>
          {bentoFeatures.map((f) => (
            <StaggerItem key={f.title} className={f.span}>
              <SpotlightCard className="glass-panel ring-gradient card-lift rounded-3xl p-6 sm:p-7 h-full flex flex-col">
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${f.iconTint}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className={`mt-5 font-bold font-display text-white ${f.feature ? 'text-xl sm:text-2xl' : 'text-base'}`}>
                  {f.title}
                </h3>
                <p className={`mt-2.5 text-violet-200/60 leading-relaxed ${f.feature ? 'text-sm' : 'text-xs sm:text-[13px]'}`}>
                  {f.body}
                </p>

                {/* The hero bento tile carries a miniature live confidence strip */}
                {f.feature && (
                  <div className="mt-6 pt-5 border-t border-violet-500/12 flex-1 flex flex-col justify-end gap-2.5">
                    {[
                      { label: 'Atorvastatin 40mg', pct: 96, tone: 'emerald' },
                      { label: 'Lisinopril 10?mg', pct: 62, tone: 'amber' },
                      { label: 'PO QHS', pct: 91, tone: 'emerald' },
                    ].map((row, i) => (
                      <div key={row.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={row.tone === 'amber' ? 'text-amber-200 font-semibold' : 'text-violet-200/80'}>
                            {row.label}
                          </span>
                          <span className={`tabular-nums font-bold ${row.tone === 'amber' ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {row.pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-ink-700/80 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${row.pct}%` }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.14, ease: EASE_OUT_EXPO }}
                            className={`h-full rounded-full ${
                              row.tone === 'amber'
                                ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                                : 'bg-gradient-to-r from-violet-500 to-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6 · CONFIDENCE PLAYGROUND
          ══════════════════════════════════════════════════════════ */}
      <section id="section-confidence-map" className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 scroll-mt-28">
        <Reveal blur>
          <div className="glass-panel ring-gradient rounded-3xl p-6 sm:p-10 space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-violet-500/12">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-950/70 border border-violet-500/40 text-violet-300 text-[11px] font-bold tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> SIGNATURE FEATURE
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-gradient-soft mt-2.5">
                  Interactive OCR Confidence Map
                </h2>
                <p className="text-xs sm:text-sm text-violet-200/60 mt-2 max-w-xl">
                  Tap any extracted clinical token to inspect how Medora flags uncertainty instead of guessing.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-300 glass-panel px-4 py-2 rounded-xl self-start sm:self-auto whitespace-nowrap">
                Disclose, never disguise
              </span>
            </div>

            {/* Token strip */}
            <div className="flex flex-wrap gap-2.5">
              {sampleTokens.map((token, idx) => {
                const isSelected = activeInteractiveToken === idx;
                const isLow = token.status === 'low';
                const isMed = token.status === 'medium';

                return (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveInteractiveToken(idx)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer min-h-[46px] ${
                      isSelected
                        ? 'text-white'
                        : isLow
                        ? 'bg-amber-950/50 text-amber-200 border-2 border-dashed border-amber-500/70'
                        : isMed
                        ? 'bg-fuchsia-950/40 text-fuchsia-200 border border-fuchsia-500/40'
                        : 'bg-ink-800/70 text-violet-200 border border-violet-500/25'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="token-highlight"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 ring-2 ring-violet-400/60 shadow-[0_0_20px_-2px_rgba(139,92,246,0.9)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{token.text}</span>
                    <span
                      className={`relative z-10 px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums ${
                        isSelected ? 'bg-black/30 text-white' : isLow ? 'bg-amber-900/80 text-amber-200' : 'bg-violet-900/60 text-violet-300'
                      }`}
                    >
                      {token.confidence}%
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Inspection panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInteractiveToken}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className="p-5 sm:p-6 rounded-2xl bg-ink-950/70 border border-violet-500/20 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-extrabold text-white font-display">
                      {sampleTokens[activeInteractiveToken].text}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-900/50 text-violet-300 border border-violet-500/30 uppercase tracking-wider">
                      {sampleTokens[activeInteractiveToken].type}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-black tabular-nums ${
                      sampleTokens[activeInteractiveToken].status === 'low'
                        ? 'bg-amber-950 border border-amber-500/50 text-amber-300'
                        : 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                    }`}
                  >
                    {sampleTokens[activeInteractiveToken].confidence}% confidence
                  </span>
                </div>

                {/* Certainty meter */}
                <div className="h-2 rounded-full bg-ink-700/80 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sampleTokens[activeInteractiveToken].confidence}%` }}
                    transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                    className={`h-full rounded-full ${
                      sampleTokens[activeInteractiveToken].status === 'low'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-300'
                        : 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400'
                    }`}
                  />
                </div>

                <p className="text-xs sm:text-sm text-violet-200/75 leading-relaxed">
                  {sampleTokens[activeInteractiveToken].note}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7 · PIPELINE — scroll-drawn connector
          ══════════════════════════════════════════════════════════ */}
      <section id="section-pipeline" ref={pipelineRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 scroll-mt-28">
        <SectionHeading
          eyebrow="Patient workflow"
          title={<>From paper in your hand to <span className="text-gradient-violet">audio in your language</span></>}
          lede="Four steps, built for patients, elderly family members, and the clinics that hand out the paperwork."
        />

        <div className="relative mt-16">
          {/* Connector rail — scales with scroll progress */}
          <div className="hidden lg:block absolute top-[38px] left-[8%] right-[8%] h-px bg-violet-500/15">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_10px_rgba(168,85,247,0.7)]"
              style={{ scaleX: lineScale }}
            />
          </div>

          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6" gap={0.12}>
            {pipeline.map((step) => (
              <StaggerItem key={step.n}>
                <SpotlightCard className="glass-panel ring-gradient card-lift rounded-3xl p-6 h-full">
                  <div className="relative z-10 flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm tabular-nums border ${
                        step.tint === 'violet'
                          ? 'bg-violet-950/80 border-violet-500/40 text-violet-300'
                          : step.tint === 'pink'
                          ? 'bg-fuchsia-950/80 border-fuchsia-500/40 text-fuchsia-300'
                          : step.tint === 'emerald'
                          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                          : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      {step.n}
                    </div>
                    <step.icon className="w-5 h-5 text-violet-400/50" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white font-display">{step.title}</h3>
                  <p className="mt-2 text-xs text-violet-200/60 leading-relaxed">{step.body}</p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8 · VISUAL ENGINE
          ══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <SectionHeading
          eyebrow="Visual engine"
          title={<>Clinical data, rendered for <span className="text-gradient-violet">human comprehension</span></>}
        />

        <Stagger className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6" gap={0.13}>
          <StaggerItem>
            <Parallax speed={18} className="h-full">
              <BiomarkerSpectrumArt className="h-full flex flex-col justify-between card-lift" />
            </Parallax>
          </StaggerItem>

          <StaggerItem>
            <Parallax speed={30} className="h-full">
              <div className="rounded-2xl glass-panel card-lift p-5 shadow-[0_0_30px_rgba(139,92,246,0.15)] flex flex-col justify-between h-full">
                <div className="flex items-center justify-between border-b border-violet-500/15 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                    <span className="text-[11px] font-bold text-white tracking-wider">
                      MEDICATION REGIMEN SAFETY
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/60 border border-violet-500/40 text-violet-300 font-semibold">
                    DRUG-DRUG AUDIT
                  </span>
                </div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <PillCapsuleArt />
                </motion.div>

                <div className="pt-2 border-t border-violet-500/15 text-center">
                  <p className="text-[11px] text-violet-300/60">
                    Automated multi-substance interaction & food pairing checks
                  </p>
                </div>
              </div>
            </Parallax>
          </StaggerItem>

          <StaggerItem>
            <Parallax speed={18} className="h-full">
              <VoiceWaveArt className="h-full flex flex-col justify-between card-lift" isPlaying={isPlayingDemoVoice} />
            </Parallax>
          </StaggerItem>
        </Stagger>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9 · SAMPLE DOCUMENTS
          ══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <Reveal blur>
          <div className="glass-panel ring-gradient rounded-3xl p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-violet-500/12">
              <div>
                <span className="eyebrow text-gradient-violet">Instant test drive</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-gradient-soft mt-2.5">
                  Explore real clinical formats in the copilot
                </h3>
              </div>
              <motion.button
                onClick={onOpenUpload}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className="btn-sheen px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-bold shadow-[0_8px_28px_-8px_rgba(139,92,246,0.8)] self-start sm:self-auto min-h-[46px] whitespace-nowrap"
              >
                <span className="relative z-10">Upload your file</span>
              </motion.button>
            </div>

            <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5" gap={0.1}>
              {SAMPLE_DOCUMENTS.map((doc) => (
                <StaggerItem key={doc.id}>
                  <SpotlightCard
                    onClick={() => onSelectSample(doc)}
                    className="group bg-ink-950/60 border border-violet-500/20 card-lift p-5 rounded-2xl cursor-pointer h-full flex flex-col justify-between gap-4"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-500/40 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                          {doc.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-cyan-300 font-bold tabular-nums">
                          {doc.overallConfidence}% conf
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white font-display group-hover:text-violet-200 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-violet-200/55 mt-1.5 line-clamp-2 leading-relaxed">
                        {doc.plainSummary.overview}
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-xs pt-3 border-t border-violet-500/15 text-violet-300/60">
                      <span>{doc.doctorName?.split(',')[0]}</span>
                      <span className="font-bold text-cyan-300 flex items-center gap-1">
                        Launch copilot
                        <ArrowRight className="w-3.5 h-3.5 text-fuchsia-400 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          10 · TESTIMONIALS
          ══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <SectionHeading
          eyebrow="Why people keep it"
          title={<>Trust is earned by admitting <span className="text-gradient-violet">what you can't read</span></>}
        />

        <Stagger className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6" gap={0.12}>
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <SpotlightCard className="glass-panel ring-gradient card-lift rounded-3xl p-6 sm:p-7 h-full flex flex-col justify-between gap-6">
                <div className="relative z-10">
                  <Quote className="w-7 h-7 text-violet-500/40" />
                  <p className="mt-4 text-sm text-violet-100/85 leading-relaxed">{t.quote}</p>
                </div>
                <div className="relative z-10 flex items-center gap-3 pt-5 border-t border-violet-500/12">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                      t.tint === 'violet'
                        ? 'bg-gradient-to-br from-violet-500 to-purple-700'
                        : t.tint === 'cyan'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-700'
                        : 'bg-gradient-to-br from-fuchsia-500 to-rose-700'
                    }`}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{t.name}</div>
                    <div className="text-[11px] text-violet-300/55">{t.role}</div>
                  </div>
                  <div className="ml-auto flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ══════════════════════════════════════════════════════════
          11 · PRICING
          ══════════════════════════════════════════════════════════ */}
      <section id="section-pricing" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 scroll-mt-28">
        <SectionHeading
          eyebrow="Pricing"
          title={<>Start free. Upgrade when <span className="text-gradient-violet">you're caring for someone</span></>}
          lede="Every tier keeps the confidence map and the non-diagnostic guardrails. Those are not premium features."
        />

        {/* Billing toggle */}
        <Reveal delay={0.12} className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl glass-panel">
            {(['monthly', 'annual'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className="relative px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer capitalize"
              >
                {billing === cycle && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={`relative z-10 ${billing === cycle ? 'text-white' : 'text-violet-300/70'}`}>
                  {cycle}
                  {cycle === 'annual' && (
                    <span className={`ml-1.5 ${billing === cycle ? 'text-cyan-200' : 'text-cyan-400'}`}>−25%</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch" gap={0.12}>
          {plans.map((plan) => {
            const price = billing === 'annual' ? plan.annual : plan.monthly;
            return (
              <StaggerItem key={plan.name} className="h-full">
                <SpotlightCard
                  className={`relative rounded-3xl p-7 sm:p-8 h-full flex flex-col ${
                    plan.highlighted
                      ? 'glass-panel border-violet-400/40 shadow-[0_0_60px_-16px_rgba(139,92,246,0.7)]'
                      : 'glass-panel ring-gradient card-lift'
                  }`}
                >
                  {plan.highlighted && (
                    <>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-[10px] font-extrabold tracking-wider text-white shadow-lg whitespace-nowrap">
                        MOST CHOSEN
                      </div>
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-violet-500/8 to-transparent pointer-events-none" />
                    </>
                  )}

                  <div className="relative z-10">
                    <h3 className="text-lg font-extrabold font-display text-white">{plan.name}</h3>
                    <p className="mt-1.5 text-xs text-violet-200/55 leading-relaxed min-h-[32px]">{plan.tagline}</p>

                    <div className="mt-6 flex items-end gap-1.5">
                      {price === null ? (
                        <span className="text-3xl sm:text-4xl font-extrabold font-display text-gradient-soft">Custom</span>
                      ) : (
                        <>
                          <span className="text-4xl sm:text-5xl font-extrabold font-display text-gradient-soft tabular-nums">
                            ${price}
                          </span>
                          <span className="text-xs text-violet-300/50 font-medium mb-2">
                            {price === 0 ? 'forever' : '/ month'}
                          </span>
                        </>
                      )}
                    </div>
                    {price !== null && price > 0 && billing === 'annual' && (
                      <p className="mt-1 text-[11px] text-cyan-400/80 font-semibold">billed annually</p>
                    )}

                    <motion.button
                      onClick={plan.name === 'Clinic' ? onNavigateToDashboard : onOpenUpload}
                      whileHover={{ scale: 1.025 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                      className={`mt-7 w-full py-3.5 rounded-xl font-bold text-sm min-h-[48px] cursor-pointer ${
                        plan.highlighted
                          ? 'btn-sheen bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_8px_28px_-8px_rgba(139,92,246,0.8)]'
                          : 'bg-ink-800/80 border border-violet-500/30 text-violet-100 hover:border-violet-400/60'
                      }`}
                    >
                      <span className="relative z-10">{plan.cta}</span>
                    </motion.button>

                    <ul className="mt-7 space-y-3 pt-6 border-t border-violet-500/12">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs text-violet-200/70">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-px" />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* ══════════════════════════════════════════════════════════
          12 · SAFETY & PRIVACY
          ══════════════════════════════════════════════════════════ */}
      <section id="section-clinical-safety" className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 scroll-mt-28">
        <SectionHeading
          eyebrow="Trust & safety"
          title={<>The guardrails are <span className="text-gradient-violet">the product</span></>}
        />

        <Stagger className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6" gap={0.12}>
          {[
            {
              icon: ShieldCheck,
              tint: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40',
              title: 'Explicit Clinical Deferral',
              body: 'Medora never diagnoses illness or prescribes treatment. It translates existing doctor orders and produces intelligent questions for your next appointment.',
            },
            {
              icon: Globe2,
              tint: 'text-violet-300 bg-violet-950/80 border-violet-500/40',
              title: 'Multilingual Equity',
              body: 'Bridging language barriers in family caregiving with natural voice synthesis and plain translations in Spanish, Hindi, French, and Mandarin.',
            },
            {
              icon: Lock,
              tint: 'text-fuchsia-300 bg-fuchsia-950/80 border-fuchsia-500/40',
              title: 'Zero-Retention Privacy',
              body: 'Medical scans are processed transiently in-session. Your clinical notes and health records are never harvested, sold, or used for training.',
            },
          ].map((card) => (
            <StaggerItem key={card.title}>
              <SpotlightCard className="glass-panel ring-gradient card-lift rounded-3xl p-7 h-full">
                <div className={`relative z-10 w-11 h-11 rounded-2xl border flex items-center justify-center ${card.tint}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="relative z-10 mt-5 text-base font-bold text-white font-display">{card.title}</h3>
                <p className="relative z-10 mt-2.5 text-xs sm:text-[13px] text-violet-200/60 leading-relaxed">{card.body}</p>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ══════════════════════════════════════════════════════════
          13 · FAQ
          ══════════════════════════════════════════════════════════ */}
      <section id="section-faq" className="relative max-w-4xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 scroll-mt-28">
        <SectionHeading eyebrow="FAQ" title={<>Questions patients & clinics ask</>} />

        <Stagger className="mt-12 space-y-3" gap={0.07}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <StaggerItem key={idx} distance={16}>
                <div
                  className={`glass-panel rounded-2xl overflow-hidden ${
                    isOpen ? 'border-violet-400/35' : 'card-lift'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white cursor-pointer min-h-[56px]"
                  >
                    <span className="flex items-start gap-3">
                      <HelpCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isOpen ? 'text-cyan-300' : 'text-violet-400/70'}`} />
                      <span>{faq.q}</span>
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                      className="shrink-0"
                    >
                      <ChevronDown className="w-4 h-4 text-violet-400" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.38, ease: EASE_OUT_EXPO }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 pt-1 text-xs sm:text-sm text-violet-200/65 leading-relaxed border-t border-violet-500/12 mt-0 pt-4">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* ══════════════════════════════════════════════════════════
          14 · FINAL CTA
          ══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        <Reveal blur>
          <div className="relative rounded-[28px] overflow-hidden glass-panel ring-gradient p-8 sm:p-16 text-center">
            {/* Aurora wash inside the panel */}
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-violet-600/25 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-fuchsia-600/18 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ink-900/70 border border-violet-500/30 text-[11px] font-bold tracking-wider text-violet-200">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                FOR PATIENTS, CAREGIVERS & CLINICS
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold font-display leading-[1.1] text-gradient-violet">
                Ready to understand your medical documents?
              </h2>

              <p className="text-sm sm:text-base text-violet-200/60 leading-relaxed">
                Upload a prescription, lab result, or discharge paper and see transparent confidence
                scoring with spoken guidance — in under a minute, with nothing retained.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-3">
                <motion.button
                  onClick={onOpenUpload}
                  whileHover={{ scale: 1.035, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className="btn-sheen w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white font-bold text-sm shadow-[0_8px_32px_-8px_rgba(139,92,246,0.8)] flex items-center justify-center gap-2.5 min-h-[52px]"
                >
                  <UploadCloud className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Upload Document</span>
                </motion.button>

                <motion.button
                  onClick={onNavigateToDashboard}
                  whileHover={{ scale: 1.035, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-ink-800/80 border border-violet-500/30 text-violet-100 hover:border-violet-400/60 font-bold text-sm flex items-center justify-center gap-2.5 min-h-[52px]"
                >
                  <span>Go to Clinical Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-cyan-300" />
                </motion.button>
              </div>

              <p className="text-[11px] text-violet-300/40 pt-2">
                Medora AI explains documents you already have. It does not diagnose, prescribe, or
                replace your clinician.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};
