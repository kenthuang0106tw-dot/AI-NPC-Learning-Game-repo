# Flappy Skill Lab

This is a Flappy Bird-style web game for an elementary science fair experiment.

The goal is not only to make a game. The goal is to collect clean player data so students can study:

1. Why are strong players better?
2. Can AI predict the player's next click in a future stage?
3. How does game speed change human control?

Stage 1 MVP includes the game, data collection, CSV export, and a game-over dashboard. It does not include AI prediction yet.

## How to Play

Open `index.html` in a browser, or use the GitHub Pages link.

1. Choose a speed level: `Slow`, `Normal`, or `Fast`.
2. Enter the player's name.
3. Press `Start`, or tap the game screen.
4. Press `Space`, click the mouse, or tap the phone screen to make the bird fly upward.
5. Avoid the pipes and the ground.
6. After game over, read the dashboard or export CSV.

Player name is required each time the page is opened. During the same page session, the name stays in the input so the player can play multiple rounds.

The game is designed so a new player can understand it in less than 10 seconds.

Visual upgrades are feedback only. Background color changes, bird skins, animations, and achievements do not change gravity, pipe speed, pipe gap, pipe distance, collision size, or jump force.

The dashboard also keeps each player's best score and unlocked achievements in browser `localStorage`.

## Data Collected

To keep the Google Sheet small, the game records one row every 5 frames. Click frames and death frames are always recorded, even if they are not on a 5-frame sample.

- `game_id`
- `player_name`
- `player_play_count`
- `device_id`
- `time`
- `frame`
- `speed_level`
- `flap_power`
- `bird_y`
- `bird_vy`
- `pipe_x`
- `pipe_gap_center`
- `pipe_gap_size`
- `next_pipe_distance`
- `score`
- `is_click`
- `is_dead`
- `death_reason`
- `sample_type`
- `bird_skin_level`

For click frames, the row also records:

- `click_interval`: seconds since the previous click
- `error_to_center`: `bird_y - pipe_gap_center`
- `next_pipe_distance`: how far away the next pipe was when the player clicked

All rows are saved in browser `localStorage`, so restarting the game does not delete old data.

`player_play_count` is important. Use it to compare a player's early rounds and later rounds instead of judging skill only by score.

`flap_power` is fixed at `normal` so the main experimental variables are speed level and player practice count.

`bird_skin_level` is visual only. It changes every 30 pipes and does not change bird size, collision, physics, speed, or jump force.

## Export CSV

Press `Export CSV` to download all historical game data from this browser.

The CSV can be opened in Excel, Google Sheets, or Python.

Press `Clear Data` only when you want to delete all saved experiment data.

## Upload Data From Different Devices

Local storage stays on one device. To collect data from phones, tablets, and computers into one place, use a Google Sheet with Google Apps Script.

### Setup

1. Create a Google Sheet.
2. Open `Extensions` -> `Apps Script`.
3. Paste this script and replace `PASTE_SHEET_ID_HERE` with the Google Sheet ID.

```javascript
const SHEET_ID = "PASTE_SHEET_ID_HERE";
const SHEET_NAME = "data";
const HEADERS = [
  "game_id",
  "player_name",
  "player_play_count",
  "device_id",
  "time",
  "frame",
  "speed_level",
  "flap_power",
  "bird_y",
  "bird_vy",
  "pipe_x",
  "pipe_gap_center",
  "pipe_gap_size",
  "next_pipe_distance",
  "score",
  "is_click",
  "is_dead",
  "death_reason",
  "click_interval",
  "error_to_center",
  "sample_type",
  "bird_skin_level",
];

function parsePayload(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  return JSON.parse(e.postData.contents);
}

function doPost(e) {
  const payload = parsePayload(e);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
    || SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  const existingKeys = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const existing = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    existing.forEach((row) => existingKeys.add(`${row[0]}|${row[5]}`));
  }

  const rows = (payload.rows || [])
    .filter((row) => !existingKeys.has(`${row.game_id}|${row.frame}`))
    .map((row) => HEADERS.map((header) => row[header] ?? ""));
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: rows.length }));
}
```

4. Click `Deploy` -> `New deployment`.
5. Choose `Web app`.
6. Set `Who has access` to `Anyone`.
7. Copy the Web App URL.
8. Paste that URL into the game's `Upload Endpoint` box and press `Save URL`.
9. After that, each completed game uploads automatically after death as one complete round. The final row in that round contains `is_dead = 1` and the `death_reason`.

Each device can use the same upload URL, so all data goes into the same Google Sheet.

`Upload Backup` is still useful as a backup button. It resends all rows saved in the browser, so the Sheet may contain duplicates. During analysis, remove duplicates by comparing `game_id` and `frame`.

For this project, the tested Web App URL is already filled into the game as the default upload endpoint. Players usually only need to open the game and play.

## Game Over Dashboard

After each game, the dashboard shows:

- survival time
- score
- average clicks per second
- average height control error: `average(abs(error_to_center))`
- death reason
- bird height variation
- upload result
- short encouragement and analysis
- visual achievements earned that round

These metrics help compare different playing styles.

## Research Questions

### 1. Why are strong players better?

Compare high-score and low-score games:

- Are stronger players clicking less often?
- Is their average height error smaller?
- Is their bird height variation lower?
- Do they click earlier before the next pipe?

Also compare by play count:

- Round 1-3: beginner stage
- Round 4-7: practice stage
- Round 8+: experienced stage

This avoids defining "expert" only by score.

### 2. Can AI predict the player's next click?

This MVP does not train AI yet.

However, the exported sampled frame data already includes player state and `is_click`, so a future AI model can try to predict whether the next recorded sample will be a click.

Useful features could include:

- `bird_y`
- `bird_vy`
- `next_pipe_distance`
- `pipe_gap_center`
- `speed_level`

### 3. How does speed affect human reaction?

Compare the same player across `Slow`, `Normal`, and `Fast`:

- Does click frequency increase?
- Does height error get larger?
- Does survival time drop?
- Does death reason change?

## Project Structure

```text
.
|-- index.html
|-- src/
|   |-- app.js
|   `-- styles.css
`-- README.md
```
