// App.js (React Native)
import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

const App = () => {
    const webViewRef = useRef(null);
    
    // Desktop User Agent (Critical!)
    const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Handle messages from WebView
    const handleMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.action === 'download') {
                await downloadMedia(data.url, data.type);
            }
        } catch (error) {
            console.error('Message handling error:', error);
        }
    };
    
    // Download function with Gallery support
    const downloadMedia = async (url, type) => {
        try {
            // Request permissions (Android)
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                );
                
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    ToastAndroid.show('Permission denied!', ToastAndroid.SHORT);
                    return;
                }
            }
            
            const { fs } = RNFetchBlob;
            const timestamp = Date.now();
            const ext = type === 'video' ? 'mp4' : 'jpg';
            const fileName = `Instagram_${timestamp}.${ext}`;
            
            // OPTION 1: Save to Gallery (Public - like Vidmate)
            const downloadPath = `${fs.dirs.DownloadDir}/${fileName}`;
            
            // OPTION 2: Save to Private Storage (like PW)
            // const downloadPath = `${fs.dirs.DocumentDir}/${fileName}`;
            
            ToastAndroid.show('Downloading...', ToastAndroid.SHORT);
            
            const response = await RNFetchBlob.config({
                path: downloadPath,
                fileCache: true,
                addAndroidDownloads: {
                    useDownloadManager: true,
                    notification: true,
                    mime: type === 'video' ? 'video/mp4' : 'image/jpeg',
                    description: 'Downloading Instagram media',
                    title: fileName,
                },
            }).fetch('GET', url);
            
            ToastAndroid.show('✓ Downloaded!', ToastAndroid.LONG);
            
            // Trigger MediaScanner to show in Gallery
            RNFetchBlob.fs.scanFile([{ path: downloadPath }]);
            
        } catch (error) {
            console.error('Download error:', error);
            ToastAndroid.show('Download failed!', ToastAndroid.SHORT);
        }
    };
    
    // Inject JavaScript on page load
    const injectedJavaScript = `
        ${require('./instagram-injector.js')}
        true; // Required for injection
    `;
    
    return (
        <WebView
            ref={webViewRef}
            source={{ uri: 'https://www.instagram.com' }}
            userAgent={USER_AGENT}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleMessage}
            onLoadEnd={() => {
                // Re-inject on navigation
                webViewRef.current?.injectJavaScript(injectedJavaScript);
            }}
        />
    );
};

export default App;
