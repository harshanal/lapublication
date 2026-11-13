/* Standalone Apps Script. Deploy as yourself, accessible to Anyone.
 * Only HMAC-authenticated requests from the website may write to the Sheet.
 * Keep SHARED_SECRET in Script properties, never in this file or the browser.
 */
const QUESTION_SHEET_ID = '1tyOztqEpn_pkO0vWawbWCs-luKcgFvZ0QtjxheBv9ng';
const QUESTION_HEADERS = ['Submission ID', 'Received at', 'Name', 'Email', 'Topic', 'Question', 'Status', 'Assigned to', 'Answered on', 'Answer / reference link', 'Notes', 'Email status', 'Last email error'];
const QUESTION_RECIPIENT = 'harshanal@gmail.com';
const QUESTION_COPY = 'ladhammaquestion@gmail.com';

function setupQuestionIntake() {
  const book = SpreadsheetApp.openById(QUESTION_SHEET_ID);
  const sheet = book.getSheetByName('Questions');
  if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, 13).getValues()[0]) !== JSON.stringify(QUESTION_HEADERS)) throw new Error('Questions headers do not match. Setup stopped.');
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('SHARED_SECRET')) properties.setProperty('SHARED_SECRET', typeof BOOTSTRAP_SHARED_SECRET === 'string' ? BOOTSTRAP_SHARED_SECRET : Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  let ledger = book.getSheetByName('_Intake');
  if (!ledger) {
    ledger = book.insertSheet('_Intake');
    ledger.getRange(1, 1, 1, 5).setValues([['Submission ID', 'Received at', 'Client key', 'Email key', 'Content key']]);
    ledger.hideSheet();
  }
  book.setSpreadsheetTimeZone('Europe/London');
  const functions = ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); });
  if (functions.indexOf('handleQuestionEdit') < 0) ScriptApp.newTrigger('handleQuestionEdit').forSpreadsheet(QUESTION_SHEET_ID).onEdit().create();
  if (functions.indexOf('retryPendingQuestionEmails') < 0) ScriptApp.newTrigger('retryPendingQuestionEmails').timeBased().everyMinutes(15).create();
  MailApp.getRemainingDailyQuota(); // Request the mail permission during owner setup.
  console.log('Setup complete. Connect the web-app URL and SHARED_SECRET to Vercel server environment variables.');
}

function questionJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function questionSignature_(text, secret) {
  return Utilities.computeHmacSha256Signature(text, secret, Utilities.Charset.UTF_8).map(function(byte) {
    return ('0' + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join('');
}

function questionEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== 64 || b.length !== 64) return false;
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function questionText_(value) {
  // A submitted question must remain text, including strings beginning with '='.
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function questionValid_(data) {
  if (!data || !/^[0-9a-f-]{36}$/i.test(data.id || '') || !Number.isFinite(data.sentAt) || Math.abs(Date.now() - data.sentAt) > 300000) return false;
  if (!/^[0-9a-f]{64}$/.test(data.clientKey || '') || !/^[0-9a-f]{64}$/.test(data.emailKey || '') || !/^[0-9a-f]{64}$/.test(data.contentKey || '')) return false;
  const rules = [['name', 1, 120], ['email', 3, 254], ['topic', 1, 160], ['question', 10, 5000]];
  if (!rules.every(function(rule) { const value = data[rule[0]]; return typeof value === 'string' && value.trim().length >= rule[1] && value.length <= rule[2] && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value); })) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
}

function doGet() { return questionJson_({ ok: true, service: 'Shraavaka Prashna intake' }); }

function doPost(event) {
  let envelope, data;
  try {
    const raw = event && event.postData && event.postData.contents;
    if (!raw || raw.length > 40000) return questionJson_({ ok: false, code: 'invalid' });
    envelope = JSON.parse(raw);
    const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!secret || secret.length < 32 || typeof envelope.payload !== 'string' || !questionEqual_(envelope.signature, questionSignature_(envelope.payload, secret))) return questionJson_({ ok: false, code: 'unauthorized' });
    data = JSON.parse(envelope.payload);
    if (data.action === 'health') {
      const handlers = ScriptApp.getProjectTriggers().map(function(trigger) { return trigger.getHandlerFunction(); });
      return questionJson_({ ok: true, answerDateTrigger: handlers.indexOf('handleQuestionEdit') >= 0, mailRetryTrigger: handlers.indexOf('retryPendingQuestionEmails') >= 0 });
    }
    if (!questionValid_(data)) return questionJson_({ ok: false, code: 'invalid' });
  } catch (error) { return questionJson_({ ok: false, code: 'invalid' }); }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return questionJson_({ ok: false, code: 'busy' });
  try {
    const book = SpreadsheetApp.openById(QUESTION_SHEET_ID);
    const sheet = book.getSheetByName('Questions');
    const ledger = book.getSheetByName('_Intake');
    if (!sheet || !ledger) return questionJson_({ ok: false, code: 'not_configured' });
    const ids = sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).getValues().map(function(row) { return row[0]; });
    const records = ledger.getLastRow() > 1 ? ledger.getRange(2, 1, ledger.getLastRow() - 1, 5).getValues() : [];
    const existing = ids.indexOf(data.id);
    if (existing >= 0) {
      const original = records.find(function(row) { return row[0] === data.id; });
      if (original && original[4] && original[4] !== data.contentKey) return questionJson_({ ok: false, code: 'conflict' });
      questionSendEmail_(sheet, existing + 2);
      return questionJson_({ ok: true, id: data.id, duplicate: true });
    }
    const received = Date.now();
    const recent = records.filter(function(row) { return received - new Date(row[1]).getTime() < 86400000; });
    const hourly = recent.filter(function(row) { return received - new Date(row[1]).getTime() < 3600000; });
    if (recent.length >= 100 || recent.filter(function(row) { return row[3] === data.emailKey; }).length >= 8 || hourly.filter(function(row) { return row[3] === data.emailKey; }).length >= 3 || hourly.filter(function(row) { return row[2] === data.clientKey; }).length >= 20) return questionJson_({ ok: false, code: 'rate_limit' });
    let last = ids.length - 1;
    while (last >= 0 && !ids[last]) last--;
    const target = last + 3;
    if (target >= sheet.getMaxRows() - 1) sheet.insertRowsBefore(sheet.getMaxRows(), 500);
    sheet.getRange(target, 1, 1, 13).setValues([[
      data.id, new Date(received), questionText_(data.name), questionText_(data.email), questionText_(data.topic), questionText_(data.question),
      'New', '', '', '', '', 'Pending', ''
    ]]);
    // The native table owns date formatting; typed columns reject range formats.
    if (!ledger.getRange(1, 5).getValue()) ledger.getRange(1, 5).setValue('Content key');
    ledger.appendRow([data.id, new Date(received), data.clientKey, data.emailKey, data.contentKey]);
    SpreadsheetApp.flush();
    questionSendEmail_(sheet, target);
    return questionJson_({ ok: true, id: data.id });
  } catch (error) {
    console.error('Question intake failed. Check Sheet and deployment permissions.');
    return questionJson_({ ok: false, code: 'unavailable' });
  } finally { lock.releaseLock(); }
}

function questionSendEmail_(sheet, row) {
  const values = sheet.getRange(row, 1, 1, 13).getValues()[0];
  if (!values[0] || ['Sent', 'Sending', 'Review'].indexOf(values[11]) >= 0 || MailApp.getRemainingDailyQuota() < 2) return;
  sheet.getRange(row, 12, 1, 2).setValues([['Sending', '']]);
  SpreadsheetApp.flush();
  try {
    MailApp.sendEmail({
      to: QUESTION_RECIPIENT, cc: QUESTION_COPY, replyTo: String(values[3]),
      name: 'ලොව්තුරු අරණ ශ්‍රාවක ප්‍රශ්න',
      subject: 'ශ්‍රාවක ප්‍රශ්න | ' + values[0],
      body: 'නම / Name: ' + values[2] + '\nEmail: ' + values[3] + '\nමාතෘකාව / Topic: ' + values[4] + '\n\n' + values[5] + '\n\nWorksheet: https://docs.google.com/spreadsheets/d/' + QUESTION_SHEET_ID + '/edit\nSubmission ID: ' + values[0]
    });
    sheet.getRange(row, 12, 1, 2).setValues([['Sent', '']]);
  } catch (error) {
    // Delivery can be ambiguous after a provider error. Avoid automatic duplicates.
    sheet.getRange(row, 12, 1, 2).setValues([['Review', 'Check both inboxes before changing Email status to Pending to retry.']]);
  }
}

function retryPendingQuestionEmails() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const book = SpreadsheetApp.openById(QUESTION_SHEET_ID);
    const sheet = book.getSheetByName('Questions');
    if (!sheet || sheet.getLastRow() < 2) return;
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
    let sent = 0;
    rows.forEach(function(values, index) {
      if (sent < 10 && values[0] && values[11] === 'Pending' && MailApp.getRemainingDailyQuota() >= 2) { questionSendEmail_(sheet, index + 2); sent++; }
      if (values[0] && values[11] === 'Sending' && Date.now() - new Date(values[1]).getTime() > 1800000) sheet.getRange(index + 2, 12, 1, 2).setValues([['Review', 'Delivery outcome unknown. Check inboxes before retrying.']]);
    });
    const ledger = book.getSheetByName('_Intake');
    if (ledger && ledger.getLastRow() > 1) {
      const dates = ledger.getRange(2, 2, ledger.getLastRow() - 1, 1).getValues();
      for (let i = dates.length - 1; i >= 0; i--) if (Date.now() - new Date(dates[i][0]).getTime() > 172800000) ledger.deleteRow(i + 2);
    }
  } finally { lock.releaseLock(); }
}

function handleQuestionEdit(event) {
  const range = event && event.range;
  if (!range || range.getSheet().getName() !== 'Questions' || range.getColumn() > 7 || range.getColumn() + range.getNumColumns() <= 7) return;
  const sheet = range.getSheet();
  const first = Math.max(2, range.getRow());
  const last = Math.min(sheet.getLastRow(), range.getRow() + range.getNumRows() - 1);
  for (let row = first; row <= last; row++) {
    if (!sheet.getRange(row, 1).getValue()) continue;
    const status = sheet.getRange(row, 7).getValue();
    const answered = sheet.getRange(row, 9);
    if (status === 'Answered' && !answered.getValue()) answered.setValue(new Date());
    else if (status !== 'Answered') answered.clearContent();
  }
}
