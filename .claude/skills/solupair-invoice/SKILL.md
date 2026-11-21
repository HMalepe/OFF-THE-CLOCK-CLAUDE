---
name: solupair-invoice
description: Make a Solupair (Pty) Ltd invoice as a branded A4 PDF (black bar with the Solupair logo, gradient underline, purple accent, banking block). Use whenever Holiday asks for an invoice, a bill, a deposit/split/retainer invoice, or "invoice a client for R…", even if he only gives a client name, an amount and a reference.
---

# Solupair invoice

Makes a one-page A4 invoice PDF in the Solupair house style, using `assets/template.html` and `scripts/make_invoice.js`.

## Inputs to collect

Ask only for what is missing:

- **Billed to:** the client's name, plus their company and address if given.
- **Reference:** e.g. `Off The Clock 001`.
  - It is the invoice number too, so it appears in the title ("Invoice Off The Clock 001"), the banking block and the payment note.
  - Never show a separate number.
- **Project line:** e.g. "Off The Clock website project".
- **Line items:** each has a title, a detail, a qty and an amount in ZAR.
  - For splits, state the maths in the detail, e.g. "Solupair's 40% share of the R10,000 deposit received (60/40 split as agreed)."
  - Check the arithmetic before rendering.
- **Date:** defaults to today. **Due:** defaults to "Due on receipt".
- **VAT:** off unless Holiday says Solupair is VAT-registered. Then set `"vat_rate": 0.15`.
- **Banking details:**
  - Get them from Holiday: a screenshot, or a saved `bank.json` outside git.
  - **Never commit banking details, and never guess or reuse ones you can't see.**

## Fixed company details (already in the template)

- Solupair (Pty) Ltd · Reg. 2026/427340/07
- 18 Maple Drive, 15 Candice Glades Estate · info@Solupair.co.za

## Make it

1. Write `invoice.json` in the scratchpad:

```json
{
  "reference": "Off The Clock 001",
  "project": "Off The Clock website project",
  "billed_to": "Mmaki Malepe",
  "date": "6 November 2026",
  "items": [
    { "title": "Off The Clock website: Solupair share of deposit",
      "detail": "Solupair's 40% share of the R10,000 deposit received for the Off The Clock website (60/40 split as agreed).",
      "qty": 1, "amount": 4000 }
  ]
}
```

2. Write `bank.json` (scratchpad only):

```json
{ "account_name": "", "bank": "", "account_type": "", "account_number": "", "branch_code": "", "swift": "" }
```

3. Render:

```bash
node .claude/skills/solupair-invoice/scripts/make_invoice.js invoice.json Solupair-Invoice-<Reference-With-Dashes>.pdf bank.json
```

   This writes the PDF and a `-preview.png` next to it.

4. Look at the preview and check:
   - the reference appears at the top;
   - the totals are right;
   - there is no empty banking row;
   - it is one page.

5. Send the PDF with SendUserFile.
   - Use a **new filename** for every revision (`-v2`), so a cached old copy doesn't show.
   - Don't commit the PDF unless asked: it contains banking details.

## Style rules

- Keep the layout as it is:
  - black header bar with the logo on the left and "INVOICE" on the right;
  - cyan→purple→pink underline;
  - purple (#5a3fe0) section headings;
  - tinted amount-due row and note.
- Amounts are formatted `R4,000.00`.
- No fabricated line items, client details or payments. Only what Holiday supplies.
