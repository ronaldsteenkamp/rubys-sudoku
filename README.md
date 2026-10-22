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
- **Kalender en records.** In *Statistieken* staat naast het overzicht een maandkalender: op elke dag waarop Ruby een puzzel oploste staat een hartje (in Briefje het getekende hartje uit `hand/`), een dagpuzzel krijgt een zacht vlakje en een speciale dag een roze. Tik op een dag en je ziet wat ze toen deed: niveau, tijd, hints en of het de dagpuzzel was. Een nieuw persoonlijk record krijgt op het opgelost-scherm een eigen, warme regel (*"Nieuw record op Koffie erbij! 2 min sneller dan je vorige beste ☕"*); langzamer zegt de app nooit. Alles komt uit een compact logboek in de statistieken: ruim twee jaar, hooguit 1500 puzzels, en het gaat mee in de back-up.
- **Persoonlijk.** Een begroeting per dagdeel met haar bijnamen en een teller van de dagen samen. Bij het oplossen dwarrelen er hartjes en pootjes en verschijnt een lief berichtje. Op speciale dagen staat er een figuurpuzzel klaar (zie hieronder). Mijlpalen ontgrendelen geheime berichtjes.
- **Speciale dagen en figuurpuzzels.** Op een speciale dag staat er een kaartje bovenaan het startscherm met een puzzel in een figuur: alle gegeven cijfers liggen in de figuur, die bij het oplossen rij voor rij volloopt (een hart klopt, andere figuren pulseren zacht), met de feest-emoji's van die dag. Valt er meer op één dag, dan geldt deze volgorde:

  | Dag | Wanneer | Figuur |
  |---|---|---|
  | Jubileum | 29 september | hart |
  | Verjaardag | 12 oktober | hart |
  | Half jaar samen | 29 maart (een half, anderhalf, tweeënhalf … jaar) | half hart: de linkerhelft vol cijfers, rechts alleen de omtrek |
  | 100 dagen samen | 7 januari 2027 (eenmalig) | ballon |
  | App-verjaardag | 21 oktober, vanaf 2027, met haar eigen cijfers | cadeautje met strik |
  | Laatste thuiswedstrijd | 17 april 2027 (die dag ook 200 dagen samen) | volleybal, in plaats van de warming-up |
  | Valentijnsdag | 14 februari | hart met pijl |
  | Pasen | eerste paasdag (Meeus/Butcher) | paasei |
  | Koningsdag | 27 april (op zondag: 26 april) | kroon |
  | Halloween | 31 oktober | pompoen met gezichtje |
  | Sinterklaas | 5 december, met een gedichtje van de Sint | chocoladeletter R |
  | Kerst / Tweede kerstdag | 25 / 26 december | kerstboom / ster |
  | Nieuwjaar | 1 januari | vuurwerk |
  | Maandversary | elke 29e (februari zonder 29e: de laatste dag) | geen puzzel, alleen een lief kaartje |

  Teksten liggen per jaar vast (na een herstart dezelfde, volgend jaar soms een andere) en gebruiken haar bijnamen.
- **Wedstrijddag.** Ruby speelt volleybal bij Donitas DS 14 (rugnummer 33). Op een wedstrijddag staat er een kaartje op het startscherm: vóór de wedstrijd tegenstander, tijd en thuis/uit met een peptalk (steeds een andere) en een korte warming-up-puzzel (±46 gegeven cijfers, alleen eenvoudige technieken). Tijdens de wedstrijd zit de app (in gedachten) langs de lijn. Daarna vraagt hij *Hoe ging het?* (gewonnen, verloren of zeg maar niks; de app weet de uitslag zelf nooit) en volgt een rustige herstelpuzzel met verborgen timer en zachte geluiden. Na een late wedstrijd (na 22:30 afgelopen) blijft dat tot de volgende dag 12:00 staan. Beide puzzels zijn vast per wedstrijd en tellen mee als gewone puzzels (niet als dagpuzzel); in Volleybal dwarrelen er ballen. Na de herstelpuzzel van de laatste wedstrijd van het seizoen komt de mijlpaal *Seizoen uitgespeeld* vrij. Zonder wedstrijd ziet het startscherm er gewoon uit zoals altijd.
- **Thema's.** Zonnig (geel), Nacht, Gran Canaria, Lelie, Liefde, Sterren, Volleybal en Briefje. Briefje is een blaadje ruitjespapier: wat Ruby zelf invult staat er in het echte handschrift van de maker (de SVG's in `hand/`), net als het logo, de hartjes en het opgelost-scherm. Daarnaast vier seizoensthema's (Lente, Zomer, Herfst, Winter) die vrijkomen als Ruby 3 puzzels oplost binnen dat seizoen, plus de keuze *Seizoen*, die vanzelf meewisselt.
- **Slaapstand.** Tussen 23:00 en 06:00 (of altijd, of nooit: *Instellingen → Slaapstand*) wordt alles in 2 seconden zwart-wit; de cijfers blijven in elk thema minstens 4,5:1 leesbaar (getest). Geluid op halve sterkte, geen trillen en rustiger feest. Na het oplossen een slaapberichtje (*"Dat was de laatste voor vandaag. Welterusten, slaap lekker 💛"*), geen grote *Nog eentje*-knop maar een klein *Toch nog eentje*, en het scherm mag weer uit. Een record-, speciale-dag- of wedstrijdberichtje gaat voor het slaapberichtje.
- **Ruby Wrapped.** Van 31 december tot en met 7 januari staat op het startscherm *Jouw jaar in puzzels ✨*: een verhaal in kaarten (tik rechts verder, links terug, of pijltjestoetsen) met haar aantal puzzels en vakjes, favoriete niveau, snelste tijd, langste reeks, puzzeluur, drukste maand, speciale dagen, koppen koffie en tot slot *Op naar <jaar> 💛*, eventueel te delen als plaatje. Kaarten zonder genoeg gegevens worden overgeslagen; het eerste jaar zegt *sinds 21 oktober*. Daarna blijft elk jaar te bekijken onderaan *Statistieken*. Het aantal vakjes is een schatting per niveau; het uur van elke puzzel staat sinds deze versie in het logboek (oudere puzzels tellen niet mee voor het puzzeluur).
- **PWA.** Een eigen icoon, werkt offline, met zachte geluidjes en trillen (beide uit te zetten).

## Projectstructuur

```
index.html            de pagina
css/style.css         alle opmaak en thema's
fonts/                Fraunces en Nunito (zelf gehost, met hun OFL-licentie)
js/solver.js          backtracking-solver met bitmaskers, uniciteitscheck
js/techniques.js      logische technieken (voor moeilijkheid én hints)
js/generator.js       generator, niveaus, dagpuzzel, figuurpuzzels (SHAPES)
js/bank.js            voorraad lastige puzzels (gegenereerd, zie hieronder)
js/hints.js           slimme hints in drie stappen
js/game.js            spelstatus: cijfers, notities, undo/redo
js/storage.js         localStorage: instellingen, lopende puzzel, statistieken
js/messages.js        bijnamen, berichtjes, mijlpalen, speciale dagen ← hier pas je teksten aan
js/matches.js         het wedstrijdschema van Donitas DS 14 ← hier pas je wedstrijden aan
js/themes.js          de thema's als data, seizoenen en het ontgrendelen
js/feedback.js        geluidjes en trillen
js/sleep.js           slaapstand: tijdvenster en filter
js/wrapped.js         Ruby Wrapped: het jaaroverzicht uit het logboek (puur)
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

**Speciale dagen testen:** voeg `?vandaag=` met de datum aan de URL toe: `2027-09-29` (jubileum), `2027-10-12` (verjaardag), `2027-03-29` (half jaar), `2027-01-07` (100 dagen), `2027-10-21` (app-verjaardag), `2027-04-17T09:00` (laatste thuiswedstrijd, met het wedstrijdkaartje), `2027-02-14` (Valentijn), `2027-03-28` (Pasen), `2027-04-27` (Koningsdag), `2026-10-31` (Halloween), `2026-12-05` (Sinterklaas), `2026-12-25` en `2026-12-26` (kerst), `2027-01-01` (Nieuwjaar) en `2026-11-29` (maandversary). Met een testdatum gebruikt de app een eigen, aparte opslag (onderin staat dan *Testdatum … · aparte opslag*). Testen raakt dus nooit de echte reeks, statistieken of verrassingen, ook niet op Ruby's toestel.

**Wedstrijddagen testen:** zet er ook een tijd bij, dan staat de klok stil op dat moment: `?vandaag=2026-11-28T09:30` (vóór de ochtendwedstrijd tegen Kroton, met peptalk en warming-up), `?vandaag=2026-11-28T11:30` (tijdens) en `?vandaag=2026-11-28T14:00` (*Hoe ging het?* en de herstelpuzzel). De late wedstrijd van 22 oktober (21:00) loopt door tot `?vandaag=2026-10-23T11:59`. Ook dit gebruikt de aparte testopslag.

**Slaapstand en Wrapped testen:** `?vandaag=2026-11-02T23:30` (slaapstand), `?vandaag=2026-12-31T20:00` (Wrapped op het startscherm) of `?vandaag=2026-12-31T23:30` (allebei). Ook met de aparte testopslag; daar staat het logboek nog leeg, dus los eerst wat puzzels op.

**Seizoensthema's testen:** `?vandaag=` bepaalt ook het seizoen. Los bijvoorbeeld op `?vandaag=2026-12-30` drie puzzels op (Zondagochtend gaat het snelst): na de derde verschijnt *Nieuw thema: Winter*. Dat kan ook verspreid over `?vandaag=2026-12-31` en `?vandaag=2027-01-02`, want december tot en met februari is één winter.

## Tests

Vereist Node 20 of nieuwer, zonder dependencies:

```bash
npm test
```

De tests dekken de solver, de uniciteitscheck, de generator (alle niveaus, dagpuzzel, hartjespuzzel en snelheid), elke hinttechniek, het oplossen van een Ruby-modus-puzzel met alleen hints, de spellogica, de opslag (ook als localStorage geblokkeerd of kapot is), de persoonlijke teksten, het logboek en de recordteksten, het wedstrijdschema (ook rond zomer- en wintertijd) en de wedstrijdteksten, alle speciale dagen (ook bij samenvallen) en de figuren, en of de service worker alle bestanden kent en er na een wijziging een nieuwe release is gemaakt.

Daarnaast zijn er e2e-tests die de app echt in een browser draaien (vereist Playwright): een puzzel oplossen, hervatten na herladen, een kapotte opslag of back-up, de 🔥-reeks rond middernacht, testdatums, offline starten, een storing bij GitHub, een update die pas na een tik binnenkomt, de kalender na twee dagen puzzelen, een hele wedstrijddag (warming-up, uitkomst, herstel), en de speciale dagen (kerstboom oplossen, de maandversary, een oud lopend hart).

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

- **Berichtjes, bijnamen en datums:** `js/messages.js` (ook de peptalks en de teksten voor na de wedstrijd).
- **Speciale dagen:** de lijst `SPECIAL_DAYS` in `js/messages.js`; de volgorde is de voorrang, en een dag toevoegen is één regel erbij. Daar staan ook `APP_GIFT` (de dag dat Ruby de app kreeg) en `LAST_HOME_MATCH` (de laatste thuiswedstrijd; pas die aan als het schema in `js/matches.js` een nieuw seizoen krijgt, een test controleert dat ze overeenkomen).
- **Figuren:** de tabel `SHAPES` in `js/generator.js`: 9 regels van 9 tekens, met `X` voor de figuur, `O` voor een accent (pijl, lint, gezichtje) en `.` erbuiten. `npm test` controleert of een figuur oplosbaar kan zijn (minstens 40 vakjes, en per band of stapel hooguit één lege rij of kolom) en of er snel een unieke puzzel van te maken is. De kleuren per figuur staan in `css/style.css` bij *Kleuren van de figuurpuzzels*.
- **Wedstrijdschema:** `js/matches.js`. Bovenin staat hoe je een wedstrijd toevoegt, verzet of schrapt; `npm test` controleert het schema. Vergeet daarna `npm run release` niet.
- **Kleuren van de thema's:** de variabelen bovenin `css/style.css`; naam, feest-emoji en voorproefkleuren in `js/themes.js`. `npm test` controleert of elk thema alle variabelen heeft, of de voorproefkleuren kloppen en of cijfers op het bord minstens 4.5:1 contrast halen.
- **Iconen:** pas `icons/icon.svg` of `icons/maskable.svg` aan en draai `node scripts/render-icons.mjs` (vereist Playwright).
- **Ontwerp controleren:** `node scripts/screenshots.mjs` maakt screenshots van start- en speelscherm in alle thema's, de verjaardag en de hart-onthulling (met `--maten` ook iPhone SE, Pro Max en liggend). Ze komen in `screenshots/`, met per scherm een overzicht; die map staat niet in git. Vereist Playwright.

## Goed om te weten

- Zolang de app open is, blijft het scherm aan (Screen Wake Lock). Op de iPhone werkt dat in Safari vanaf iOS 16.4 en als app op het beginscherm vanaf iOS 18.4. In de energiebesparingsmodus kan iOS het weigeren; dan gaat het scherm gewoon uit zoals altijd.
- iPhones ondersteunen `navigator.vibrate` niet. Op iOS 18 en nieuwer geeft de app daarom een zachte haptische tik via een systeemschakelaar. Op oudere iOS-versies is er alleen geluid. Geluid volgt de stilteschakelaar van de iPhone.
- Op een gewone iPhone (390 px breed) zijn de vakjes ongeveer 42 px. Dat is net iets kleiner dan de richtlijn van 44 px, omdat 9 vakjes anders niet op het scherm passen. Het bord gebruikt daarom de volle breedte.
- Alles wordt alleen in de browser van het toestel bewaard. Wis je de websitedata, dan zijn de statistieken ook weg. Daarom staat er bij **Instellingen → Je voortgang** een knop voor een back-up (een JSON-bestand; op de iPhone via het deelmenu, bijvoorbeeld naar Bestanden) en een knop om die terug te zetten. De app vraagt de browser ook om de opslag niet zomaar op te ruimen.

Gemaakt met heel veel liefde. 💛
