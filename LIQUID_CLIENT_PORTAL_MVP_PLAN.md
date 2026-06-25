# Liquid Client Portal - piano MVP

## Obiettivo

Trasformare l'attuale app Liquid Moodboard in un portale unico per accompagnare ogni cliente Liquid dall'accettazione del preventivo alla pubblicazione del sito, e poi alla manutenzione.

Il portale non deve separare "lead" e "clienti". Ogni persona/azienda ha un progetto con uno stato, un link personale e una checklist di avanzamento.

L'MVP deve essere semplice: non automatizza tutto, ma centralizza il processo e rende chiaro cosa deve fare il cliente adesso.

## Contesto attuale della repo

Repo clonata in:

`/Users/matrix/Documents/liquid-moodboard`

Stack attuale:

- TanStack Start + Vite, React 19, TypeScript
- Tailwind CSS 4 + componenti shadcn/Radix
- Supabase per database e storage
- Server functions TanStack per operazioni admin e pubbliche
- Bucket Supabase `sites`

Funzionalita' gia' presenti:

- Admin su `/` con due tab:
  - board globale di riferimenti visivi
  - lista lead/clienti con link personale
- Link pubblico cliente su `/b/$slug`
- Ogni cliente puo':
  - vedere la moodboard
  - mettere like ai riferimenti
  - commentare i riferimenti
  - caricare ispirazioni proprie come immagini o link
- L'admin puo':
  - caricare immagini/link nella board
  - ordinare la board
  - creare lead con nome e azienda
  - copiare il link personale
  - vedere like/commenti
- Database attuale:
  - `leads`
  - `sites`
  - `likes`
  - `comments`
  - `lead_sites`

Limiti attuali:

- Admin non autenticato davvero; e' protetto solo per oscurita'.
- Modello ancora orientato a lead/moodboard, non a progetto cliente.
- Mancano pagamenti, brief iniziale, materiali veri, revisioni, approvazione, manutenzione.
- Mancano email, telefono, dati fattura, stato progetto, bozza sito.
- Upload cliente oggi e' legato a ispirazioni visuali, non a materiali di progetto.
- Il link cliente mostra solo moodboard e ispirazioni, non un percorso guidato.
- UI e metadata parlano ancora di "Mood Board" e fotografi.

## Direzione prodotto

Il portale deve diventare il punto unico dove Liquid gestisce:

- onboarding
- dati cliente e dati fattura
- pagamenti manuali tramite bonifico/link
- raccolta materiali
- brief iniziale
- scelta stile
- sviluppo e bozza
- revisioni
- approvazione finale
- pubblicazione
- manutenzione attiva

Il cliente non deve percepire un gestionale complesso. Deve vedere una pagina chiara, ordinata, con la prossima azione richiesta sempre evidente.

## Stati progetto

Usare questi stati come enum principale:

1. `onboarding`
2. `raccolta_materiali`
3. `scelta_stile`
4. `sviluppo_sito`
5. `revisione_bozza`
6. `approvazione_finale`
7. `pubblicazione`
8. `manutenzione_attiva`

Label UI:

- Onboarding
- Raccolta materiali
- Scelta stile
- Sviluppo sito
- Revisione bozza
- Approvazione finale
- Pubblicazione
- Manutenzione attiva

## Principio chiave dell'MVP

Un solo progetto per cliente. Un solo link personale. Una sola dashboard admin.

Non costruire:

- CRM completo
- automazioni Stripe
- messaggistica complessa
- sistema task avanzato
- ruoli multipli cliente
- preventivi o listini dentro l'app

Costruire invece:

- dati essenziali
- stati manuali
- pagamenti manuali
- upload file con note
- form brief
- moodboard con like/commenti
- richieste revisione
- approvazione finale
- richieste manutenzione

## Flusso cliente ideale

### 1. Onboarding

Il cliente entra dal link personale e vede:

- nome cliente
- azienda
- stato attuale
- prossima azione richiesta
- checklist sintetica
- box dati fattura da compilare
- box pagamento acconto con istruzioni bonifico/link pagamento

La pagina deve spiegare con microcopy molto breve cosa fare, senza diventare una landing page.

### 2. Raccolta materiali

Il cliente compila:

- brief iniziale
- dati attivita'
- servizi principali
- obiettivo sito
- pubblico ideale
- messaggio da comunicare
- CTA principale
- link social
- sito attuale
- note libere

Poi carica:

- logo
- foto
- testi
- documenti
- altri file utili

Ogni file ha:

- categoria
- nota opzionale
- data caricamento

### 3. Scelta stile

Il cliente usa la moodboard esistente evoluta:

- vede riferimenti Liquid/admin
- mette like
- commenta ogni riferimento
- sceglie una direzione visiva principale
- conferma la direzione creativa

Direzioni:

- elegante e premium
- moderno e minimale
- caldo e umano
- creativo e distintivo
- istituzionale e professionale
- semplice e diretto

Quando conferma, salvare:

- direzione scelta
- data conferma

### 4. Sviluppo e bozza

Admin inserisce link bozza sito.

Il cliente vede:

- bottone "Apri bozza"
- stato progetto
- form per inviare richieste di modifica

Ogni richiesta revisione:

- pagina
- sezione
- commento
- priorita': bassa, media, alta
- stato: aperta, in lavorazione, completata

L'admin aggiorna manualmente lo stato.

### 5. Approvazione finale

Quando l'admin porta il progetto in approvazione finale, il cliente vede:

- link alla bozza finale
- riepilogo saldo
- bottone "Approvo il sito per la pubblicazione"

Al click salvare:

- `approved_at`
- eventuale nota finale opzionale

### 6. Pubblicazione

Admin pubblica il sito e aggiorna:

- stato progetto
- link sito pubblicato
- saldo pagato/non pagato

Il cliente vede il sito pubblicato e la checklist completata.

### 7. Manutenzione

Dopo pubblicazione il portale resta attivo.

Il cliente puo' creare richieste di manutenzione:

- titolo
- descrizione
- tipo: modifica testo, cambio foto, nuova sezione, problema tecnico, altro
- file allegati opzionali
- priorita': bassa, media, alta
- stato: ricevuta, in lavorazione, completata

L'admin vede tutte le richieste e le usa come input operativo per lavorare o passarle a Cursor.

## Dashboard admin MVP

### Vista principale

Tabella o lista clienti/progetti con:

- cliente
- azienda
- email
- telefono
- stato progetto
- prossima azione
- acconto pagato
- saldo pagato
- manutenzione attiva
- numero richieste revisione aperte
- numero richieste manutenzione aperte
- link personale cliente

Azioni rapide:

- copia link cliente
- apri progetto
- cambia stato
- segna acconto pagato/non pagato
- segna saldo pagato/non pagato

### Creazione progetto

Campi:

- nome cliente
- azienda
- email
- telefono
- stato iniziale: onboarding
- note interne opzionali

Alla creazione:

- generare slug/token personale
- creare checklist standard
- creare righe pagamento standard: acconto, saldo finale, manutenzione mensile

### Dettaglio progetto admin

Sezioni:

- panoramica
- dati cliente
- dati fattura
- pagamenti
- materiali caricati
- brief iniziale
- preferenze stile
- moodboard/like/commenti
- bozza sito
- richieste revisione
- approvazione finale
- manutenzione
- note interne

## Pagamenti MVP

Non inserire listini o prezzi predefiniti nell'app.

Ogni progetto ha righe pagamento editabili:

- acconto
- saldo finale
- manutenzione mensile

Per ogni riga:

- titolo
- importo
- stato: da pagare, pagato
- metodo: bonifico, link pagamento, altro
- link pagamento opzionale
- istruzioni pagamento opzionali
- data pagamento opzionale

Spazio configurabile per dati bonifico Liquid:

- intestatario
- IBAN
- causale consigliata
- note pagamento

Nel portale cliente mostrare:

- importo
- stato
- istruzioni bonifico o link pagamento
- microcopy: "Dopo il pagamento, Liquid aggiornera' lo stato manualmente."

## Dati fattura

Durante onboarding chiedere al cliente:

- ragione sociale o nome fatturazione
- partita IVA
- codice fiscale
- indirizzo fatturazione
- CAP
- citta'
- provincia
- nazione
- codice SDI
- PEC
- email amministrativa
- note fatturazione

Questi dati sono visibili e modificabili dall'admin.

## Schema dati proposto

### `projects`

Sostituisce concettualmente `leads`, oppure si puo' migrare `leads` aggiungendo colonne.

Campi:

- `id`
- `slug`
- `client_name`
- `company_name`
- `email`
- `phone`
- `status`
- `next_action`
- `draft_url`
- `published_url`
- `creative_direction`
- `creative_direction_confirmed_at`
- `approved_at`
- `maintenance_active`
- `internal_notes`
- `created_at`
- `updated_at`

### `project_checklist_items`

Campi:

- `id`
- `project_id`
- `key`
- `label`
- `completed`
- `completed_at`
- `sort_order`

Checklist standard:

- preventivo accettato
- acconto pagato
- dati iniziali compilati
- materiali caricati
- stile scelto
- bozza ricevuta
- revisioni inviate
- sito approvato
- saldo pagato
- sito pubblicato
- manutenzione attiva

### `invoice_profiles`

Campi:

- `id`
- `project_id`
- `billing_name`
- `vat_number`
- `tax_code`
- `billing_address`
- `postal_code`
- `city`
- `province`
- `country`
- `sdi_code`
- `pec`
- `billing_email`
- `notes`
- `updated_at`

### `payments`

Campi:

- `id`
- `project_id`
- `type`: acconto, saldo, manutenzione
- `title`
- `amount`
- `status`: da_pagare, pagato
- `payment_url`
- `payment_instructions`
- `paid_at`
- `sort_order`

### `project_materials`

Campi:

- `id`
- `project_id`
- `category`: logo, foto, testi, documenti, altro
- `file_name`
- `file_url`
- `file_path`
- `file_type`
- `file_size`
- `note`
- `uploaded_by`: client, admin
- `created_at`

Storage:

- bucket privato `project-materials`
- path: `project_id/category/file`
- accesso tramite signed URL o server function

### `briefs`

Una riga per progetto.

Campi:

- `id`
- `project_id`
- `business_description`
- `main_services`
- `website_goal`
- `ideal_audience`
- `message_to_communicate`
- `main_cta`
- `social_links`
- `current_website`
- `free_notes`
- `submitted_at`
- `updated_at`

### `style_references`

Evoluzione di `sites`.

Campi:

- `id`
- `title`
- `image_url`
- `full_image_url`
- `link_url`
- `category`
- `is_liquid`
- `sort_order`
- `created_at`

### `style_feedback`

Evoluzione di `likes` e `comments`, piu' pulita per progetto.

Campi:

- `id`
- `project_id`
- `style_reference_id`
- `liked`
- `comment`
- `created_at`
- `updated_at`

### `revision_requests`

Campi:

- `id`
- `project_id`
- `page`
- `section`
- `comment`
- `priority`: bassa, media, alta
- `status`: aperta, in_lavorazione, completata
- `created_at`
- `updated_at`

### `maintenance_requests`

Campi:

- `id`
- `project_id`
- `title`
- `description`
- `request_type`: modifica_testo, cambio_foto, nuova_sezione, problema_tecnico, altro
- `priority`: bassa, media, alta
- `status`: ricevuta, in_lavorazione, completata
- `created_at`
- `updated_at`

### `request_attachments`

Campo comune per allegati su revisioni/manutenzione:

- `id`
- `revision_request_id`
- `maintenance_request_id`
- `file_name`
- `file_url`
- `file_path`
- `file_type`
- `file_size`
- `created_at`

### `portal_settings`

Per evitare valori hardcoded:

- `id`
- `bank_account_holder`
- `iban`
- `payment_notes`
- `default_public_base_url`

## Sicurezza e accessi

MVP consigliato:

- Admin con Supabase Auth e route protette.
- Cliente con link personale contenente slug non indovinabile.
- Nessun login cliente nella prima versione, se si vuole massima semplicita'.
- Token/slug lungo e random, non basato solo sul nome.
- Server functions per tutte le scritture.
- RLS da rivedere: oggi molte letture sono pubbliche; per materiali cliente e dati fattura serve accesso limitato.

Possibile step successivo:

- magic link cliente via email
- area cliente autenticata
- audit log

## Routing proposto

Se si resta su TanStack Start:

- `/admin`
- `/admin/projects`
- `/admin/projects/$projectId`
- `/p/$slug`

Se si migra a Next.js:

- `/admin`
- `/admin/projects/[id]`
- `/p/[slug]`
- route handlers/server actions per upload e mutazioni

Nota: lo stack desiderato indica Next.js, ma l'app attuale e' gia' vicina all'MVP usando TanStack Start. Per andare veloce conviene prima trasformare il dominio dentro l'app esistente. La migrazione a Next.js puo' essere fatta dopo, oppure subito se il deploy Vercel e la manutenzione futura lo richiedono.

## UI proposta

Stile:

- premium, minimale, editoriale
- bianco, nero, grigi
- tipografia serif per titoli, sans per interfaccia
- niente dashboard rumorosa
- componenti compatti e chiari

Cliente:

- top bar Liquid + nome cliente
- hero operativo, non marketing:
  - stato
  - prossima azione
  - bottone principale
- layout a sezioni:
  - Panoramica
  - Pagamenti
  - Materiali
  - Brief
  - Stile
  - Bozza e revisioni
  - Approvazione
  - Manutenzione

Admin:

- dashboard densa ma elegante
- tabella progetti
- filtri per stato
- pannello dettaglio progetto
- azioni rapide sempre visibili

## Prossima azione richiesta

Calcolare `next_action` manualmente o con logica semplice.

Esempi:

- `onboarding`: "Compila i dati iniziali e i dati per la fattura."
- `raccolta_materiali`: "Carica logo, foto, testi e materiali utili."
- `scelta_stile`: "Scegli i riferimenti che ti piacciono e conferma la direzione creativa."
- `sviluppo_sito`: "Liquid sta lavorando alla prima bozza. Non serve fare nulla ora."
- `revisione_bozza`: "Apri la bozza e invia le richieste di modifica."
- `approvazione_finale`: "Controlla la versione finale e approva la pubblicazione."
- `pubblicazione`: "Liquid pubblichera' il sito dopo approvazione e saldo."
- `manutenzione_attiva`: "Invia qui le richieste di aggiornamento del sito."

## Roadmap implementativa

### Fase 0 - Decisione tecnica

Scegliere tra:

1. Restare su TanStack Start per MVP veloce.
2. Migrare subito a Next.js per allinearsi allo stack desiderato.

Raccomandazione: restare su TanStack Start per il primo MVP, perche' la repo ha gia' routing, server functions, Supabase, UI e moodboard funzionanti.

### Fase 1 - Rinominare dominio prodotto

Obiettivo: passare da lead/moodboard a project/client portal senza rompere tutto.

Task:

- Aggiornare copy e metadata da "Mood Board" a "Liquid Client Portal".
- Rinominare UI "Lead" in "Clienti" o "Progetti".
- Aggiungere campi a `leads` o creare `projects`.
- Introdurre stati progetto.
- Aggiungere email, telefono, stato, next_action, draft_url, published_url.
- Cambiare link cliente da `/b/$slug` a `/p/$slug` mantenendo redirect compatibile da `/b/$slug`.

### Fase 2 - Dashboard admin MVP

Task:

- Creare lista progetti con stato e azioni rapide.
- Creare form nuovo progetto.
- Copiare link personale.
- Aggiornare stato manualmente.
- Segnare acconto/saldo pagati.
- Inserire link bozza sito.
- Vedere contatori: materiali, revisioni aperte, manutenzioni aperte.

### Fase 3 - Portale cliente base

Task:

- Creare pagina `/p/$slug`.
- Sezione panoramica progetto.
- Stato attuale e prossima azione.
- Checklist percorso.
- Layout sezioni semplice.
- Progress indicator lineare.

### Fase 4 - Pagamenti e dati fattura

Task:

- Tabella `payments`.
- Tabella `invoice_profiles`.
- Admin modifica importi, stato, link pagamento e istruzioni.
- Cliente vede pagamenti.
- Cliente compila dati fattura.
- Admin vede dati fattura.
- Aggiungere impostazioni IBAN Liquid in `portal_settings`.

### Fase 5 - Brief e materiali

Task:

- Form brief iniziale.
- Salvataggio draft o submit semplice.
- Upload materiali con categoria e nota.
- Admin vede e scarica materiali.
- Storage separato per materiali progetto.

### Fase 6 - Scelta stile

Task:

- Riutilizzare board attuale come sezione "Scelta stile".
- Migrare `sites` a `style_references` o mantenere `sites` con naming UI aggiornato.
- Like/commenti per progetto.
- Direzione creativa principale.
- Bottone "Conferma direzione creativa".

### Fase 7 - Bozza, revisioni, approvazione

Task:

- Admin inserisce draft URL.
- Cliente apre bozza.
- Cliente crea richieste revisione.
- Admin aggiorna stato richieste.
- Cliente approva pubblicazione.
- Salvare `approved_at`.

### Fase 8 - Manutenzione

Task:

- Dopo stato pubblicato/manutenzione, mostrare sezione manutenzione.
- Cliente crea richieste.
- Upload allegati opzionali.
- Admin vede lista richieste manutenzione.
- Admin aggiorna stato.

### Fase 9 - Hardening

Task:

- Supabase Auth admin.
- RLS corretta.
- Slug/token cliente non indovinabile.
- Validazioni Zod per tutti i form.
- Toast e stati loading/error.
- Test manuale end-to-end.
- Pulizia naming vecchio "lead".

## MVP accettabile

L'MVP e' pronto quando:

- Admin crea un progetto cliente.
- Admin copia link personale.
- Cliente apre link e vede dashboard guidata.
- Cliente compila brief e dati fattura.
- Cliente vede pagamenti e istruzioni bonifico/link pagamento.
- Cliente carica materiali con note.
- Cliente sceglie stile, commenta riferimenti e conferma direzione creativa.
- Admin vede tutto.
- Admin aggiorna stato progetto.
- Admin inserisce link bozza.
- Cliente invia richieste revisione.
- Admin cambia stato richieste.
- Cliente approva pubblicazione.
- Dopo pubblicazione, cliente invia richieste manutenzione.
- Admin vede e gestisce richieste manutenzione.

## Fuori scope MVP

- Pagamenti Stripe automatici.
- Fatturazione automatica.
- Notifiche email automatiche.
- Chat in tempo reale.
- Multi-admin.
- Login cliente obbligatorio.
- Gestione contratti/preventivi.
- Board kanban complessa.
- Integrazione automatica con Cursor.

## Note dal processo Liquid

Dal processo Liquid in Notion emerge questo flusso operativo:

- direzione creativa condivisa
- acconto prima dell'avvio
- materiali cliente entro una finestra chiara
- prima bozza come base concreta
- revisione principale
- revisione finale
- pubblicazione dopo approvazione e saldo
- manutenzione opzionale o modifiche future

Nel portale questo va tradotto in checklist e stati, non in una pagina commerciale.

## Prima implementazione consigliata

Partire da una migrazione minima:

1. Aggiungere colonne progetto alla tabella `leads`, rinominandola solo a livello UI in "progetti".
2. Creare tabelle nuove per pagamenti, dati fattura, brief, materiali, revisioni, manutenzione.
3. Tenere `sites`, `likes`, `comments`, `lead_sites` per la sezione stile, adattando i nomi nel codice.
4. Creare la nuova pagina cliente guidata.
5. Rifare la dashboard admin sopra gli stessi dati.

Questa strada evita una riscrittura totale e permette di consegnare rapidamente il portale all-in-one.
