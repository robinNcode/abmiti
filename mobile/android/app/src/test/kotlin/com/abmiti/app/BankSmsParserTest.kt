package com.robinncode.abmiti

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class BankSmsParserTest {
    @Test
    fun parsesIncomingWalletTransactionWithoutUsingFeeOrBalance() {
        val candidate = BankSmsParser.parse(
            "BKASH",
            "You have received Tk 500.00 from 01XXXXXXXXX. Fee Tk 5.00. Balance Tk 1000.00.",
            1_798_000_000_000,
        )

        assertEquals("bKash", candidate?.provider)
        assertEquals("income", candidate?.type)
        assertEquals(500.0, candidate?.amount ?: 0.0, 0.0)
    }

    @Test
    fun parsesOutgoingBankTransfer() {
        val candidate = BankSmsParser.parse(
            "BANK-ASIA",
            "Your account has been debited BDT 1,234.50. Available balance BDT 10,000.00.",
            1_798_000_000_000,
        )

        assertEquals("Bank Asia", candidate?.provider)
        assertEquals("expense", candidate?.type)
        assertEquals(1234.5, candidate?.amount ?: 0.0, 0.0)
    }

    @Test
    fun parsesOutgoingTransferToAnotherAccount() {
        val candidate = BankSmsParser.parse(
            "BANKASIA",
            "BDT 3000 Has Been Transferred To A/C *********7625. A/C Available Balance BDT 14880.25",
            1_798_000_000_000,
        )

        assertEquals("Bank Asia", candidate?.provider)
        assertEquals("expense", candidate?.type)
        assertEquals(3000.0, candidate?.amount ?: 0.0, 0.0)
    }

    @Test
    fun classifiesDpsInstallmentAsSavings() {
        val candidate = BankSmsParser.parse(
            "BRACBANK",
            "DPS installment of Tk 5,000.00 has been debited from your A/C. Balance Tk 1,000.00.",
            1_798_000_000_000,
        )

        assertEquals("savings", candidate?.type)
        assertEquals(5000.0, candidate?.amount ?: 0.0, 0.0)
    }

    @Test
    fun classifiesFdrCreationAsSavings() {
        val candidate = BankSmsParser.parse(
            "BRACBANK",
            "FDR of Tk 100,000.00 has been created from your A/C. Balance Tk 1,000.00.",
            1_798_000_000_000,
        )

        assertEquals("savings", candidate?.type)
        assertEquals(100000.0, candidate?.amount ?: 0.0, 0.0)
    }

    @Test
    fun classifiesProvidedSampleMessages() {
        val samples = listOf(
            Triple(
                "BANKASIA",
                "BDT 10000 For Transfer Amount and BDT 10 For Charge Has Been Debited. A/C Available Balance BDT 17880.25",
                "expense",
            ),
            Triple(
                "BANKASIA",
                "BDT 3000 Has Been Transferred To A/C *********7625. A/C Available Balance BDT 14880.25",
                "expense",
            ),
            Triple(
                "BRACBANK",
                "TK 10,000.00 credited to A/C#10824**0001 on 09-11-26 @12:12 PM from OTHER BANK. Balance TK 10,013.50. BRAC Bank.",
                "income",
            ),
            Triple(
                "BRACBANK",
                "TK 5,000.00 has been debited from your A/C# 10824**0001 on 09-11-26. Your A/C balance is TK 5,013.50. For enquiry call: 16221",
                "expense",
            ),
            Triple(
                "BKASH",
                "You have received deposit from iBanking of Tk 3,000.00 from Bank Asia Internet Banking. Fee Tk 0.00. Balance Tk 3,008.38. TrxID DK837ZDZO9 at 08/11/2026 17:46",
                "income",
            ),
            Triple(
                "BKASH",
                "Congratulations! You have received Cashback Tk 25.00. Balance Tk 3,033.38. TrxID DK807ZEN8S at 08/11/2026 17:46. Thank you for availing bKash Reward Points.",
                "income",
            ),
            Triple(
                "BKASH",
                "Bill successfully paid. Biller: 01704014601 MMYYYY/Contact: 122026 A/C: 2024031364 Amount: Tk 2,000.00 Fee: Tk 26.00 TrxID: DK837ZHJ1J at 08/11/2026 17:48",
                "expense",
            ),
        )

        samples.forEach { (sender, body, expectedType) ->
            val candidate = BankSmsParser.parse(sender, body, 1_798_000_000_000)
            assertEquals("$sender -> $body", expectedType, candidate?.type)
        }
    }

    @Test
    fun ignoresUnsupportedSendersAndMessagesWithoutDirection() {
        assertNull(
            BankSmsParser.parse(
                "PERSONAL",
                "You received Tk 500.00.",
                1_798_000_000_000,
            ),
        )
        assertNull(
            BankSmsParser.parse(
                "NAGAD",
                "Your balance is Tk 500.00.",
                1_798_000_000_000,
            ),
        )
    }
}
