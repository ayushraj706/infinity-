import React, { useRef, useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { 
    PermissionsAndroid, Platform, ToastAndroid, SafeAreaView, 
    StatusBar, View, Text, TouchableOpacity, Modal, FlatList, StyleSheet 
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

// Injector import
const INJECTOR_RAW = require('./scripts/instagram-injector.js');

const App = () => {
    const webViewRef = useRef(null);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [downloadHistory, setDownloadHistory] = useState([]);

    // Pixel 8 Pro User Agent - Isse Instagram asli mobile app jaisa dikhega
    const USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UD1A.230805.019; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.64 Mobile Safari/537.36';

    // 1. Permissions Fix: App khulte hi mangne ke liye
    useEffect(() => {
        const askPermissions = async () => {
            if (Platform.OS === 'android') {
                try {
                    await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    ]);
                } catch (err) {
                    console.warn(err);
                }
            }
        };
        askPermissions();
    }, []);

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
            const { fs } = RNFetchBlob;
            const timestamp = Date.now();
            const ext = type === 'video' ? 'mp4' : 'jpg';
            const fileName = 'Ghost_V31_' + timestamp + '.' + ext;
            const downloadPath = fs.dirs.DownloadDir + '/' + fileName;
            
            ToastAndroid.show('Ghost Engine: Downloading...', ToastAndroid.SHORT);
            
            await RNFetchBlob.config({
                path: downloadPath,
                addAndroidDownloads: {
                    useDownloadManager: true,
                    notification: true,
                    mime: type === 'video' ? 'video/mp4' : 'image/jpeg',
                    description: 'Ghost Engine V31 Download',
                    title: fileName,
                },
            }).fetch('GET', url);
            
            // History mein add karna
            setDownloadHistory(prev => [{ id: timestamp.toString(), name: fileName }, ...prev]);
            
            ToastAndroid.show('✓ Saved in Gallery', ToastAndroid.SHORT);
            RNFetchBlob.fs.scanFile([{ path: downloadPath }]);
            
        } catch (error) {
            ToastAndroid.show('Download failed!', ToastAndroid.SHORT);
        }
    };

    const injectedJavaScript = INJECTOR_RAW + "; true;";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Top Bar / Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>Ghost Engine V31</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => setHistoryVisible(true)}>
                    <Text style={{ fontSize: 20 }}>📥</Text>
                </TouchableOpacity>
            </View>

            {/* Main Browser */}
            <WebView
                ref={webViewRef}
                source={{ uri: 'https://www.instagram.com' }}
                userAgent={USER_AGENT}
                javaScriptEnabled={true}
                domStorageEnabled={true} // Wi-Fi Fix 1
                databaseEnabled={true}    // Wi-Fi Fix 2
                mixedContentMode="always" // Wi-Fi Fix 3
                cacheEnabled={true}
                injectedJavaScript={injectedJavaScript}
                onMessage={handleMessage}
                onLoadEnd={() => {
                    webViewRef.current?.injectJavaScript(injectedJavaScript);
                }}
                scalesPageToFit={true}
                startInLoadingState={true}
            />

            {/* Download Manager Modal */}
            <Modal visible={historyVisible} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Download Manager</Text>
                        <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                            <Text style={styles.closeBtn}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={downloadHistory}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.historyItem}>
                                <Text style={{ fontWeight: '500' }}>{item.name}</Text>
                                <Text style={{ color: 'gray', fontSize: 12 }}>Saved in Downloads folder</Text>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No downloads yet!</Text>}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 55,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        elevation: 4,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc2743',
    },
    historyBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0'
    },
    modalHeader: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    closeBtn: {
        color: 'red',
        fontWeight: 'bold'
    },
    historyItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#f9f9f9'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: 'gray'
    }
});

export default App;
