package com.robinncode.abmiti

import java.security.MessageDigest
import java.util.Locale

internal data class BankSmsCandidate(
    val id: String,
    val provider: String,
    val amount: Double,
    val type: String,
    val receivedAt: Long,
    val note: String,
) {
    fun toMap(): Map<String, Any> = mapOf(
        "id" to id,
        "provider" to provider,
        "amount" to amount,
        "type" to type,
        "receivedAt" to receivedAt,
        "note" to note,
    )
}

internal object BankSmsParser {
    private val providers = listOf(
        "BKASH" to "bKash",
        "NAGAD" to "Nagad",
        "ROCKET" to "Rocket",
        "SURECASH" to "SureCash",
        "OKWALLET" to "OK Wallet",
        "MCASH" to "mCash",
        "CELLFIN" to "CellFin",
        "NEXUSPAY" to "NexusPay",
        "DBBL" to "Dutch-Bangla Bank",
        "DUTCHBANGLA" to "Dutch-Bangla Bank",
        "BANKASIA" to "Bank Asia",
        "BRACBANK" to "BRAC Bank",
        "CITYBANK" to "City Bank",
        "EASTERNBANK" to "Eastern Bank",
        "ISLAMIBANK" to "Islami Bank",
        "STANDARDCHARTERED" to "Standard Chartered",
        "UPAY" to "upay",
    )

    private val incomingPattern = Regex(
        """\b(received|credited|credit|deposited|deposit|cash[\s-]*in|added|refund|transferred\s*from)\b""",
        RegexOption.IGNORE_CASE,
    )
    private val outgoingPattern = Regex(
        """\b(sent|debited|debit|paid|payment|withdrawn|withdraw|cash[\s-]*out|purchase|transferred\s*to|transfer\s*to|transferred\s*out)\b""",
        RegexOption.IGNORE_CASE,
    )

    // Deposit schemes (DPS/FDR and friends) are tracked as savings rather than
    // plain income/expense, mirroring the ledger's savings entry type.
    private val savingsPattern = Regex(
        """\b(dps|fdr|fixed\s*deposit|recurring\s*deposit|sanchayapatra|savings\s*certificate|pigmy|deposit\s*pension\s*scheme|pension\s*savings)\b""",
        RegexOption.IGNORE_CASE,
    )
    private val investmentPattern = Regex(
        """\b(investment|mutual\s*fund|stock|bond|treasury\s*bill)\b""",
        RegexOption.IGNORE_CASE,
    )

    private val amountPattern = Regex(
        """(?:BDT|Tk\.?|৳)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)|([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:BDT|Tk\.?|৳)""",
        RegexOption.IGNORE_CASE,
    )
    private val excludedAmountContext =
        Regex("""\b(balance|fee|charge|commission|vat|tax)\b""", RegexOption.IGNORE_CASE)

    fun parse(
        sender: String?,
        body: String?,
        receivedAt: Long,
    ): BankSmsCandidate? {
        if (sender.isNullOrBlank() || body.isNullOrBlank()) return null
        val normalizedSender = sender.uppercase(Locale.ROOT).filter(Char::isLetterOrDigit)
        val provider = providers.firstOrNull { normalizedSender.contains(it.first) }?.second
            ?: if (normalizedSender.contains("BANK")) sender else return null

        val directionMatches = listOfNotNull(
            incomingPattern.find(body)?.let { it.range.first to "income" },
            outgoingPattern.find(body)?.let { it.range.first to "expense" },
        )
        val type = when {
            savingsPattern.containsMatchIn(body) -> "savings"
            investmentPattern.containsMatchIn(body) -> "investment"
            else -> directionMatches.minByOrNull { it.first }?.second ?: return null
        }
        val amount = amountPattern.findAll(body).firstNotNullOfOrNull { match ->
            val before = body.substring(0, match.range.first).takeLast(32)
            if (excludedAmountContext.containsMatchIn(before)) return@firstNotNullOfOrNull null
            val rawAmount = match.groups[1]?.value ?: match.groups[2]?.value
            rawAmount?.replace(",", "")?.toDoubleOrNull()?.takeIf { it > 0 }
        } ?: return null

        val digest = MessageDigest.getInstance("SHA-256")
            .digest("$receivedAt|$sender|$amount|$type".toByteArray())
            .joinToString("") { "%02x".format(it) }
        return BankSmsCandidate(
            id = digest,
            provider = provider,
            amount = amount,
            type = type,
            receivedAt = receivedAt,
            note = "$provider SMS transaction",
        )
    }
}
