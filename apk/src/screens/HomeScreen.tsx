// src/screens/HomeScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WEB_APP_URL } from '../core/constants/api';
import { SecureStorage } from '../core/storage/secureStorage';
import { logger } from '../core/utils/logger';

import { buildInjectedScript } from '../webview/injectedJavaScript';
import { handleBridgeMessage } from '../webview/bridge';
import { AppLoader } from '../components/AppLoader';
import { ErrorView } from '../components/ErrorView';
import { OfflineBanner } from '../components/OfflineBanner';
import { AppColors } from '../core/constants/colors';

export const HomeScreen: React.FC = () => {
    const webViewRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    const [token, setToken] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Load token to inject it into WebView
        const loadToken = async () => {
            const t = await SecureStorage.getAccessToken();
            setToken(t);
        };
        loadToken();
    }, []);

    if (!token) {
        return <AppLoader />;
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <OfflineBanner />

            {hasError ? (
                <ErrorView
                    message="Failed to load the application."
                    onRetry={() => {
                        setHasError(false);
                        webViewRef.current?.reload();
                    }}
                />
            ) : (
                <WebView
                    ref={webViewRef}
                    source={{ uri: WEB_APP_URL }}
                    style={[styles.webview, { paddingBottom: insets.bottom }]}

                    // Inject JWT and config before React loads
                    injectedJavaScriptBeforeContentLoaded={buildInjectedScript(token)}

                    // Communicate smoothly
                    onMessage={handleBridgeMessage}

                    // Loading + Error handling
                    startInLoadingState={true}
                    renderLoading={() => <AppLoader fullScreen={true} />}
                    onError={(synthEvent: any) => {
                        logger.error('WebView failed to load', synthEvent.nativeEvent);
                        setHasError(true);
                    }}

                    // Security / Perf options
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    sharedCookiesEnabled={true}
                    pullToRefreshEnabled={true}
                    bounces={true}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppColors.paperMist,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
