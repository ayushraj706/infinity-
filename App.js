import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { PermissionsAndroid, Platform, ToastAndroid, SafeAreaView, StatusBar } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

// Injector code ko import kar rahe hain (Dhyan rahe ki injector file me module.exports ho)
const INJECTOR_RAW = require('./scripts/instagram-injector.js');

const App = () => {
    const webViewRef = useRef(null);
    
    const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const handleMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.action === 'download') {
                await downloadMedia(data.url, data.type);
            }
        } catch (error) {
            console.log('Bridge Error:', error);
        }
    };

    const downloadMedia = async (url, type) => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                );
                
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    ToastAndroid.show('Permission denied! Check settings.', ToastAndroid.SHORT);
                    return;
                }
            }
            
            const { fs } = RNFetchBlob;
            const timestamp = Date.now();
            const ext = type === 'video' ? 'mp4' : 'jpg';
            const fileName = `Ghost_V31_${timestamp}.${ext}`;
            const downloadPath = `${fs.dirs.DownloadDir}/${fileName}`;
            
            ToastAndroid.show('Ghost Engine: Downloading...', ToastAndroid.SHORT);
            
            await RNFetchBlob.config({
                path: downloadPath,
                addAndroidDownloads: {
                    useDownloadManager: true,
                    notification: true,
                    mime: type === 'video' ? 'video/mp4' : 'image/jpeg',
                    description: 'Downloaded by Ghost Engine V31',
                    title: fileName,
                },
            }).fetch('GET', url);
            
            ToastAndroid.show('✓ Media Saved in Gallery', ToastAndroid.LONG);
            RNFetchBlob.fs.scanFile([{ path: downloadPath }]);
            
        } catch (error) {
            ToastAndroid.show('Download failed!', ToastAndroid.SHORT);
        }
    };

    // Yahan hum ensure kar rahe hain ki injector string format mein ho
    const injectedJavaScript = `
        (function() {
            ${typeof INJECTOR_RAW === 'string' ? INJECTOR_RAW : 'console.log("Injector Load Failed");'}
        })();
        true;
    `;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="dark-content" />
            <WebView
                ref={webViewRef}
                source={{ uri: 'https://www.instagram.com' }}
                userAgent={USER_AGENT}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                injectedJavaScript={injectedJavaScript}
                onMessage={handleMessage}
                onLoadEnd={() => {
                    webViewRef.current?.injectJavaScript(injectedJavaScript);
                }}
                // Mobile layout issues fix karne ke liye
                scalesPageToFit={true}
                mixedContentMode="always"
            />
        </SafeAreaView>
    );
};

export default App;
