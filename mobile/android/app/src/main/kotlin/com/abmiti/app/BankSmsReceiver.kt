package com.robinncode.abmiti

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

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
        val preferences =
            context.getSharedPreferences(BankSmsReceiver.PREFERENCES, Context.MODE_PRIVATE)
        synchronized(this) {
            val pending = mutableListOf<BankSmsCandidate>()
            val stored = preferences.getString(BankSmsReceiver.KEY_PENDING, null)
            if (stored != null) {
                val array = org.json.JSONArray(stored)
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
            }
            if (pending.any { it.id == candidate.id }) return
            pending.add(candidate)
            val array = org.json.JSONArray()
            pending.takeLast(MAX_PENDING_CANDIDATES).forEach { item ->
                array.put(org.json.JSONObject(item.toMap()))
            }
            preferences.edit().putString(BankSmsReceiver.KEY_PENDING, array.toString()).apply()
        }
        eventSink?.success(null)
    }

    fun consume(context: Context): List<Map<String, Any>> {
        val preferences =
            context.getSharedPreferences(BankSmsReceiver.PREFERENCES, Context.MODE_PRIVATE)
        synchronized(this) {
            val stored = preferences.getString(BankSmsReceiver.KEY_PENDING, null)
                ?: return emptyList()
            preferences.edit().remove(BankSmsReceiver.KEY_PENDING).apply()
            val array = org.json.JSONArray(stored)
            return (0 until array.length()).mapNotNull { index ->
                val json = array.optJSONObject(index) ?: return@mapNotNull null
                val candidate = mapOf(
                    "id" to json.optString("id"),
                    "provider" to json.optString("provider"),
                    "amount" to json.optDouble("amount"),
                    "type" to json.optString("type"),
                    "receivedAt" to json.optLong("receivedAt"),
                    "note" to json.optString("note"),
                )
                candidate
            }
        }
    }
}
