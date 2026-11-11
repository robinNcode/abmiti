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
