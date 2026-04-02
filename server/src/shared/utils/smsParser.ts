import { ISmsParser, ISmsParseResult, PaymentSource } from '../types';

// ── Concrete Parsers ─────────────────────────────────────────

class BankCreditParser implements ISmsParser {
  canParse(sms: string): boolean {
    return /credited/i.test(sms) && /BDT/i.test(sms);
  }

  parse(sms: string): ISmsParseResult {
    // Amount: "BDT- 47500" or "BDT 47,500" or "BDT47500"
    const amtMatch =
      sms.match(/BDT[-\s]*([0-9,]+(?:\.[0-9]+)?)\s*Credited/i) ||
      sms.match(/Credited.*?BDT[-\s]*([0-9,]+(?:\.[0-9]+)?)/i) ||
      sms.match(/BDT[-\s]*([0-9,]+(?:\.[0-9]+)?)/i);

    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null;

    // Date: "09/03/2026"
    const dateMatch = sms.match(/on[:\s]+(\d{2}\/\d{2}\/\d{4})/i);
    let date: string | undefined;
    if (dateMatch) {
      const [d, m, y] = dateMatch[1].split('/');
      date = `${y}-${m}-${d}`;
    }

    // Bank name
    const bankMatch = sms.match(
      /(BANK ASIA|DUTCH.BANGLA|DBBL|BRAC BANK|BKASH|ISLAMI BANK|IFIC|ONE BANK|AB BANK|PREMIER|SOUTHEAST|TRUST|MUTUAL TRUST|MTB|CITY BANK|STANDARD CHARTERED|SCB|HSBC|PRIME BANK|UTTARA|MERCANTILE|JAMUNA|NRB|MODHUMOTI)/i,
    );
    const bank = bankMatch ? bankMatch[1].toUpperCase() : undefined;

    // Account number (masked)
    const acMatch = sms.match(/A\/C#?\s*([0-9*]+)/i);

    return {
      amount,
      source: 'bank',
      bank,
      date,
      reference: acMatch ? `A/C: ${acMatch[1]}` : undefined,
      accountNumber: acMatch?.[1],
      confidence: amount ? 'high' : 'low',
    };
  }
}

class BkashParser implements ISmsParser {
  canParse(sms: string): boolean {
    return /bkash/i.test(sms);
  }

  parse(sms: string): ISmsParseResult {
    // Cash In: "You have received Tk 500 from 01XXXXXXXXX"
    // or "bKash Transaction ID:ABC123 Tk 500.00 received"
    const amtMatch =
      sms.match(/Tk\.?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:received|cash in)/i) ||
      sms.match(/(?:received|cash in).*?Tk\.?\s*([0-9,]+(?:\.[0-9]+)?)/i) ||
      sms.match(/Tk\.?\s*([0-9,]+(?:\.[0-9]+)?)/i);

    const txMatch = sms.match(/(?:TxnID|Transaction ID|TrxID)[:\s]+([A-Z0-9]+)/i);
    const dateMatch = sms.match(/(\d{2}\/\d{2}\/\d{4})/);
    let date: string | undefined;
    if (dateMatch) {
      const [d, m, y] = dateMatch[1].split('/');
      date = `${y}-${m}-${d}`;
    }

    return {
      amount: amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null,
      source: 'bkash',
      bank: 'bKash',
      date,
      reference: txMatch ? `TxnID: ${txMatch[1]}` : 'bKash Cash In',
      confidence: amtMatch ? 'high' : 'low',
    };
  }
}

class NagadParser implements ISmsParser {
  canParse(sms: string): boolean {
    return /nagad/i.test(sms);
  }

  parse(sms: string): ISmsParseResult {
    const amtMatch =
      sms.match(/(?:Tk|BDT)\.?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:received|cash in)/i) ||
      sms.match(/([0-9,]+(?:\.[0-9]+)?)\s*(?:Tk|Taka).*nagad/i) ||
      sms.match(/nagad.*?([0-9,]+(?:\.[0-9]+)?)\s*(?:Tk|Taka)/i);

    const txMatch = sms.match(/(?:TxnID|ref)[:\s]+([A-Z0-9]+)/i);

    return {
      amount: amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null,
      source: 'nagad',
      bank: 'Nagad',
      reference: txMatch ? `Ref: ${txMatch[1]}` : 'Nagad Cash In',
      confidence: amtMatch ? 'high' : 'low',
    };
  }
}

class GenericAmountParser implements ISmsParser {
  canParse(_sms: string): boolean {
    return true; // fallback — always can try
  }

  parse(sms: string): ISmsParseResult {
    const amtMatch = sms.match(/([0-9]{3,}(?:\.[0-9]+)?)/);
    return {
      amount: amtMatch ? parseFloat(amtMatch[1]) : null,
      source: 'other' as PaymentSource,
      confidence: 'low',
    };
  }
}

// ── SMS Parser Service (orchestrator) ───────────────────────
class SmsParserService {
  private readonly parsers: ISmsParser[];

  constructor() {
    // Order matters — most specific first
    this.parsers = [
      new BkashParser(),
      new NagadParser(),
      new BankCreditParser(),
      new GenericAmountParser(),
    ];
  }

  parse(sms: string): ISmsParseResult {
    const trimmed = sms.trim();
    for (const parser of this.parsers) {
      if (parser.canParse(trimmed)) {
        const result = parser.parse(trimmed);
        if (result.amount !== null) return result;
      }
    }
    return { amount: null, source: 'other', confidence: 'low' };
  }
}

export const smsParserService = new SmsParserService();
