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

internal object SmsParserStore {
    private const val MAX_PENDING_CANDIDATES = 25

    @Volatile
    var eventSink: io.flutter.plugin.common.EventChannel.EventSink? = null

    fun enqueue(context: Context, candidate: BankSmsCandidate) {
        val preferences = preferences(context)
        synchronized(this) {
            val pending = readAll(preferences).toMutableList()
            if (pending.any { it.id == candidate.id }) return
            pending.add(candidate)
            // Only today's detections are surfaced, so drop anything older.
            write(preferences, pending.filter { isToday(it.receivedAt) })
        }
        eventSink?.success(null)
    }

    /**
     * Returns the stored suggestions without removing them, so the dashboard can
     * keep showing them until the user confirms or ignores each one.
     */
    fun getAll(context: Context): List<Map<String, Any>> {
        val preferences = preferences(context)
        synchronized(this) {
            val pending = readAll(preferences)
            val today = pending.filter { isToday(it.receivedAt) }
            if (today.size != pending.size) write(preferences, today)
            return today.map { it.toMap() }
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
}
