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
- **Techniekenboekje 📖.** Onder *Statistieken* staat naast *Overzicht* en *Kalender* het tabblad *Boekje*: de sudokutechnieken die Ruby onderweg leert. Een techniek komt erin zodra een hint bij **stap 2** (de uitleg) voor het eerst die techniek laat zien; alleen via hints, een puzzel oplossen waarvoor hij nodig was telt niet, en Foutje, Notitie en Cadeautje zijn geen techniek. Bovenaan *"Je kent nu 7 van de 13 technieken"* met een voortgangsbalk, daaronder per niveau (☀️ Zondagochtend, ☕ Koffie erbij, 🤔 Even nadenken, 🔥 Ruby-modus):
  - een ontdekte techniek met de datum (*sinds 23 oktober*), hoe vaak ze hem in een hint zag, een uitleg van 2–3 zinnen en een mini-voorbeeld: een stukje van een echt bord met dezelfde markeringen als een hint (het gebied, de vakjes, het cijfer, wat weg mag);
  - een nog onbekende techniek gestippeld met 🔒 en alleen waar ze hem kan vinden: *"Vraag eens om een hint in Koffie erbij"*.

  Na het oplossen staat er de eerste keer *"Nieuw in je boekje: X-wing 📖"* op het opgelost-scherm. Is er al een record-, speciale-dag-, wedstrijd- of slaapberichtje, dan alleen een stipje op *Statistieken* en *Boekje*; ook als ze een puzzel niet afmaakt is de techniek ontdekt en staat het stipje er. *Statistieken* opent dan meteen op het boekje. Alle 13 ontdekt geeft de mijlpaal *Het hele boekje*. In de opslag: `stats.techniques = { 'x-wing': { since: '2026-10-23', hints: 2 } }` (gaat mee in de back-up; oude opslag zonder dit veld heeft gewoon een leeg boekje). De voorbeelden zijn vaste data in `js/boekje-voorbeelden.js`, één keer gemaakt met `node scripts/build-boekje.mjs`.
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
- **Thema's.** In de kiezer per groepje een rij voorproefjes: *Van jou*, *Sfeer* en *Seizoenen*.
  - Zonnig (geel), Nacht, Sterren, Liefde, Lelie, Gran Canaria, Volleybal en Briefje. Briefje is een blaadje ruitjespapier: wat Ruby zelf invult staat er in het echte handschrift van de maker (de SVG's in `hand/`), net als het logo, de hartjes en het opgelost-scherm.
  - **Robijn** 💎 (donker): diep robijnrood met geslepen facetten op de achtergrond en glanzende cijfers.
  - **RubyxCube** 🧩: elk 3×3-blok een eigen zachte kubuskleur (geel, rood, groen / blauw, wit, oranje / groen, oranje, blauw: buren verschillen altijd). Selectie en fouten zijn op elke kleur te zien (per blok getest). Bij het oplossen draait het bord kort als een kubus.
  - **Koffiemonster** ☕: espresso, crème en melkschuim. Bij het oplossen tekent zich een latte-art-hartje in het midden van het bord.
  - **Gitaar** 🎸: warm hout met nerf, de dunne lijnen zijn snaren en fretten, het gekozen vakje is een plectrum. Zolang Gitaar het thema is en het geluid niet uit staat, klinkt de gitaar (ook als de geluidsinstelling *Zacht* is; die instelling blijft gewoon staan).
  - **Beachvolleybal** 🏖️: zand, zee en zon, met een zachte golf onderaan het scherm. Op een gewone wedstrijddag in de zomer krijgt Volleybal de accentkleuren van Beachvolleybal (als dat vrij is).
  - **Dagverloop** 🌅: de kleuren schuiven met de klok mee: ochtendroze (6–10), middagblauw (10–17), avondoranje (17–21) en nachtpaars (21–6), per kwartier gemengd. Om 6:00 wordt het licht, om 21:00 donker. Het contrast is op alle 96 kwartieren getest.
  - **Krant** 📰: vergeeld papier, zwart en grijs, alles in Fraunces en dunne lijnen, zoals de sudoku achterin de krant.
  - **Krijtbord** 🖍️ (donker): een schoolbord met krijtvegen en ruwe witte lijnen; wat Ruby invult staat er in het handschrift van Briefje, in krijt.
  - **Zonnebloem** 🌻: geel en bladgroen, met op het startscherm een zonnebloem die meegroeit met het aantal dagen dat ze gepuzzeld heeft: zaadje → kiem → steel → knop → bloem → volle bloem (helemaal groot na zo'n 60 dagen). Tik erop om te zien hoe ver hij is.
  - **Hoog contrast** 🔆: wit, zwart en fel geel, alles minstens 7:1, dikkere blokranden en de selectie ook als dikke zwarte rand. Voor fel zonlicht of in de sporthal. Wie nog het oude thema *Automatisch* had op een toestel dat om meer contrast vraagt (*prefers-contrast: more*), krijgt dit thema.
  - **Natuur** (een eigen groepje in de kiezer), elk met een bewegende laag achter het bord:
    - **Waddenzee** 🦭: grijsblauw wad, zilverig licht en een lage horizon met een glinsterend streepje zee onderaan. Af en toe kijkt er een zeehondje om de hoek; tik erop en hij zwaait met een flipper.
    - **Bos** 🐿️: mosgroen, varens in de hoeken en zonlicht dat door de bladeren valt. Af en toe zit er een eekhoorntje met een nootje in een hoekje; bij het oplossen dwarrelen er blaadjes.
    - **Noorderlicht** 🌌 (donker): sterren en heel langzaam golvende groene en paarse lichtbanen boven het bord (22–36 s per golf). Bij het oplossen laait het even op.
    - **Regenachtige dag** ☔ (donker): blauwgrijs, warm lamplicht rond het bord en druppels die langzaam over het "raam" glijden; af en toe lopen er twee samen. Met een eigen schakelaar (*Instellingen → Geluid*, alleen in dit thema) een heel zacht regengeluid: gefilterde ruis via Web Audio, standaard uit, en stil als het geluid uit staat.
    - **Onderwater** 🐠: turkoois naar dieper blauw, lichtstrepen van boven en opstijgende belletjes. Bij het oplossen zwemt er een klein scholetje visjes voorbij.

    De dieren zijn eigen SVG-tekeningetjes. Ze komen hooguit één keer per paar minuten (willekeurig), kijken alleen om de hoek op een plek waar geen knop, bord of (liefst) tekst is, en duiken weg zodra ze ergens anders tikt of scrolt; ze kunnen dus nooit een tik op het bord onderscheppen. Alles beweegt alleen met transform en opacity, met een vast, klein aantal deeltjes (12 druppels, 12 belletjes). Is de app niet in beeld, dan staat alles stil; in de slaapstand op half tempo en zonder dieren; met *minder beweging* (prefers-reduced-motion) een stilstaand beeld zonder dieren en zonder effecten bij het oplossen. Om te testen haalt `?dier=1` het zeehondje of eekhoorntje meteen tevoorschijn (en daarna steeds opnieuw).
  - De seizoenen: Lente, Zomer, Herfst en Winter, plus de keuze *Seizoen*, die vanzelf meewisselt.
- **Vrijspelen.** Sommige thema's moet Ruby eerst verdienen. In de kiezer staan ze met een 🔒 en een hint; zodra er een vrijkomt, verschijnt *Nieuw thema* met een eigen tekstje (en *Probeer maar!*). De regels staan als data in `js/themes.js` (`unlock`) en worden nagerekend door de pure functie `unlockRuleMet`:

  | Thema | Regel | Hint |
  |---|---|---|
  | Lente, Zomer, Herfst, Winter | `{ solves: 3 }`: 3 puzzels binnen dat seizoen | *Nog 2 puzzels deze herfst* |
  | Robijn | `{ level: 'ruby', solves: 10 }`: 10 keer Ruby-modus | *Nog 6× Ruby-modus 🔥* |
  | RubyxCube | `{ streak: 6 }`: 6 dagen op rij gepuzzeld (de langste reeks) | *Zes kanten, zes dagen* |
  | Koffiemonster | `{ before: 10, solves: 50 }`: 50 puzzels opgelost vóór 10:00 (uit het logboek) | *Nog 38 puzzels vóór tienen ☕* |
  | Beachvolleybal | `{ window: ['2027-08-13', '2027-08-22'] }`: de app openen tijdens het WK Beachvolleybal in Nederland; daarna blijft hij vrij | *Tijdens het WK Beachvolleybal, 13–22 aug 2027* |
  | Zonnebloem | `{ total: 25 }`: 25 puzzels, tegelijk met de mijlpaal *Kwart eeuw* 🌻 | *Nog 7 puzzels 🌻* |
  | Bos | `{ total: 40 }`: 40 puzzels | *Nog 12 puzzels 🌰* |
  | Noorderlicht | `{ between: [22, 2], solves: 5 }`: 5 puzzels opgelost tussen 22:00 en 02:00 (over middernacht heen, uit het logboek) | *Puzzel nog 3 keer laat op de avond 🌙* |
  | Onderwater | `{ noHint: 10 }`: 10 puzzels zonder hints | *Nog 4 puzzels zonder hints 🫧* |

  Gitaar, Dagverloop, Krant, Krijtbord, Hoog contrast, Waddenzee en Regenachtige dag zijn meteen vrij. Na elke opgeloste puzzel tellen alle regels, bij het openen van de app alleen de datumvensters. Per thema wordt de dag van vrijspelen bewaard (`stats.themeUnlockDates`); oude opslag zonder datums blijft gewoon werken.

  <details>
  <summary>🤫 Er is ook een geheim thema</summary>

  **Game Boy** 👾: alleen de vier klassieke groentinten, vierkante hoeken, zelfgetekende pixelcijfers (5 × 7, als SVG-masker) en bij het oplossen een kort 8-bit-deuntje (blokgolf, met de gewone geluidsinstelling). Het komt vrij door **8 keer snel achter elkaar op het logo** (*Ruby's Sudoku* bovenaan het startscherm) te tikken, binnen zo'n 3 seconden. Tot dan staat het nergens in de kiezer; daarna in een eigen groepje *Geheim*.
  </details>
- **Effecten alleen als het thema aan staat.** De klok van Dagverloop, de zonnebloem, het latte-hartje, de kubus en het 8-bit-deuntje zitten elk in een eigen module in `js/fx/`, die `js/ui.js` pas laadt als dat thema te zien is. Een thema zonder effecten kost dus geen extra JavaScript.
- **Dagthema's.** Op sommige dagen kiest de app het thema, niet Ruby, voor die hele kalenderdag. Haar eigen keuze blijft bewaard: de volgende dag is alles weer zoals zij het had. In de themakiezer staat dan bovenaan bijv. *"Vandaag kies ik je thema: Volleybal 🏐 Morgen mag je weer zelf."*, de keuzes zijn even dicht en haar eigen keuze blijft aangevinkt. De slaapstand werkt er gewoon overheen. Voorrang, van hoog naar laag:

  1. **Wedstrijddag** (een datum in `js/matches.js`): Volleybal. Is het die dag ook iets van hieronder, dan Volleybal met de accentkleuren en feest-emoji's van die dag (bijv. Volleybal met Nacht-accent en 🎃 op Halloween 31-10-2026). Dat gaat generiek: Volleybal plus de accentset van het andere thema (`html[data-accent]` in `css/style.css`).
  2. **Persoonlijke dagen en feestdagen:** jubileum, half jaar, 100 dagen en Valentijn → Liefde; verjaardag → Zonnig; app-verjaardag → Briefje; Kerst, Tweede kerstdag en Sinterklaas → Winter (als die ooit is vrijgespeeld), anders Sterren; oudejaarsavond en Nieuwjaar → Sterren; Halloween → Nacht; Pasen → Lente (als vrijgespeeld), anders Zonnig; Koningsdag → Zonnig. Daarna vakanties: `VACATIONS` in `js/themes.js` (standaard leeg, met een voorbeeld in het commentaar).
  3. **Seizoenen:** op de dag dat ze een seizoen vrijspeelt dat seizoen (vanaf dat moment), en elk jaar daarna op de eerste dag van dat seizoen (1 maart, 1 juni, 1 september, 1 december).
  4. Anders haar eigen keuze.

  De hele beslissing zit in de pure functie `themeForDay` in `js/themes.js`. Het vroege scriptje `js/theme-early.js` zet het thema van vandaag al voordat de rest van de app laadt, zodat er geen ander thema flitst.
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
js/boekje.js          het Techniekenboekje: uitleg per techniek, ontdekken via hints (puur) ← hier pas je de uitleg aan
js/boekje-voorbeelden.js  de mini-voorbeelden (gemaakt met scripts/build-boekje.mjs)
js/game.js            spelstatus: cijfers, notities, undo/redo
js/storage.js         localStorage: instellingen, lopende puzzel, statistieken
js/messages.js        bijnamen, berichtjes, mijlpalen, speciale dagen ← hier pas je teksten aan
js/matches.js         het wedstrijdschema van Donitas DS 14 ← hier pas je wedstrijden aan
js/themes.js          de thema's als data, vrijspeelregels, seizoenen en dagthema's (VACATIONS) ← hier zet je vakanties
js/theme-early.js     zet het thema van vandaag meteen bij het laden (geen flits)
js/fx/                effecten van één thema, pas geladen als dat thema aan staat (Dagverloop, Zonnebloem, latte, kubus, Game Boy, de natuurthema's)
js/fx/lib/natuur.js   gedeeld door de natuurthema's: de effectlaag, pauzeren, en waar een dier veilig om de hoek kan kijken
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

**Dagthema's testen:** `?vandaag=2026-10-31` (wedstrijd op Halloween: Volleybal met Nacht-accent), `?vandaag=2026-11-14` (gewone wedstrijddag), `?vandaag=2027-10-12` (verjaardag: Zonnig), `?vandaag=2026-12-25` (Kerst), `?vandaag=2026-12-31` (oudejaarsavond) en `?vandaag=2026-11-01` (weer haar eigen thema). Met `&dagthema=uit` staan de dagthema's uit; het screenshotscript gebruikt dat om elk thema ook op speciale dagen te laten zien.

**Natuurthema's testen:** `?dier=1` laat het zeehondje (Waddenzee) of eekhoorntje (Bos) meteen om de hoek kijken. Noorderlicht komt vrij na 5 puzzels laat op de avond, bijvoorbeeld met `?vandaag=2026-11-03T22:30` (met een tijd erbij staat de klok stil). `node scripts/screenshots.mjs --natuur` maakt start, spel, de dieren en het opgelost-moment van alle vijf.

**Techniekenboekje testen:** open bijvoorbeeld `?vandaag=2026-11-03`, begin een puzzel en vraag om een hint. Bij *Meer uitleg* (stap 2) komt de techniek in het boekje en verschijnt het stipje op *Statistieken*; los je de puzzel op, dan staat de regel op het opgelost-scherm (tenzij er een record is). Elke testdatum heeft een eigen, lege testopslag, dus Ruby's echte boekje blijft onaangeroerd. Hogere niveaus (*Even nadenken*, *Ruby-modus*) geven sneller de zwaardere technieken.

**Nieuwe thema's testen:** `?vandaag=2027-08-15` speelt Beachvolleybal vrij (het WK); `?vandaag=2027-03-03T07:30` (of `T13:00`, `T18:30`, `T22:45`) laat Dagverloop op dat tijdstip zien. Robijn, RubyxCube, Koffiemonster en Zonnebloem komen vrij na een opgeloste puzzel als de regel gehaald is.

**Seizoensthema's testen:** `?vandaag=` bepaalt ook het seizoen. Los bijvoorbeeld op `?vandaag=2026-12-30` drie puzzels op (Zondagochtend gaat het snelst): na de derde verschijnt *Nieuw thema: Winter*. Dat kan ook verspreid over `?vandaag=2026-12-31` en `?vandaag=2027-01-02`, want december tot en met februari is één winter.

## Tests

Vereist Node 20 of nieuwer, zonder dependencies:

```bash
npm test
```

De tests dekken de solver, de uniciteitscheck, de generator (alle niveaus, dagpuzzel, hartjespuzzel en snelheid), elke hinttechniek, het oplossen van een Ruby-modus-puzzel met alleen hints, de spellogica, de opslag (ook als localStorage geblokkeerd of kapot is), de persoonlijke teksten, het logboek en de recordteksten, het wedstrijdschema (ook rond zomer- en wintertijd) en de wedstrijdteksten, alle speciale dagen (ook bij samenvallen) en de figuren, het Techniekenboekje (ontdekken bij stap 2, de teller, oude opslag, back-up, het niveau in het hintje, de voorbeelden en de mijlpaal), elke vrijspeelregel (net wel en net niet, ook `between` over middernacht en `noHint`, het WK-venster, de geheime tik-teller, oude opslag zonder datums), Dagverloop op alle 96 kwartieren, RubyxCube per blok, Hoog contrast (7:1), de zonnebloem in elk stadium, en of de service worker alle bestanden kent en er na een wijziging een nieuwe release is gemaakt.

Daarnaast zijn er e2e-tests die de app echt in een browser draaien (vereist Playwright): een puzzel oplossen, hervatten na herladen, een kapotte opslag of back-up, de 🔥-reeks rond middernacht, testdatums, offline starten, een storing bij GitHub, een update die pas na een tik binnenkomt, de kalender na twee dagen puzzelen, een hele wedstrijddag (warming-up, uitkomst, herstel), de speciale dagen (kerstboom oplossen, de maandversary, een oud lopend hart), de natuurthema's (de effectlaag achter het bord, een dier dat niets bedekt terwijl je gewoon op het bord tikt, pauzeren als de app niet in beeld is, stilstand met minder beweging, geen dieren in de slaapstand, het zwaaiende zeehondje en de regen-schakelaar), het Techniekenboekje (ontdekken via een hint, het stipje, de regel op het opgelost-scherm, een ontdekte en een vergrendelde techniek met voorbeeld), en de nieuwe thema's (de gitaar klinkt in Gitaar, het geheime thema via het logo, Beachvolleybal tijdens het WK, Dagverloop, de zonnebloem en de kiezer).

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
- **Kleuren van de thema's:** de variabelen bovenin `css/style.css`; naam, groepje, feest-emoji, voorproefkleuren en vrijspeelregel in `js/themes.js`; de tekst bij het vrijspelen in `THEME_UNLOCK_TEXT` in `js/messages.js`. Dagverloop heeft zijn paletten in `js/fx/dagverloop.js`. `npm test` controleert of elk thema alle variabelen heeft, of de voorproefkleuren kloppen en of cijfers op het bord minstens 4.5:1 contrast halen.
- **Iconen:** pas `icons/icon.svg` of `icons/maskable.svg` aan en draai `node scripts/render-icons.mjs` (vereist Playwright).
- **Ontwerp controleren:** `node scripts/screenshots.mjs` maakt screenshots van start- en speelscherm in alle thema's, de verjaardag, de hart-onthulling, Dagverloop op vier tijden, de zonnebloem in elk stadium, de effecten bij het oplossen, de themakiezer en het Techniekenboekje (met `--boekje` alleen het boekje, in een paar lichte en donkere thema's) (met `--maten` ook iPhone SE, Pro Max en liggend). Ze komen in `screenshots/`, met per scherm een overzicht; die map staat niet in git. Vereist Playwright.

## Goed om te weten

- Zolang de app open is, blijft het scherm aan (Screen Wake Lock). Op de iPhone werkt dat in Safari vanaf iOS 16.4 en als app op het beginscherm vanaf iOS 18.4. In de energiebesparingsmodus kan iOS het weigeren; dan gaat het scherm gewoon uit zoals altijd.
- iPhones ondersteunen `navigator.vibrate` niet. Op iOS 18 en nieuwer geeft de app daarom een zachte haptische tik via een systeemschakelaar. Op oudere iOS-versies is er alleen geluid. Geluid volgt de stilteschakelaar van de iPhone.
- Op een gewone iPhone (390 px breed) zijn de vakjes ongeveer 42 px. Dat is net iets kleiner dan de richtlijn van 44 px, omdat 9 vakjes anders niet op het scherm passen. Het bord gebruikt daarom de volle breedte.
- Alles wordt alleen in de browser van het toestel bewaard. Wis je de websitedata, dan zijn de statistieken ook weg. Daarom staat er bij **Instellingen → Je voortgang** een knop voor een back-up (een JSON-bestand; op de iPhone via het deelmenu, bijvoorbeeld naar Bestanden) en een knop om die terug te zetten. De app vraagt de browser ook om de opslag niet zomaar op te ruimen.

Gemaakt met heel veel liefde. 💛
