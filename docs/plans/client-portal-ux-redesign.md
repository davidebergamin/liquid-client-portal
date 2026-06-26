# Piano: redesign UX/UI area cliente

> Obiettivo: trasformare `/p/[slug]` in una **web app moderna, minimalista e premium (2026)** — calda nel tono ma **visivamente all’avanguardia**, che trasmetta innovazione e il fatto che tra poco avranno un sito pronto. Deve sembrare un prodotto di design studio, non un gestionale mid o un template shadcn generico.

---

## Stato attuale (diagnosi)

### Cosa c’è già
- Welcome screen con CTA **“Iniziamo”** (`ClientWelcomeScreen.tsx`) — funziona, ma visivamente debole
- Token colore brand (`--liquid-coral`, `--liquid-mint`, ecc.) in `styles.css` — usati poco
- Architettura modulare sotto `src/components/client-portal/` — buona base, ma layout e progresso frammentati

### Problemi principali

| Problema | Dove | Effetto percepito |
|----------|------|-------------------|
| Colonna stretta `max-w-3xl` | `ClientPortalExperience`, `ClientPortalJourney` | Step visibili solo su metà schermo, sensazione “admin panel” |
| Progresso/journey in 3 posti | Header bar %, breadcrumb pills, sheet “Il tuo percorso” | Ridondante, freddo, ruba spazio verticale |
| Hero card separata + step sotto | `ClientPortalHero` + `*Step.tsx` | Due blocchi stacked = metà viewport sprecata prima del contenuto utile |
| Copy centralizzato al ~40% | `copy.ts` vs stringhe inline negli step | Tono inconsistente, molto “procedurale” |
| Header sempre visibile | `ClientPortalHeader` anche in welcome | Rompe l’immersione del primo impatto |
| Superfici bianche/grigie | `PortalStepCard` variant `action`, header `bg-background/90` | Sembra gestionale, non “stiamo costruendo il tuo sito” |

### Flusso attuale

```
/p/[slug]
  └─ ClientPortalExperience
       ├─ ClientPortalHeader (progress % + sheet)
       ├─ [se nuovo cliente] ClientWelcomeScreen
       └─ [altrimenti] ClientPortalJourney
            ├─ Breadcrumb pills (step completati)
            ├─ ClientPortalHero (titolo grande)
            └─ Step attivo (Onboarding, Style, …)
```

---

## Visione target

```
/p/[slug]
  └─ ClientPortalExperience
       ├─ [Welcome] Schermata full-viewport, header minimale o assente
       │    → Gratitudine + overview 3 step + CTA colorato “Iniziamo”
       └─ [Journey] Layout full-width, step a tutta pagina
            ├─ Header leggero (solo brand + prenota call)
            └─ Step attivo
                 ├─ Progress inline compatto (dentro lo step, non sopra)
                 ├─ Hero integrato nello step (non card separata gigante)
                 └─ Contenuto action (form, upload, like, …)
```

**Principi guida:**
1. **Modern first, minimal always** — pochi elementi, molto respiro, una gerarchia chiara per schermata
2. **Un solo posto per il progresso** — compatto, dentro lo step, non una sezione dedicata
3. **Full width per i contenuti** — niente colonna stretta che taglia tutto a metà
4. **Colore con intenzione** — accent per step, non arcobaleno; un colore dominante + neutri premium
5. **Copy caldo e concreto** — meno “completare i dati”, più “facciamo partire il tuo sito”
6. **Wow progressivo** — welcome emozionale → step operativi puliti e fluidi

---

## Design language 2026 — moderno, minimal, innovativo

> Riferimento qualitativo: Linear, Raycast, Vercel Dashboard, Arc Browser onboarding, Stripe Checkout — non Trello, non Notion template, non “startup 2019 con gradient ovunque”.

### North star

Il cliente deve pensare: *“Questo non sembra un portale clienti — sembra un prodotto tech di qualità.”*

Minimalismo ≠ povertà visiva. Significa **riduzione intelligente**: ogni pixel ha un motivo. Il calore arriva dal copy, da un accent ben scelto e da micro-interazioni fluide — non da card colorate ovunque.

### Cosa rende un’interfaccia “vecchia” o mid (da evitare)

| Segnale “mid” | Presente oggi | Fix 2026 |
|---------------|---------------|----------|
| Look shadcn default | `border`, `bg-background`, `shadow-sm` ovunque | Superfici layered, bordi hairline o nessun bordo |
| Progress bar con % | Header `liquid-progress-bar` + % mono | Timeline sottile o contatore tipografico (“02 · Stile”) |
| Breadcrumb pills | `ClientPortalJourney` righe 40–54 | Progress inline integrato nel titolo |
| Card dentro card dentro card | Hero card + action card + form box | Un solo contenitore per sezione, separatori soft |
| Gradient coral→indigo su tutto | CTA + progress + accent line | **Un** gradient signature (CTA o welcome), resto neutro |
| Inter ovunque uguale | Body + UI tutto 14px grigio | Scala tipografica editoriale: display grande, UI compatta |
| Border radius inconsistente | mix `rounded-xl`, `rounded-2xl`, `0.65rem` | Sistema radius: `2xl` surface, `full` pill, `lg` input |
| Animazioni generiche | `animate-in fade-in` only | Transizioni spring, stagger, view transitions |
| Layout “form admin” | Input stack, label sopra, box grigi | Form airy, label floating o inline, stati eleganti |
| Troppi bottoni outline | “Il tuo percorso”, “Prenota call”, CTA | Gerarchia: 1 primary, 1 ghost, resto icon-only |

### Pillars del design 2026 per Liquid Portal

#### 1. Tipografia editoriale
- **Display:** Instrument Serif — titoli grandi, tracking tight, pochi titoli per pagina
- **UI:** Inter (o valutare **Geist** / **Satoshi** se si vuole distacco da “Inter product”) — peso 450–500 per body, 600 solo per label attive
- **Mono:** JetBrains Mono — solo per dati (IBAN, step counter), mai per UI generica
- **Scala:** titolo pagina `text-4xl→6xl`, body `text-base`, meta `text-sm` con opacity non grigio flat
- **Regola:** max 2 font-weight visibili per schermata

#### 2. Spazio e layout
- Padding generoso: `px-6 md:px-12 lg:px-16`, verticale `py-10 md:py-16`
- Max-width contenuto: `max-w-6xl` o full-bleed con gutter ampi — mai `max-w-3xl`
- **Regola 60/40:** 60% contenuto, 40% respiro bianco/tint
- Griglie moderne: bento asymmetrico per welcome cards; masonry o 2-col per style refs
- Sticky elements: solo CTA primaria e header — niente barre sticky multiple

#### 3. Superfici e profondità
- Sfondo pagina: off-white caldo `oklch(0.995 0.003 80)` o mesh gradient **molto** subtle (2–3% opacity)
- Surface cards: `backdrop-blur-xl` + `bg-white/70` **solo** su header e modali — non su ogni box
- Ombre: soft ambient `0 24px 80px oklch(0.2 0.02 260 / 6%)` — mai drop shadow dura
- Bordi: `border-black/[0.06]` o nessuno + separatore `bg-border/50` 1px
- **Grain/noise overlay** opzionale (CSS `feTurbulence` o PNG 2% opacity) — touch premium 2026

#### 4. Colore — intenzionale, non decorativo
- Neutri dominanti (90% UI) + **1 accent per step** (10%)
- Accent step: solo su badge step, focus ring, CTA secondaria, glow sottile sfondo — non su ogni card
- Palette Liquid in OKLCH (già presente) — aumentare chroma leggermente su accent attivo
- Stati: success = verde soft moderno; pending = amber muted; error = rosso desaturato
- **No:** emoji come decorazione UI, badge colorati ovunque, gradient text

#### 5. Motion e micro-interazioni
- Page enter: fade + translate Y 8px, 400ms ease-out
- Step change: crossfade contenuto, progress indicator slide
- Hover: scale `1.01` su card cliccabili, `150ms`
- CTA: subtle glow pulse on idle (CSS `@keyframes`, non loop aggressivo)
- Upload: drag state con border animato (dash offset)
- Preferire **CSS + View Transitions API** (`document.startViewTransition`) — valutare `motion` solo se serve spring complessa
- **Rispettare** `prefers-reduced-motion`

#### 6. Componenti signature Liquid (identità unica)
- **Liquid Orb** — blob gradient animato molto lento sul welcome (CSS `@property` o SVG) — firma visiva
- **Step rail** — linea verticale/orizzontale sottile con dot attivo luminoso, non breadcrumb testuale
- **Portal surface** — componente base unico al posto di `PortalStepCard` generico
- **Primary CTA** — pill full-rounded, gradient signature, shadow colorata soft

### Moodboard testuale per schermata

```
WELCOME (full viewport)
────────────────────────────────────────
     [logo mono minimal]

     Ciao, Mario.                    ← serif 6xl, nero soft
     Siamo contentissimi…            ← sans lg, opacity 70%

     ┌─────────┐ ┌─────────┐ ┌─────────┐
     │  icon   │ │  icon   │ │  icon   │   ← bento, no heavy border
     │  title  │ │  title  │ │  title  │
     └─────────┘ └─────────┘ └─────────┘

          [ Iniziamo → ]              ← gradient pill, glow

     sfondo: mesh gradient + grain 2%
────────────────────────────────────────

STEP (es. Stile)
────────────────────────────────────────
 LIQUID · Mario          [call icon]

 02 ──── Stile                          ← step rail inline
 Diamo forma al tuo sito                 ← serif 4xl
 Like ai riferimenti che ti ispirano.    ← 1 riga, sans

 ┌──────────┐ ┌──────────┐ ┌──────────┐
 │  ref 1   │ │  ref 2   │ │  ref 3   │   ← masonry, hover lift
 └──────────┘ └──────────┘ └──────────┘

                    [ sticky CTA pill ]
────────────────────────────────────────
```

### Design tokens da aggiungere (`styles.css`)

```css
/* Nuovi token portal 2026 */
--portal-bg: oklch(0.995 0.003 80);
--portal-surface: oklch(1 0 0 / 0.72);
--portal-border: oklch(0 0 0 / 0.06);
--portal-shadow: 0 24px 80px oklch(0.2 0.02 260 / 0.06);
--portal-radius-surface: 1.25rem;
--portal-radius-pill: 9999px;
--portal-motion: cubic-bezier(0.22, 1, 0.36, 1);
--portal-blur: 24px;
```

### Checklist “passa il test 2026”

Prima di considerare uno step finito, verificare:

- [ ] Una sola azione primaria evidente
- [ ] Titolo display che “respira” (padding sopra generoso)
- [ ] Nessun bordo grigio spesso visibile
- [ ] Nessuna barra progress % visibile
- [ ] Almeno un dettaglio motion (enter, hover, o state change)
- [ ] Su mobile sembra nativo, non “sito compresso”
- [ ] Screenshot side-by-side con un gestionale random: differenza immediata e netta

---

## Fase 0 — Preparazione (prima di toccare UI)

### Step 0.1 — Audit copy completo
- [ ] Elencare tutte le stringhe visibili al cliente (grep su `client-portal/` + `ClientJourneySheet.tsx`)
- [ ] Segnare cosa va in `copy.ts` vs cosa resta locale allo step
- [ ] Definire **tone of voice** in 3 regole (es. “tu”, entusiasta, concreto, mai burocratico)

### Step 0.2 — Design system portal (prima dei wireframe)
- [ ] Definire token CSS portal 2026 in `styles.css` (vedi sezione Design language)
- [ ] Creare `client-portal/design/tokens.ts` — mapping accent step → classi CSS
- [ ] Scegliere: tenere Inter o introdurre font UI alternativo (Geist consigliato per look 2026)
- [ ] Mockup 2 schermate in Figma/Excalidraw: Welcome + Style step — validare “non sembra mid”

### Step 0.3 — Wireframe rapido
- [ ] Welcome full-screen con mesh + bento cards
- [ ] Uno step full-width con step rail inline (non breadcrumb)
- [ ] Mobile: progress compatto + sticky CTA pill

### Step 0.4 — Branch di lavoro
- [ ] Lavorare su branch dedicato (es. `feat/client-portal-ux-redesign`)
- [ ] Testare con slug reale in dev (`/p/[slug]`)

---

## Fase 1 — Layout e architettura componenti

> **Priorità alta** — risolve il problema “metà schermo” e la sezione progresso separata.

### Step 1.1 — Nuovo layout shell

**File:** `ClientPortalExperience.tsx`, nuovo `ClientPortalShell.tsx`

- [ ] Creare wrapper `ClientPortalShell` con due modalità:
  - `mode="welcome"` → niente header completo, sfondo più ricco
  - `mode="journey"` → header minimale
- [ ] Rimuovere `max-w-3xl` dal journey → usare `max-w-5xl` o `max-w-6xl` (allineato all’header) oppure full width con padding generoso
- [ ] Welcome: `min-h-screen` senza sottrarre altezza header (header nascosto o trasparente)

```tsx
// Target concettuale
<main className={cn("min-h-screen", stepAccentBg)}>
  {!showWelcome && <ClientPortalHeader variant="minimal" />}
  {showWelcome ? <WelcomeFlow /> : <JourneyFlow />}
</main>
```

### Step 1.2 — Eliminare breadcrumb esterno

**File:** `ClientPortalJourney.tsx` (righe 40–54)

- [ ] **Rimuovere** il blocco breadcrumb pills sopra l’hero
- [ ] Non sostituirlo 1:1 in alto — il progresso va *dentro* lo step

### Step 1.3 — Nuovo componente `StepProgressInline` (step rail 2026)

**File:** nuovo `journey/StepProgressInline.tsx`

Indicatore **tipografico + rail**, non breadcrumb pills:

```
02 ──── Stile                    [dettagli ↗]
```

- [ ] Formato: contatore mono `02` + label step + linea sottile (rail) — no pill colorate a catena
- [ ] Mobile: `02 / 08 · Stile` — una riga, tap apre sheet
- [ ] Animazione: rail fill slide al cambio step (`view-transition` o CSS width transition)
- [ ] **Non** mostrare percentuale checklist

### Step 1.4 — Hero integrato (editorial, non card)

**File:** `ClientPortalHero.tsx` → rinominare/refactor in `StepHeader.tsx`

- [ ] **Niente card wrapper** — titolo serif direttamente sulla pagina, summary sotto in sans muted
- [ ] Step rail sopra il titolo (parte di `StepProgressInline`)
- [ ] Spacing: `mb-12 md:mb-16` tra header e contenuto
- [ ] Unificare hero duplicati (`WaitingStep`, `DeliveryStep`, `MaintenanceStep`) su `StepLayout`

### Step 1.5 — Header glass minimal

**File:** `ClientPortalHeader.tsx`

- [ ] Stile: `fixed top-0`, `backdrop-blur-xl`, `bg-[var(--portal-surface)]`, bordo bottom hairline
- [ ] Contenuto: logo mono + nome cliente (truncate) + icon call (ghost) — **niente testo “Prenota call”** su desktop stretto
- [ ] Rimuovere progress bar % e bottone “Il tuo percorso” dall’header
- [ ] Welcome: header assente o solo logo centrato fade-in

### Step 1.6 — Riorganizzare albero componenti

**Target structure:**

```
client-portal/
├── ClientPortalExperience.tsx      # orchestrator
├── ClientPortalShell.tsx           # layout + mode welcome/journey
├── ClientPortalHeader.tsx          # minimal header
├── welcome/
│   └── ClientWelcomeScreen.tsx     # full-screen welcome
├── journey/
│   ├── ClientPortalJourney.tsx     # routing step
│   ├── StepLayout.tsx              # wrapper: progress + hero slim + children
│   └── StepProgressInline.tsx
├── steps/                          # solo contenuto action
└── shared/                         # card, button, upload, …
```

- [ ] Creare `StepLayout.tsx` usato da tutti gli step via `ClientPortalJourney`
- [ ] Spostare `ClientJourneySheet.tsx` in `client-portal/journey/` (co-location)

---

## Fase 2 — Welcome screen (signature moment)

> Primo impatto: deve sembrare un prodotto 2026, non una landing generica.

### Step 2.1 — Redesign visivo welcome

**File:** `ClientWelcomeScreen.tsx`, `styles.css`

- [ ] Full viewport, header assente
- [ ] Sfondo: mesh gradient animato lento (coral/mint/indigo a 3–5% opacity) + grain overlay
- [ ] **Liquid Orb** opzionale — blob CSS/SVG in angolo, blur 80px, animazione 20s loop
- [ ] Titolo serif enorme (`text-5xl sm:text-7xl`), tracking `-0.02em`
- [ ] 3 card overview in **bento grid** asimmetrico — no border spesso, hover lift + shadow ambient
- [ ] Icone lineari minimal (Lucide stroke 1.5) al posto dei numeri in cerchio
- [ ] CTA “Iniziamo”: pill full-rounded, gradient signature, glow soft, freccia animata on hover
- [ ] Entry animation: stagger children (title → subtitle → cards → CTA), 600ms total

### Step 2.2 — Copy welcome (nuovo tono)

**File:** `copy.ts` → sezione `welcome`

| Attuale | Proposta direzione |
|---------|-------------------|
| “Siamo felici che tu sia qui.” | “Siamo contentissimi che hai scelto Liquid.” |
| “Da oggi costruiamo il tuo sito insieme…” | “Da qui partiamo davvero: tra poco avrai un sito su misura, e questo link è la tua cabina di pilotaggio.” |
| Card “Partiamo” | “Due minuti di partenza” — acconto e fattura, poi si entra nel vivo |
| Footnote “~5 min” | “Il primo passo richiede pochi minuti — poi ci pensiamo noi.” |

- [ ] Riscrivere tutte le stringhe `welcome.*`
- [ ] Aggiungere micro-copy sotto il CTA che riduce ansia (“Niente di complicato, ti guidiamo passo passo”)

### Step 2.3 — Transizione welcome → journey

- [ ] View Transition API o crossfade full-page (400ms, easing portal)
- [ ] Welcome exit: opacity 0 + scale 0.98; journey enter: opacity 1 + translateY 0
- [ ] Verificare zero flash bianco su refresh post-`markPortalWelcomeSeen`

---

## Fase 3 — Design system visivo 2026

> Non “più colore ovunque” — superfici premium, accent chirurgici, motion fluida.

### Step 3.1 — Token e superfici base

**File:** `styles.css`, nuovo `client-portal/design/tokens.ts`

- [ ] Implementare token `--portal-*` (bg, surface, border, shadow, motion)
- [ ] Sostituire `liquid-warm-bg` con `--portal-bg` + mesh opzionale per step
- [ ] Nuovo componente `PortalSurface` — surface base con blur/border/shadow coerenti
- [ ] Deprecare gradient su ogni card; accent step = glow 4% sul bg pagina + rail colorato

### Step 3.2 — Refactor `PortalStepCard` → `PortalSurface`

**File:** `PortalStepCard.tsx` → refactor

- [ ] Variant `flat` — nessun bordo, solo padding (form sections)
- [ ] Variant `elevated` — shadow ambient, radius `1.25rem` (card interattive)
- [ ] Variant `inset` — bg nero 3% (code blocks, IBAN)
- [ ] Rimuovere variant `hero` — sostituito da `StepHeader`
- [ ] Accent: solo left-border 2px o top glow, non gradient fill intero

### Step 3.3 — CTA e input moderni

**File:** `PortalPrimaryButton.tsx`, input shadcn overrides

- [ ] CTA primary: pill, gradient **solo qui**, shadow colorata `oklch(coral / 25%)`
- [ ] CTA secondary: ghost con border hairline, no fill
- [ ] Input: altezza 48px, radius lg, focus ring accent step (non blu default shadcn)
- [ ] Stati success: check animato + copy breve, no box verde pesante

### Step 3.4 — Motion layer

**File:** nuovo `client-portal/design/motion.ts` + CSS

- [ ] Utility classi: `portal-enter`, `portal-stagger-*`, `portal-hover-lift`
- [ ] View Transitions su cambio step (se supportato, fallback CSS)
- [ ] `prefers-reduced-motion`: disabilitare orb, stagger, scale

---

## Fase 4 — Copy per ogni step

> Centralizzare in `copy.ts` e riscrivere con tono entusiasta.

### Step 4.1 — Metadati step

**File:** `constants.ts` — titoli e summary di ogni fase

| Step | Titolo attuale | Direzione copy |
|------|----------------|----------------|
| onboarding | “Facciamo partire il progetto” | “Partiamo — due minuti e si comincia sul serio” |
| scelta_stile | “Diamo forma al tuo sito” | “Ora viene il bello: scegliamo lo stile” |
| raccolta_materiali | “Raccogliamo tutto il necessario” | “Carica logo, testi e foto — più ci dai, più il sito sarà tuo” |
| sviluppo_sito | “Stiamo costruendo il tuo sito” | “Stiamo costruendo il tuo sito — a breve avrai qualcosa da vedere” |
| revisione_bozza | “La tua bozza è pronta” | “Eccola! La tua bozza è pronta — guardala e dicci cosa ne pensi” |
| approvazione_finale | “Ultimo sì prima di andare online” | “Ultimo controllo, poi si va online” |
| pubblicazione | “Ci siamo quasi — ultimi passi” | “Ci siamo! Ultimi passi e il sito è tuo” |

### Step 4.2 — Copy operativi per step

- [ ] `onboarding.*` — meno “coordinate bancarie”, più “facciamo l’acconto e si parte”
- [ ] `style.*` — enfatizzare che non c’è risposta giusta/sbagliata
- [ ] `waiting.*` — tono rassicurante + anticipazione (“tra poco vedrai la bozza”)
- [ ] `RevisionStep`, `ApprovalStep` — spostare stringhe inline in `copy.ts`
- [ ] `MaintenanceStep` — semplificare, meno wall of text
- [ ] `toasts.*` — più umani (“Perfetto, ricevuto!” vs “Ricevuto!”)

### Step 4.3 — ClientJourneySheet copy

**File:** `ClientJourneySheet.tsx` → spostare stringhe in `copy.ts`

- [ ] Titolo: “Il tuo percorso” → “Dove siamo” o “Riassunto progetto”
- [ ] Descrizione più calda, meno elenco burocratico

---

## Fase 5 — Step-by-step UI polish (modern minimal)

### Step 5.1 — OnboardingStep
- [ ] Layout a sezione flat (no card nest) — acconto, poi invoice, separati da divider hairline
- [ ] IBAN in `PortalSurface variant="inset"` monospace, copy button icon-only
- [ ] Stato “bonifico segnalato”: inline success con check animato, non box verde pieno

### Step 5.2 — StyleStep
- [ ] Masonry full-width (già in CSS) — card ref con hover lift, border solo on hover
- [ ] Like: micro-animation heart scale (CSS), non badge rosso pesante
- [ ] Sticky CTA: pill centrata, blur backdrop, shadow ambient — non barra grigia full-width

### Step 5.3 — MaterialsStep
- [ ] Drop zone grande, dashed border animato on drag, icon upload minimal
- [ ] Brief: textarea airy (min-height 120px), autosave indicator tipografico “Salvato” fade

### Step 5.4 — WaitingStep
- [ ] Empty state premium: orb pulse lento + copy rassicurante — no spinner generico
- [ ] Opzionale: progress indeterminato sottile sotto il titolo (non barra %)

### Step 5.5 — RevisionStep / ApprovalStep
- [ ] Preview link: card elevated grande con screenshot/thumbnail se disponibile
- [ ] Feedback: textarea + invio pill — form minimale, zero box nested

### Step 5.6 — DeliveryStep / MaintenanceStep
- [ ] Unificare su `StepLayout`
- [ ] Stripe embed in surface elevated pulita — copy umano, non legalese

---

## Fase 6 — Mobile e accessibilità

- [ ] Progress inline: versione compatta su mobile (“Step 2 di 8 · Stile”)
- [ ] Sticky CTA non copre contenuto (`pb-32` → calibrare)
- [ ] Touch target minimo 44px su bottoni
- [ ] Contrasto colori accent su sfondi tintati (WCAG AA)
- [ ] Test su iPhone Safari + Android Chrome

---

## Fase 7 — QA e rollout

### Checklist funzionale
- [ ] Nuovo cliente → vede welcome → “Iniziamo” → onboarding
- [ ] Cliente esistente (backfill `portal_welcome_seen_at`) → salta welcome
- [ ] Cliente con progress onboarding → salta welcome
- [ ] Tutti gli 8 status navigabili (con dati test admin)
- [ ] Sheet “Il tuo percorso” ancora accessibile ma non invadente
- [ ] WhatsApp widget non copre CTA sticky

### Checklist visiva (test 2026)
- [ ] Nessuna sezione progresso dedicata sopra lo step
- [ ] Contenuto step full-width, visibile senza scroll eccessivo su laptop 13”
- [ ] Screenshot vs gestionale generico: differenza netta e immediata
- [ ] Zero barre progress % visibili
- [ ] Una sola azione primaria per schermata
- [ ] Motion presente ma non invasiva
- [ ] Copy in italiano, tono uniforme, zero typos

---

## Ordine di implementazione consigliato

```
0. Fase 0.2 — Design tokens + mockup 2 schermate           ← allineamento estetico
1. Fase 1 (layout + step rail + header glass)              ← impatto strutturale
2. Fase 3 (design system 2026: PortalSurface, motion)    ← look moderno
3. Fase 2 (welcome signature)                              ← primo impatto
4. Fase 4 (copy)                                           ← in parallelo
5. Fase 5 (polish per step)                                ← iterativo
6. Fase 6–7 (mobile + QA + test 2026)
```

**MVP in 1 sessione:** Fase 0.2 token + Fase 1 + Fase 3.1–3.3 + welcome base (Fase 2.1 slim).

---

## File toccati (riepilogo)

| File | Azione |
|------|--------|
| `ClientPortalExperience.tsx` | Shell welcome/journey, nascondere header |
| `ClientPortalJourney.tsx` | Rimuovere breadcrumb, usare StepLayout |
| `ClientPortalHeader.tsx` | Minimal, no progress bar |
| `ClientPortalHero.tsx` | Slim / merge in StepLayout |
| `ClientWelcomeScreen.tsx` | Redesign full-screen |
| `ClientJourneySheet.tsx` | Spostare, rendere secondario |
| `copy.ts` | Riscrittura completa |
| `constants.ts` | Titoli/summary step |
| `styles.css` | Token `--portal-*`, mesh, grain, motion utilities |
| `PortalStepCard.tsx` | Refactor → `PortalSurface` (flat/elevated/inset) |
| `PortalPrimaryButton.tsx` | Pill CTA, glow, hover motion |
| **Nuovi** | `StepLayout.tsx`, `StepProgressInline.tsx`, `ClientPortalShell.tsx`, `PortalSurface.tsx`, `design/tokens.ts`, `design/motion.ts` |
| `steps/*.tsx` | Solo contenuto action, no hero duplicati |

---

## Note tecniche

- **Nessuna migration DB** richiesta per il redesign UI (salvo eventuali nuovi flag)
- **`markPortalWelcomeSeen`** già funzionante — non toccare la logica, solo UX
- **`gatedByDeposit`**: oggi cambia solo il summary hero; valutare se bloccare UI style/materials (decisione prodotto separata)
- **Admin area**: fuori scope — non modificare `/admin/*`

---

## Metriche di successo (qualitative)

1. Un cliente nuovo capisce in < 30 secondi cosa deve fare
2. Il progresso del percorso è visibile ma non domina la pagina
3. Ogni step occupa la pagina in modo naturale, full-width, non “metà schermo vuota”
4. Il tono trasmette entusiasmo e professionalità, non burocrazia
5. **Test 2026:** screenshot del portal affiancato a un gestionale qualsiasi — sembra un prodotto di categoria diversa
6. **Test innovazione:** un cliente dice “wow, che bello” aprendo il link (non solo “ok, capisco cosa fare”)
7. Tu (Liquid) guardi la pagina e pensi “questo ci rappresenta come studio — non sembra un template”
