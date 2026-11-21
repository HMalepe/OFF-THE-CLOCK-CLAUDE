// Usage: node make_invoice.js <invoice.json> <out.pdf> [bank.json]
// Fills assets/template.html from the JSON and renders an A4 PDF with Playwright.
const fs = require('fs'), path = require('path');
const pw = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const [, , dataPath, outPath, bankPath] = process.argv;
if (!dataPath || !outPath) { console.error('usage: node make_invoice.js invoice.json out.pdf [bank.json]'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const bank = d.bank || (bankPath ? JSON.parse(fs.readFileSync(bankPath, 'utf8')) : null);
if (!bank) { console.error('No banking details: pass bank.json or a "bank" object. Never guess them.'); process.exit(1); }
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (n) => 'R' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const items = d.items || [];
const sub = items.reduce((t, it) => t + (it.qty ?? 1) * it.amount, 0);
const vat = d.vat_rate ? sub * d.vat_rate : 0;
const rows = items.map((it) => `    <tr><td><b>${esc(it.title)}</b>${it.detail ? `<small>${esc(it.detail)}</small>` : ''}</td><td class="num">${it.qty ?? 1}</td><td class="num">${R((it.qty ?? 1) * it.amount)}</td></tr>`).join('\n');
const ref = d.reference;
const vals = {
  reference: esc(ref), project: esc(d.project || ''), billed_to: (d.billed_to || '').split('\n').map(esc).join('<br>'),
  date: esc(d.date || new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })),
  due: esc(d.due || 'Due on receipt'), rows, subtotal: R(sub), total: R(sub + vat),
  vat_row: d.vat_rate ? `    <tr class="tot"><td></td><td class="lbl">VAT (${Math.round(d.vat_rate * 100)}%)</td><td class="num">${R(vat)}</td></tr>` : '',
  note: d.note ? esc(d.note) : `Please use <b>${esc(ref)}</b> as the payment reference and send proof of payment to info@Solupair.co.za. Thank you for the work together.`,
};
for (const k of Object.keys(bank)) vals['bank.' + k] = esc(bank[k]);
const dir = path.join(__dirname, '..', 'assets');
let html = fs.readFileSync(path.join(dir, 'template.html'), 'utf8').replace(/\{\{([\w.]+)\}\}/g, (m, k) => (k in vals ? vals[k] : ''));
const tmp = path.join(dir, '.render.html');
fs.writeFileSync(tmp, html);
(async () => {
  const b = await pw.chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + tmp); await p.waitForTimeout(400);
  await p.pdf({ path: outPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await p.screenshot({ path: outPath.replace(/\.pdf$/, '') + '-preview.png', fullPage: true });
  await b.close(); fs.unlinkSync(tmp);
  console.log('total', R(sub + vat), '->', outPath);
})();
