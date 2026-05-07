## Cosa costruiamo

Una web app pubblica, in stile Liquid (minimal, premium, tipografia grande), dove tu carichi screenshot di siti di riferimento e i tuoi clienti fotografi navigano una board Pinterest-style, mettono like e lasciano commenti per dirti quali stili preferiscono.

## Struttura

**Home / Board pubblica** (`/`)
- Header minimale: logo "LIQUID" a sinistra, navigazione essenziale a destra
- Titolo editoriale tipo: "Scegli il tuo stile" + sottotitolo breve
- Griglia masonry fluida (2 colonne mobile, 3 tablet, 4 desktop)
- Ogni card mostra l'immagine intera, mai croppata, con aspect-ratio originale
- Su ogni card: contatore like + contatore commenti, hover discreto
- Click sulla card → apre il dettaglio

**Dettaglio immagine** (modal o `/site/$id`)
- Immagine grande centrata, mai tagliata
- Pulsante like (cuore, toggle)
- Form commento: nome + testo, lista commenti sotto
- Eventuale titolo/nota del sito (es. "Ceremony", "D&M")

**Admin** (`/admin`, protetto da password semplice salvata come secret)
- Upload di una o più immagini (drag & drop)
- Campo titolo opzionale per ogni immagine
- Lista immagini caricate con possibilità di eliminare
- Vista like/commenti aggregati per capire le preferenze

## Dati (Lovable Cloud)

Tabelle:
- `sites`: id, title, image_url, created_at
- `likes`: id, site_id, visitor_id (uuid in localStorage), created_at — unique (site_id, visitor_id) per evitare doppi like
- `comments`: id, site_id, author_name, body, created_at

Storage bucket pubblico per le immagini.

RLS: lettura pubblica su tutte le tabelle; insert pubblico su `likes` e `comments` (con validazione lunghezza); insert/delete su `sites` e storage solo via server function admin protetta da password.

## Design

- Palette: bianco sporco `#fcfbf8` (background), nero profondo per testi, grigio per metadata
- Tipografia: serif/sans display molto grande per i titoli (stile Liquid), sans neutra per il body
- Spaziatura ampia, bordi sottili, niente ombre pesanti
- Accenti di colore solo su like attivo (rosso tenue) e CTA admin
- Animazioni sottili: fade-in card al caricamento, micro-scale all'hover

## Tecnico

- TanStack Start + Lovable Cloud
- Masonry implementato con CSS columns (semplice, performante, mantiene aspect-ratio nativo)
- Identificazione visitor anonima via uuid in localStorage (così un like non si duplica)
- Upload via server function admin con `supabaseAdmin` su Storage
- Validazione Zod su commenti (max 500 char) e nome (max 60)

## Fuori scope (per ora)

- Account clienti / board personalizzate per cliente
- Tag/categorie
- Export PDF dei preferiti

Posso aggiungerli dopo se servono.