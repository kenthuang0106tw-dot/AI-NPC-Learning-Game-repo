const SHEET_ID = "12rOhOWkdhYeDcr_nz-Ao9NEJE7jrw_K_AEgJRwgruUY";
const SHEET_NAME = "data";
const CHUNK_SHEET_NAME = "upload_chunks";
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

function doGet(e) {
  const callback = e.parameter.callback || "";
  const gameId = e.parameter.game_id || "";
  const chunkKeys = String(e.parameter.chunk_keys || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const result = verifyUpload(spreadsheet, gameId, chunkKeys);
  const body = JSON.stringify(result);

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${body});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = parsePayload(e);
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const lock = LockService.getScriptLock();

  lock.waitLock(10000);
  try {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    if (payload.chunk_key) {
      const chunkSheet = getChunkSheet(spreadsheet);
      if (isChunkAlreadyUploaded(chunkSheet, payload.chunk_key)) {
        return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: 0, duplicate: true }));
      }

      const payloadRows = payload.rows || [];
      const rows = payloadRows.map((row) => HEADERS.map((header) => row[header] ?? ""));
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
        chunkSheet.appendRow([
          payload.chunk_key,
          payload.uploaded_at || new Date().toISOString(),
          rows.length,
          payload.chunk_number || "",
          payload.chunk_count || "",
          payloadRows[0]?.game_id || "",
          payloadRows[0]?.frame || "",
          payloadRows[payloadRows.length - 1]?.frame || "",
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: rows.length }));
    }

    const rows = getRowsWithLegacyDedupe(sheet, payload.rows || []);
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, rows: rows.length }));
  } finally {
    lock.releaseLock();
  }
}

function verifyUpload(spreadsheet, gameId, chunkKeys) {
  if (chunkKeys.length > 0) {
    const chunkSheet = spreadsheet.getSheetByName(CHUNK_SHEET_NAME);
    if (chunkSheet && areChunksUploaded(chunkSheet, chunkKeys)) {
      return { verified: true, method: "chunks" };
    }
  }

  if (gameId && hasDeathRow(spreadsheet, gameId)) {
    return { verified: true, method: "death_row" };
  }

  return { verified: false };
}

function areChunksUploaded(sheet, chunkKeys) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return false;
  }

  const foundKeys = new Set();
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  values.forEach((row) => foundKeys.add(row[0]));
  return chunkKeys.every((key) => foundKeys.has(key));
}

function hasDeathRow(spreadsheet, gameId) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return false;
  }

  const matches = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(gameId)
    .matchEntireCell(true)
    .findAll();

  return matches.some((cell) => {
    const row = cell.getRow();
    const isDead = sheet.getRange(row, 17).getValue();
    const deathReason = sheet.getRange(row, 18).getValue();
    return Number(isDead) === 1 && deathReason && deathReason !== "none";
  });
}

function getChunkSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CHUNK_SHEET_NAME) || spreadsheet.insertSheet(CHUNK_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "chunk_key",
      "uploaded_at",
      "row_count",
      "chunk_number",
      "chunk_count",
      "game_id",
      "first_frame",
      "last_frame",
    ]);
  }
  return sheet;
}

function isChunkAlreadyUploaded(sheet, chunkKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return false;
  }
  const match = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(chunkKey)
    .matchEntireCell(true)
    .findNext();
  return Boolean(match);
}

function getRowsWithLegacyDedupe(sheet, incomingRows) {
  const existingKeys = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const existing = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    existing.forEach((row) => existingKeys.add(`${row[0]}|${row[5]}`));
  }

  return incomingRows
    .filter((row) => !existingKeys.has(`${row.game_id}|${row.frame}`))
    .map((row) => HEADERS.map((header) => row[header] ?? ""));
}
