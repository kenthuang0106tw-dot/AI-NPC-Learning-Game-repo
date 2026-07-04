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
3. Choose `Flap Power`. Use `High` for easier first-time play.
4. Press `Start`.
5. Press `Space`, click the mouse, or tap the phone screen to make the bird fly upward.
6. Avoid the pipes and the ground.
7. After game over, read the dashboard or export CSV.

The game is designed so a new player can understand it in less than 10 seconds.

## Data Collected

Every frame records one row:

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

For click frames, the row also records:

- `click_interval`: seconds since the previous click
- `error_to_center`: `bird_y - pipe_gap_center`
- `next_pipe_distance`: how far away the next pipe was when the player clicked

All rows are saved in browser `localStorage`, so restarting the game does not delete old data.

`player_play_count` is important. Use it to compare a player's early rounds and later rounds instead of judging skill only by score.

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
];

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
    || SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  const rows = (payload.rows || []).map((row) => HEADERS.map((header) => row[header] ?? ""));
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
9. After that, every finished game uploads automatically.

Each device can use the same upload URL, so all data goes into the same Google Sheet.

`Upload Data` is still useful as a backup button. If the internet disconnects during auto-upload, the rows stay saved in the browser and can be uploaded later.

For this project, the tested Web App URL is already filled into the game as the default upload endpoint. Players usually only need to open the game and play.

## Game Over Dashboard

After each game, the dashboard shows:

- survival time
- score
- average clicks per second
- average height control error: `average(abs(error_to_center))`
- death reason
- bird height variation

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

However, the exported frame data already includes player state and `is_click`, so a future AI model can try to predict whether the next frame will be a click.

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
