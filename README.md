# Ruby's Sudoku 💛

**▶️ Speel hier: [ronaldsteenkamp.github.io/rubys-sudoku](https://ronaldsteenkamp.github.io/rubys-sudoku/)**

Een rustige, warme sudoku-app, speciaal gemaakt voor Ruby. Geen advertenties, geen tracking, geen account.
Alles draait in de browser en werkt na het eerste bezoek ook offline. Op de iPhone zet je hem op je beginscherm als een echte app.

Gewoon HTML, CSS en JavaScript (ES modules), zonder framework en zonder build-stap.

## Wat zit erin

- **Puzzelgenerator + solver.** Een willekeurig opgelost grid waaruit cijfers worden weggehaald zolang de oplossing uniek blijft. De moeilijkheid hangt af van welke technieken nodig zijn, niet alleen van het aantal cijfers:

  | Niveau | Nodig om op te lossen |
  |---|---|
  | ☀️ Zondagochtend | laatste vakje, enige plek, enige kandidaat |
  | ☕ Koffie erbij | + wijzende cijfers, blok-lijn, naakt paar |
  | 🤔 Even nadenken | + verborgen paar, drietallen, X-wing |
  | 🔥 Ruby-modus | + Swordfish, XY-wing, XYZ-wing |

- **Dagpuzzel.** Op elke datum dezelfde puzzel (seeded random); op zondag natuurlijk Zondagochtend. Per opgeloste dag loopt de 🔥-reeks op.
- **Slimme hints in drie stappen.** Eerst *waar* je moet kijken, dan *welke techniek* en waarom, en pas als laatste het cijfer. Een hint wijst ook foute cijfers aan, en notities waarin per ongeluk het goede cijfer is weggestreept.
- **Spelen.** Notities (met automatisch wegstrepen), markeren van rij, kolom, blok en gelijke cijfers, ongedaan maken en opnieuw, gum, reset, alle notities in één keer invullen, een verbergbare timer en pauze. Foutcontrole kan direct, op verzoek of uit. Het cijferpad toont hoeveel er van elk cijfer nog over zijn. Je speelt met touch of met het toetsenbord.
- **Persoonlijk.** Een begroeting per dagdeel met haar bijnamen en een teller van de dagen samen. Bij het oplossen dwarrelen er hartjes en pootjes en verschijnt een lief berichtje. Op het jubileum (29 september) en haar verjaardag (12 oktober) staat er een hartjespuzzel klaar. Mijlpalen ontgrendelen geheime berichtjes.
- **Thema's.** Zonnig (geel), Nacht, Gran Canaria, Lelie, Liefde, Sterren, Volleybal en Briefje, of automatisch licht/donker. Briefje is een blaadje ruitjespapier: wat Ruby zelf invult staat er in het echte handschrift van de maker (de SVG's in `hand/`), net als het logo, de hartjes en het opgelost-scherm. Daarnaast vier seizoensthema's (Lente, Zomer, Herfst, Winter) die vrijkomen als Ruby 3 puzzels oplost binnen dat seizoen, plus de keuze *Seizoen*, die vanzelf meewisselt.
- **PWA.** Een eigen icoon, werkt offline, met zachte geluidjes en trillen (beide uit te zetten).

## Projectstructuur

```
index.html            de pagina
css/style.css         alle opmaak en thema's
fonts/                Fraunces en Nunito (zelf gehost, met hun OFL-licentie)
js/solver.js          backtracking-solver met bitmaskers, uniciteitscheck
js/techniques.js      logische technieken (voor moeilijkheid én hints)
js/generator.js       generator, niveaus, dagpuzzel, hartjespuzzel
js/bank.js            voorraad lastige puzzels (gegenereerd, zie hieronder)
js/hints.js           slimme hints in drie stappen
js/game.js            spelstatus: cijfers, notities, undo/redo
js/storage.js         localStorage: instellingen, lopende puzzel, statistieken
js/messages.js        bijnamen, berichtjes, mijlpalen, speciale dagen ← hier pas je teksten aan
js/themes.js          de thema's als data, seizoenen en het ontgrendelen
js/feedback.js        geluidjes en trillen
js/worker.js          genereert puzzels in een Web Worker
js/ui.js              de interface
sw.js                 service worker (offline)
manifest.webmanifest  PWA-manifest
icons/                app-iconen
tests/                unit tests (node --test)
e2e/                  browsertests met Playwright (npm run test:e2e)
scripts/              hulpscripts voor de puzzelvoorraad en de iconen
```

## Lokaal draaien

ES modules en de service worker werken niet via `file://`, dus start een kleine webserver:

```bash
npx serve .            # of: python3 -m http.server 8080
```

Open daarna http://localhost:3000 (of :8080).

**Speciale dagen testen:** voeg `?vandaag=2027-09-29` (jubileum) of `?vandaag=2027-10-12` (verjaardag) aan de URL toe. Met een testdatum gebruikt de app een eigen, aparte opslag (onderin staat dan *Testdatum … · aparte opslag*). Testen raakt dus nooit de echte reeks, statistieken of verrassingen, ook niet op Ruby's toestel.

**Seizoensthema's testen:** `?vandaag=` bepaalt ook het seizoen. Los bijvoorbeeld op `?vandaag=2026-12-30` drie puzzels op (Zondagochtend gaat het snelst): na de derde verschijnt *Nieuw thema: Winter*. Dat kan ook verspreid over `?vandaag=2026-12-31` en `?vandaag=2027-01-02`, want december tot en met februari is één winter.

## Tests

Vereist Node 20 of nieuwer, zonder dependencies:

```bash
npm test
```

De tests dekken de solver, de uniciteitscheck, de generator (alle niveaus, dagpuzzel, hartjespuzzel en snelheid), elke hinttechniek, het oplossen van een Ruby-modus-puzzel met alleen hints, de spellogica, de opslag (ook als localStorage geblokkeerd of kapot is), de persoonlijke teksten, en of de service worker alle bestanden kent en er na een wijziging een nieuwe release is gemaakt.

Daarnaast zijn er e2e-tests die de app echt in een browser draaien (vereist Playwright): een puzzel oplossen, hervatten na herladen, een kapotte opslag of back-up, de 🔥-reeks rond middernacht, testdatums, offline starten, een storing bij GitHub en een update die pas na een tik binnenkomt.

```bash
npm run test:e2e
```

## Snelheid

Generatie draait in een Web Worker. Per niveau ligt er altijd al een puzzel klaar, zodat starten direct gaat; die voorraad vult een tweede worker op de achtergrond, met ruim de tijd (5 s). Voor de twee zwaarste niveaus zijn passende puzzels zeldzaam bij willekeurig weghalen. Moet er meteen een puzzel komen, dan krijgt de generator een tijdslimiet (400 ms). Lukt het niet binnen die tijd, dan pakt hij een puzzel uit `js/bank.js` en husselt die onherkenbaar door elkaar: cijfers hernummeren, rijen en kolommen binnen hun band wisselen en kantelen. De moeilijkheid blijft daarbij precies gelijk. De dagpuzzel neemt de voorraad op volgorde door, zodat dezelfde puzzel pas na ruim een jaar terugkomt. Zondagochtend en Koffie erbij hebben geen voorraad nodig: daar zoekt de generator gewoon door tot het niveau klopt.

De voorraad opnieuw maken (duurt een halve minuut):

```bash
node scripts/build-bank.mjs 120
```

## Online zetten met GitHub Pages

1. Maak op GitHub een nieuwe, lege repository, bijvoorbeeld `rubys-sudoku`.
2. Push deze map ernaartoe:
   ```bash
   git remote add origin https://github.com/<jouw-naam>/rubys-sudoku.git
   git push -u origin main
   ```
3. Ga op GitHub naar **Settings → Pages**. Kies bij *Source* **Deploy from a branch**, branch **main** en map **/ (root)**, en klik op **Save**.
4. Na een minuutje staat de app op `https://<jouw-naam>.github.io/rubys-sudoku/`.

**Op Ruby's iPhone:** open die link in **Safari**, tik op het deelicoontje en kies **Zet op beginscherm**. Daarna start hij als een echte app, ook zonder internet.

**Een update uitbrengen:** draai `npm run release` en push (met `sw.js`). Dat verhoogt `VERSION` bovenin `sw.js` en zet er een vingerafdruk van alle app-bestanden bij; `npm test` faalt zolang je dat vergeet. De app haalt de nieuwe versie op de achtergrond op en toont op het startscherm het kaartje *Er is iets nieuws voor je 💛*. Tot Ruby daarop tikt, draait ze helemaal de oude versie; daarna helemaal de nieuwe, dus nooit een mengsel en nooit midden in een puzzel. Nieuwe bestanden zet je ook in de `SHELL`-lijst in `sw.js` (ook daar waarschuwt `npm test` voor).

De tests draaien bij elke push en pull request automatisch via GitHub Actions (`.github/workflows/test.yml`).

## Aanpassen

- **Berichtjes, bijnamen en datums:** `js/messages.js`.
- **Kleuren van de thema's:** de variabelen bovenin `css/style.css`; naam, feest-emoji en voorproefkleuren in `js/themes.js`. `npm test` controleert of elk thema alle variabelen heeft, of de voorproefkleuren kloppen en of cijfers op het bord minstens 4.5:1 contrast halen.
- **Iconen:** pas `icons/icon.svg` of `icons/maskable.svg` aan en draai `node scripts/render-icons.mjs` (vereist Playwright).
- **Ontwerp controleren:** `node scripts/screenshots.mjs` maakt screenshots van start- en speelscherm in alle thema's, de verjaardag en de hart-onthulling (met `--maten` ook iPhone SE, Pro Max en liggend). Ze komen in `screenshots/`, met per scherm een overzicht; die map staat niet in git. Vereist Playwright.

## Goed om te weten

- Zolang de app open is, blijft het scherm aan (Screen Wake Lock). Op de iPhone werkt dat in Safari vanaf iOS 16.4 en als app op het beginscherm vanaf iOS 18.4. In de energiebesparingsmodus kan iOS het weigeren; dan gaat het scherm gewoon uit zoals altijd.
- iPhones ondersteunen `navigator.vibrate` niet. Op iOS 18 en nieuwer geeft de app daarom een zachte haptische tik via een systeemschakelaar. Op oudere iOS-versies is er alleen geluid. Geluid volgt de stilteschakelaar van de iPhone.
- Op een gewone iPhone (390 px breed) zijn de vakjes ongeveer 42 px. Dat is net iets kleiner dan de richtlijn van 44 px, omdat 9 vakjes anders niet op het scherm passen. Het bord gebruikt daarom de volle breedte.
- Alles wordt alleen in de browser van het toestel bewaard. Wis je de websitedata, dan zijn de statistieken ook weg. Daarom staat er bij **Instellingen → Je voortgang** een knop voor een back-up (een JSON-bestand; op de iPhone via het deelmenu, bijvoorbeeld naar Bestanden) en een knop om die terug te zetten. De app vraagt de browser ook om de opslag niet zomaar op te ruimen.

Gemaakt met heel veel liefde. 💛
