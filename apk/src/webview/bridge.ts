// src/webview/bridge.ts
import { useAuthStore } from '../store/authStore';
import { logger } from '../core/utils/logger';

export interface WebViewMessageEvent {
    nativeEvent: {
        data: string;
    };
}

/**
 * Handles messages posted from the web app back into the React Native context.
 */
export const handleBridgeMessage = (event: WebViewMessageEvent) => {
    try {
        const message = JSON.parse(event.nativeEvent.data);
        const { type, payload } = message;

        switch (type) {
            case 'LOGOUT':
                logger.info('Received LOGOUT from web app');
                useAuthStore.getState().logout();
                break;

            case 'OPEN_CAMERA':
                logger.info('Action: OPEN_CAMERA');
                // Implement native camera
                break;

            case 'OPEN_FILE_PICKER':
                logger.info('Action: OPEN_FILE_PICKER');
                // Implement native file picker
                break;

            case 'SHARE':
                logger.info('Action: SHARE', payload);
                // Implement native share sheet
                break;

            case 'DOWNLOAD_FILE':
                logger.info('Action: DOWNLOAD_FILE', payload);
                // Implement native file download
                break;

            case 'REQUEST_PUSH':
                logger.info('Action: REQUEST_PUSH');
                // Implement push permissions
                break;

            default:
                logger.warn('Unknown bridge message type', type);
        }
    } catch (error) {
        logger.error('Failed to parse bridge message', error);
    }
};
