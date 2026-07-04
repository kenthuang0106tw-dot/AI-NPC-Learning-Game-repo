const SHEET_ID = "12rOhOWkdhYeDcr_nz-Ao9NEJE7jrw_K_AEgJRwgruUY";
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
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

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
