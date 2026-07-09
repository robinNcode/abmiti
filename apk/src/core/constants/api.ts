import { Platform } from 'react-native';

// Production URL – update this to your live server URL before building APK
const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://abmiti.voltwavebd.com/api/v1';

function normalizeApiBaseUrl(url: string) {
  if (Platform.OS === 'android' && url.includes('localhost')) {
    return url.replace('localhost', '10.0.2.2');
  }
  return url;
}

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);

// The web app loaded inside the WebView home screen
export const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? 'https://voltwavebd.com/abmiti';
