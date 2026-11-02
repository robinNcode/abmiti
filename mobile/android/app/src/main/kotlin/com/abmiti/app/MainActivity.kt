package com.robinncode.abmiti

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var permissionResult: MethodChannel.Result? = null
    private lateinit var methods: MethodChannel

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        methods = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
        methods.setMethodCallHandler { call, result ->
            val preferences = getSharedPreferences(
                BankSmsReceiver.PREFERENCES,
                MODE_PRIVATE,
            )
            when (call.method) {
                "getStatus" -> result.success(
                    mapOf(
                        "supported" to true,
                        "decisionMade" to preferences.getBoolean(
                            BankSmsReceiver.KEY_DECISION_MADE,
                            false,
                        ),
                        "enabled" to (
                            preferences.getBoolean(BankSmsReceiver.KEY_ENABLED, false) &&
                                preferences.getBoolean(BankSmsReceiver.KEY_CONSENTED, false) &&
                                hasSmsPermission()
                            ),
                        "permissionGranted" to hasSmsPermission(),
                    ),
                )
                "recordConsent" -> {
                    val enabled = call.argument<Boolean>("enabled") ?: false
                    preferences.edit()
                        .putBoolean(BankSmsReceiver.KEY_DECISION_MADE, true)
                        .putBoolean(BankSmsReceiver.KEY_CONSENTED, enabled)
                        .apply()
                    if (!enabled) {
                        preferences.edit()
                            .putBoolean(BankSmsReceiver.KEY_ENABLED, false)
                            .remove(BankSmsReceiver.KEY_PENDING)
                            .apply()
                    }
                    result.success(null)
                }
                "requestPermission" -> {
                    if (!preferences.getBoolean(BankSmsReceiver.KEY_CONSENTED, false)) {
                        result.success(false)
                    } else if (hasSmsPermission()) {
                        result.success(true)
                    } else if (permissionResult != null) {
                        result.error("permission_in_progress", "SMS permission request is already in progress.", null)
                    } else {
                        permissionResult = result
                        ActivityCompat.requestPermissions(
                            this,
                            arrayOf(Manifest.permission.RECEIVE_SMS),
                            SMS_PERMISSION_REQUEST,
                        )
                    }
                }
                "setEnabled" -> {
                    val enabled = call.argument<Boolean>("enabled") ?: false
                    val permitted = !enabled || (
                        hasSmsPermission() &&
                            preferences.getBoolean(BankSmsReceiver.KEY_CONSENTED, false)
                        )
                    if (permitted) {
                        val editor = preferences.edit()
                            .putBoolean(BankSmsReceiver.KEY_ENABLED, enabled)
                        if (!enabled) editor.remove(BankSmsReceiver.KEY_PENDING)
                        editor.apply()
                    }
                    result.success(permitted)
                }
                "consumePendingCandidates" -> {
                    result.success(SmsParserStore.consume(this))
                }
                else -> result.notImplemented()
            }
        }

        EventChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            EVENT_CHANNEL,
        ).setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                SmsParserStore.eventSink = events
            }

            override fun onCancel(arguments: Any?) {
                SmsParserStore.eventSink = null
            }
        })
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != SMS_PERMISSION_REQUEST) return
        val granted = grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
        permissionResult?.success(granted)
        permissionResult = null
    }

    private fun hasSmsPermission(): Boolean =
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECEIVE_SMS,
        ) == PackageManager.PERMISSION_GRANTED

    companion object {
        private const val CHANNEL = "com.abmiti/sms_parser"
        private const val EVENT_CHANNEL = "com.abmiti/sms_parser/events"
        private const val SMS_PERMISSION_REQUEST = 7021
    }
}
