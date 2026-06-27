// src/webview/injectedJavaScript.ts
/**
 * Injected into the WebView before content loads to provide the access token.
 * We dispatch a `storage` event in case the React web app relies on it.
 */
export const buildInjectedScript = (token: string) => `
  (function() {
    try {
      localStorage.setItem('accessToken', '${token}');
      window.dispatchEvent(new Event('storage'));
      
      // Inject identifying flag for the web app to know it's in a native shell
      window.isNativeApp = true;
    } catch (e) {
      console.error('Failed to inject React Native config', e);
    }
  })();
  true;
`;
