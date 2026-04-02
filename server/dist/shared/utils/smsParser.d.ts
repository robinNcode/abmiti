import { ISmsParseResult } from '../types';
declare class SmsParserService {
    private readonly parsers;
    constructor();
    parse(sms: string): ISmsParseResult;
}
export declare const smsParserService: SmsParserService;
export {};
//# sourceMappingURL=smsParser.d.ts.map