import 'package:flutter/material.dart';

import '../../core/localization/app_locale.dart';

Future<bool> showSmsParserConsentDialog(BuildContext context) async {
  final loc = context.appLocale;
  return await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: Text(loc.tr('sms_consent_title')),
          content: Text(loc.tr('sms_consent_message')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(loc.tr('sms_consent_decline')),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(loc.tr('sms_consent_enable')),
            ),
          ],
        ),
      ) ??
      false;
}
