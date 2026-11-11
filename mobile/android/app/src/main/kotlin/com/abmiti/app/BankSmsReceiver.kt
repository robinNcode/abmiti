package com.robinncode.abmiti

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Telephony
import java.util.Calendar

internal class BankSmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
        if (!preferences.getBoolean(KEY_ENABLED, false)) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val sender = messages.firstOrNull()?.displayOriginatingAddress
        val body = messages.joinToString(separator = "") { it.displayMessageBody.orEmpty() }
        val receivedAt = messages.maxOfOrNull { it.timestampMillis } ?: System.currentTimeMillis()
        val candidate = BankSmsParser.parse(sender, body, receivedAt) ?: return

        SmsParserStore.enqueue(context, candidate)
    }

    companion object {
        const val PREFERENCES = "abmiti_sms_parser"
        const val KEY_ENABLED = "enabled"
        const val KEY_DECISION_MADE = "decision_made"
        const val KEY_CONSENTED = "consented"
        const val KEY_PENDING = "pending_candidates"
    }
}

// TEMP TEST DATA — remove together with `SmsParserStore.seedTestMessages`.
// Fixed times keep the generated candidate ids stable within a calendar day,
// so relaunching the app re-seeds the same items instead of piling up copies.
private data class SmsSeedSample(
    val daysAgo: Int,
    val hour: Int,
    val minute: Int,
    val sender: String,
    val body: String,
)

internal object SmsParserStore {
    private const val MAX_PENDING_CANDIDATES = 200
    private const val RETENTION_DAYS = 30

    @Volatile
    var eventSink: io.flutter.plugin.common.EventChannel.EventSink? = null

    fun enqueue(context: Context, candidate: BankSmsCandidate) {
        val preferences = preferences(context)
        synchronized(this) {
            val pending = readAll(preferences).toMutableList()
            if (pending.any { it.id == candidate.id }) return
            pending.add(candidate)
            // Keep a rolling window of detections so the SMS Entry screen can
            // show them grouped by date; anything older is dropped.
            write(preferences, pending.filter { isWithinRetention(it.receivedAt) })
        }
        eventSink?.success(null)
    }

    /**
     * Returns every retained suggestion without removing them, so the dashboard
     * and the SMS Entry screen can keep showing them until the user confirms or
     * ignores each one.
     */
    fun getAll(context: Context): List<Map<String, Any>> {
        val preferences = preferences(context)
        synchronized(this) {
            val pending = readAll(preferences)
            val retained = pending.filter { isWithinRetention(it.receivedAt) }
            if (retained.size != pending.size) write(preferences, retained)
            return retained.map { it.toMap() }
        }
    }

    fun remove(context: Context, ids: Collection<String>) {
        if (ids.isEmpty()) return
        val preferences = preferences(context)
        synchronized(this) {
            val remaining = readAll(preferences).filterNot { ids.contains(it.id) }
            write(preferences, remaining)
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // TEMP TEST DATA — DELETE THIS FUNCTION (and its MainActivity handler and
    // the Dart `seedTestMessages`/`seedTestData` calls) once SMS parsing has
    // been verified. Feeds the sample messages through the real parser, spread
    // across a few days so both the dashboard (today) and the date-wise SMS
    // Entry screen have content.
    fun seedTestMessages(context: Context) {
        val samples = listOf(
            SmsSeedSample(0, 9, 0, "BANKASIA", "BDT 10000 For Transfer Amount and BDT 10 For Charge Has Been Debited. A/C Available Balance BDT 17880.25"),
            SmsSeedSample(0, 9, 5, "BANKASIA", "BDT 3000 Has Been Transferred To A/C *********7625. A/C Available Balance BDT 14880.25"),
            SmsSeedSample(0, 12, 12, "BRACBANK", "TK 10,000.00 credited to A/C#10824**0001 on 09-11-26 @12:12 PM from OTHER BANK. Balance TK 10,013.50. BRAC Bank."),
            SmsSeedSample(0, 14, 30, "BRACBANK", "TK 5,000.00 has been debited from your A/C# 10824**0001 on 09-11-26. Your A/C balance is TK 5,013.50. For enquiry call: 16221"),
            SmsSeedSample(1, 10, 15, "BKASH", "You have received deposit from iBanking of Tk 3,000.00 from Bank Asia Internet Banking. Fee Tk 0.00. Balance Tk 3,008.38. TrxID DK837ZDZO9 at 08/11/2026 17:46"),
            SmsSeedSample(1, 10, 16, "BKASH", "Congratulations! You have received Cashback Tk 25.00. Balance Tk 3,033.38. TrxID DK807ZEN8S at 08/11/2026 17:46. Thank you for availing bKash Reward Points."),
            SmsSeedSample(2, 17, 48, "BKASH", "Bill successfully paid. Biller: 01704014601 MMYYYY/Contact: 122026 A/C: 2024031364 Amount: Tk 2,000.00 Fee: Tk 26.00 TrxID: DK837ZHJ1J at 08/11/2026 17:48"),
            SmsSeedSample(2, 11, 0, "BRACBANK", "DPS installment of Tk 5,000.00 has been debited from your A/C# 10824**0001. Balance Tk 13.50."),
            SmsSeedSample(2, 15, 30, "BRACBANK", "FDR of Tk 100,000.00 has been created from your A/C# 10824**0001. Balance Tk 1,000.00."),
        )
        val midnight = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        samples.forEach { sample ->
            val receivedAt = (midnight.clone() as Calendar).apply {
                add(Calendar.DAY_OF_YEAR, -sample.daysAgo)
                set(Calendar.HOUR_OF_DAY, sample.hour)
                set(Calendar.MINUTE, sample.minute)
            }.timeInMillis
            val candidate =
                BankSmsParser.parse(sample.sender, sample.body, receivedAt) ?: return@forEach
            enqueue(context, candidate)
        }
    }

    /** Legacy drain-style API kept for backwards compatibility. */
    fun consume(context: Context): List<Map<String, Any>> {
        val preferences = preferences(context)
        synchronized(this) {
            val pending = readAll(preferences).filter { isToday(it.receivedAt) }
            write(preferences, emptyList())
            return pending.map { it.toMap() }
        }
    }

    private fun preferences(context: Context): SharedPreferences =
        context.getSharedPreferences(BankSmsReceiver.PREFERENCES, Context.MODE_PRIVATE)

    private fun readAll(preferences: SharedPreferences): List<BankSmsCandidate> {
        val stored = preferences.getString(BankSmsReceiver.KEY_PENDING, null)
            ?: return emptyList()
        val array = org.json.JSONArray(stored)
        val pending = mutableListOf<BankSmsCandidate>()
        for (index in 0 until array.length()) {
            val json = array.optJSONObject(index) ?: continue
            pending.add(
                BankSmsCandidate(
                    id = json.optString("id"),
                    provider = json.optString("provider"),
                    amount = json.optDouble("amount"),
                    type = json.optString("type"),
                    receivedAt = json.optLong("receivedAt"),
                    note = json.optString("note"),
                ),
            )
        }
        return pending
    }

    private fun write(preferences: SharedPreferences, candidates: List<BankSmsCandidate>) {
        if (candidates.isEmpty()) {
            preferences.edit().remove(BankSmsReceiver.KEY_PENDING).apply()
            return
        }
        val array = org.json.JSONArray()
        candidates.takeLast(MAX_PENDING_CANDIDATES).forEach { item ->
            array.put(org.json.JSONObject(item.toMap()))
        }
        preferences.edit().putString(BankSmsReceiver.KEY_PENDING, array.toString()).apply()
    }

    private fun isToday(millis: Long): Boolean {
        if (millis <= 0L) return false
        val now = Calendar.getInstance()
        val then = Calendar.getInstance().apply { timeInMillis = millis }
        return now.get(Calendar.YEAR) == then.get(Calendar.YEAR) &&
            now.get(Calendar.DAY_OF_YEAR) == then.get(Calendar.DAY_OF_YEAR)
    }

    private fun isWithinRetention(millis: Long): Boolean {
        if (millis <= 0L) return false
        val cutoff = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, -(RETENTION_DAYS - 1))
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        return millis >= cutoff
    }
}
