/**
 * RadarApply → Google Sheets signup webhook
 *
 * 1. Open your Signups spreadsheet
 * 2. Extensions → Apps Script
 * 3. Replace Code.gs with this file
 * 4. Set WEBHOOK_SECRET below (optional but recommended) to match
 *    GOOGLE_SHEETS_WEBHOOK_SECRET on Vercel
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Paste the Web app URL into Vercel as GOOGLE_SHEETS_WEBHOOK_URL
 */

var WEBHOOK_SECRET = ""; // same as GOOGLE_SHEETS_WEBHOOK_SECRET, or "" to skip
var SHEET_NAME = "Signups"; // tab name (created if missing)

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (WEBHOOK_SECRET && data.secret !== WEBHOOK_SECRET) {
      return json_({ ok: false, error: "unauthorized" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Timestamp",
        "Name",
        "Phone",
        "Event",
        "Roles",
        "Count",
      ]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Name",
        "Phone",
        "Event",
        "Roles",
        "Count",
      ]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || "",
      formatPhone_(data.phone || ""),
      data.event || "",
      data.roles || "",
      data.count != null ? data.count : "",
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** +12027330786 → (202) 733-0786 */
function formatPhone_(raw) {
  var digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.charAt(0) === "1") {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return (
      "(" +
      digits.slice(0, 3) +
      ") " +
      digits.slice(3, 6) +
      "-" +
      digits.slice(6)
    );
  }
  return String(raw || "");
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
