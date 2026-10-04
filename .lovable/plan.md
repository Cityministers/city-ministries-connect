# Biblical-basis paragraphs for all 30 ministry popups

## What happens

Every ministry icon on the homepage opens a popup. Today only **Coffee Chat** explains *why* the act matters — the other 29 jump straight from a one-line description to Bible quotes.

You picked: **two paragraphs per ministry, same length as Coffee Chat (130–150 words each), English only for now.**

So each popup becomes:

```text
Icon + title
One-line description
Paragraph 1 — the biblical basis for this theme (named passages, brief explanation)
Paragraph 2 — how it carries witness, humility and the gospel
──────────────────────────────
Scripture quotes (already there)
Read in context on YouVersion  ·  Start this ministry
```

Coffee Chat is left exactly as it is, so you can still compare.

## Voice and content rules

- Each paragraph names its passages in the sentence, like Coffee Chat does (John 15:15, James 2:23, Acts 2:46, Luke 14).
- Paragraph 1 grounds the theme in Scripture; paragraph 2 turns to witness, humility and neighbourly love — never "you are better than anyone."
- Historical notes stay to things that are verifiable (Bereans examining the scrolls, Paul asking for his books, house churches named in the letters, Augustine's small-group dialogues).
- No invented quotes. No verse twisting a ministry into a duty.

## What each ministry will say (passages chosen)

**Hospitality and the table**
- Dine-out in Public — Luke 15:1–2; Matt 11:19; 1 Cor 9:19–22; 1 Cor 10:27, 31–33
- Dine-In Dinner Host — Rom 12:13; Heb 13:2 with Gen 18; Luke 10:38–42; Luke 22; Luke 24:30–31
- Buy or Give Food — Deut 15:7–11; Prov 22:9; Isa 58:10; Acts 6:1–7; 2 Cor 8:13–15; John 6:35
- Game Nite or Play Date — Eccl 3:4; Prov 17:22; John 2:1–11; Neh 8:10; 1 Cor 9:24–27; Prov 27:17

**Hands-on labour**
- Help Move or Labor — Acts 18:3; 1 Cor 4:12; Acts 20:34–35; Gal 6:2; John 13:4–5; John 1:14
- Help With Handyman Services — Mark 6:3; Ex 31:1–5; 2 Kings 22:6; Neh 3; 1 Thess 4:11–12; Ps 118:22
- Clean or Organize — 2 Kings 22:3–7; 1 Chr 23:28–32; Neh 13:8–9; 1 Cor 12:21–26; 1 Cor 14:40
- Free Clothes — Gen 3:21; Deut 24:12–13, 19–21; Isa 58:7; Matt 25:35–36, 40; James 2:15–16
- Free Haircuts — Num 6:1–21; Judg 16:17; 1 Sam 16:7; James 1:27; 1 Cor 12:22–24

**Neighbour and stranger**
- A Local Ride — Luke 10:30–35; Deut 10:19; 3 John 1:5–8; Rom 16:1–2
- Reach Out to Lost, Lonely, or Hurt — Luke 15:1–7, 20; Matt 9:12–13; Hos 11:8–9; Rom 12:15; 2 Cor 1:3–4
- Host a Homeless or Rehab Person — Matt 25:35–43; Lev 19:33–34; Zech 3:1–5; Mark 5:1–20; Philem 1:16; Luke 2:7
- Help Injured or Handicap — Luke 10:25–37; Lev 19:14; 2 Sam 9:3–13; John 9:1–3; 1 Cor 12:21–26; John 20:27
- Write an Inmate — Matt 25:36, 39–40; Heb 13:3; Philemon; Acts 16:25–34; Ps 142:7; Eph 4:1
- Community Service — Jer 29:4–7; Micah 6:8; Matt 5:13–16; James 1:27; 1 John 3:18; Titus 3:8

**Friendship, courtship, family**
- Blind Date — Gen 24 (Rebekah at the well); Gen 29:20; Ruth 3; Prov 18:22; Eph 5:25–27
- Romantic Double Date — Song 1:2; Song 8:6–7; Eccl 4:9–12; Heb 10:24–25; 1 Tim 5:2
- Babysit — Mark 10:13–16; Isa 49:15–16; 1 Sam 1:27–28; Matt 18:5; 1 Cor 12:22–24
- Walk Your Dog — Gen 3:8; Deut 6:7; Prov 12:10; Micah 6:8; Eph 5:8; 1 Thess 4:11–12

**Prayer and gathering**
- Pray With or For Someone — Jas 5:16–17; Rom 8:26–27; Matt 18:19–20; Gen 18:22–33; Job 42:8; Acts 12:12; Heb 7:25
- Host Prayer & Praise Event — Ps 22:3; 2 Chr 5:13–14; Acts 16:25–26; Matt 18:20; Col 3:16; Phil 2:6–11
- Host Small Group Meeting — Acts 2:42–47; Acts 5:42; Col 4:15; Philem 1:2; Mark 14:14–15; John 13:1–17
- Volunteer at Church — 1 Pet 4:10; 1 Cor 12:4–7; Acts 6:1–7; Mark 10:43–45; John 13:4–5; Col 3:23–24

**Thinking, beauty, creation**
- Lend a Book — 2 Tim 3:16–17; 2 Tim 4:13; Acts 17:11; Acts 8:26–39; Isa 55:11
- Intellectual Talks Over Wine or Beer — Acts 17:2–3, 11; Acts 19:9; Prov 9:1–6; Prov 3:13–18; 1 Cor 14:20; John 2:1–11
- Artistic Abilities — Ex 31:1–5; Ex 35:30–35; 1 Chr 25:1–7; 1 Sam 16:23; Ps 96:1–9; Col 3:23
- Fishing or Camping — Mark 1:16–20; John 21:3–14; Ps 19:1; Eccl 3:11; Hos 2:14; Heb 11:9; 1 Pet 2:11
- Feed Chickens — Gen 1:28; Gen 2:15; Matt 6:26; Ps 104:14–29; Prov 27:23; 1 Cor 9:9–10; Matt 23:37
- Open to Requests — Acts 9:36–42; 1 Pet 4:10–11; Matt 5:42; Mark 9:35; Mark 12:41–44; Gal 5:13

## Technical section

- **Data only.** All new text goes into `src/data/ministries.ts` inside the existing `ministryReflections` map, keyed by ministry id — the same shape Coffee Chat uses today. No new tables, no database or auth changes.
- **No component changes needed.** The homepage popup (`src/routes/index.tsx`, the block that already loops `ministryReflections`) renders whatever ids are present, and the popup already scrolls on phones.
- **English only.** The 12 other languages will show these paragraphs in English until we run the translation pass — the same behaviour the site already uses for any new English string.
- **Verification.** Open all 30 popups in a phone-sized browser, confirm each shows two paragraphs above the divider and the scriptures, nothing clipped, and that the build log stays clean.
- **Follow-up when you ask for it:** the translation pass for all 12 languages, and a second review of the two-paragraph split for any ministry you want deeper.
