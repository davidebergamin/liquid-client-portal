import type { JourneyStep } from "./types";

export const statusOrder = [
  "onboarding",
  "scelta_stile",
  "raccolta_materiali",
  "sviluppo_sito",
  "revisione_bozza",
  "approvazione_finale",
  "pubblicazione",
  "manutenzione_attiva",
] as const;

export const portalSteps: JourneyStep[] = [
  {
    key: "onboarding",
    label: "Partenza",
    title: "Partiamo — due minuti e si comincia",
    summary: "Acconto e dati fattura. Poi si passa alla parte creativa.",
    accent: "coral",
  },
  {
    key: "scelta_stile",
    label: "Stile",
    title: "Ora viene il bello: scegliamo lo stile",
    summary: "Like e ispirazioni visive — così capiamo il tuo gusto.",
    accent: "mint",
  },
  {
    key: "raccolta_materiali",
    label: "Materiali",
    title: "Carica logo, testi e foto",
    summary: "Più ci dai ora, più velocemente arriviamo alla bozza.",
    accent: "lemon",
  },
  {
    key: "sviluppo_sito",
    label: "Sviluppo",
    title: "Stiamo costruendo il tuo sito",
    summary: "Il team è al lavoro. Ti avvisiamo appena c'è qualcosa da vedere.",
    accent: "indigo",
  },
  {
    key: "revisione_bozza",
    label: "Revisione",
    title: "Eccola — la tua bozza è pronta",
    summary: "Guardala, lascia feedback — è il momento di rifinire i dettagli.",
    accent: "coral",
  },
  {
    key: "approvazione_finale",
    label: "Approvazione",
    title: "Ultimo controllo, poi si va online",
    summary: "Controlla tutto una volta ancora, poi si pubblica.",
    accent: "gradient",
  },
  {
    key: "pubblicazione",
    label: "Online",
    title: "Ultimi passi prima di andare online",
    summary: "Saldo e manutenzione — poi pubblichiamo il sito.",
    accent: "gradient",
  },
  {
    key: "manutenzione_attiva",
    label: "Aggiornamenti",
    title: "Il sito è online — chiedi aggiornamenti quando vuoi",
    summary: "Testo, immagini, nuove sezioni: invia richieste chiare e tracciabili.",
    accent: "mint",
  },
];
