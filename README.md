# Drill

Offline banking technicals practice. Installable web app for iPhone. Progress stays on the phone.

## Sections
- Review: cards due today plus new ones (spaced repetition: miss = back tomorrow, hit = longer gap).
- Mental math: endless easy-number and conceptual cards for doing in your head.
- Streak: randomized multi-step numeric cards, new numbers every time. Levels 1 to 4, goals 5/7/10/15/endless. "Copy results" to paste into Claude.
- Missed: everything you got wrong and have not yet got right.
- Topics: Accounting, Enterprise Value, DCF, WACC, Comps, M&A, LBO, Debt, Healthcare, Deal Book, Markets & SaaS, Mental.

## Files
- data/*.js: static cards. One line each:
  C("Topic", difficulty 1-4, "Question", "Direct answer.\n- reasoning bullet\n- reasoning bullet", "optional hint");
- gen.js: random generators (streak and mental). Add a function and list it in STREAK or M.
- app.js, styles.css, index.html: the app. sw.js / cards.js are generated.

## Add or edit cards
1. Edit any file in data/ on github.com (pencil icon, works from your phone) or add a new file there. New topic names appear automatically.
2. Commit. A GitHub Action runs build.js (validates every card) and redeploys the site in about a minute. If a card is malformed, the Action fails and the live app stays as it was: check the Actions tab.
3. Open the app while online. It picks up the new version and reloads; your progress and any session in progress are kept.
Progress is keyed to topic + question text: edit answers freely; rewording a question makes it a new card.

## Install on iPhone
Host the folder (GitHub Pages or Netlify, free). Open the link in Safari, Share, Add to Home Screen. Open it once online, then it works in airplane mode.

## Backup
Settings: Save backup file (share to Files or Notes) or Copy backup text. Restore by pasting.
