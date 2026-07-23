/**
 * RadarApply → Google Sheets signup webhook
 *
 * SETUP (do this once):
 * 1. Open your Signups Google Sheet
 * 2. Extensions → Apps Script
 * 3. Delete any default code; paste THIS entire file into Code.gs
 * 4. Optional: set WEBHOOK_SECRET below to a random string, and put the
 *    SAME value in Vercel as GOOGLE_SHEETS_WEBHOOK_SECRET
 * 5. Click Deploy → New deployment
 *      - Type: Web app
 *      - Description: RadarApply signups
 *      - Execute as: Me
 *      - Who has access: Anyone   ← must be Anyone (not "Anyone with Google account")
 * 6. Click Deploy
 * 7. Google will show a scary permission screen. That is NORMAL for your own script:
 *      - Click "Authorize access"
 *      - Pick your Google account
 *      - If you see "Google hasn’t verified this app":
 *          click Advanced → Go to RadarApply… (unsafe)
 *          then click Allow
 * 8. Copy the Web app URL (ends with /exec)
 * 9. In Vercel → Project → Settings → Environment Variables:
 *      GOOGLE_SHEETS_WEBHOOK_URL = that /exec URL
 *      GOOGLE_SHEETS_WEBHOOK_SECRET = same as WEBHOOK_SECRET (if you set one)
 *    Apply to Production, then Redeploy
 *
 * TEST: open the /exec URL in a browser — you should see {"ok":true,"service":"radarapply-sheets"}
 * Signups append via POST from the RadarApply server (you won’t see rows from just opening the URL).
 *
 * If you change the script later: Deploy → Manage deployments → ✏️ → New version → Deploy
 */

var WEBHOOK_SECRET = ""; // same as GOOGLE_SHEETS_WEBHOOK_SECRET, or "" to skip
var SHEET_NAME = "Signups"; // tab name (created if missing)

/** Browser / health check — proves the web app is live. */
function doGet() {
  return json_({ ok: true, service: "radarapply-sheets" });
}

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
