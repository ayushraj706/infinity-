import React, { useRef, useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { 
    PermissionsAndroid, Platform, ToastAndroid, SafeAreaView, 
    StatusBar, View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator 
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

// Injector ko import kar rahe hain
const INJECTOR_RAW = require('./scripts/instagram-injector.js');

const App = () => {
    const webViewRef = useRef(null);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [downloadHistory, setDownloadHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pixel 8 Pro - Pure Mobile User Agent (Wi-Fi timeout fix ke liye)
    const USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UQ1A.231205.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36';

    // 1. Universal Permissions Fix (Android 10 to 14)
    useEffect(() => {
        const askPermissions = async () => {
            if (Platform.OS === 'android') {
                try {
                    let permissions = [
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    ];

                    // Android 13+ (SDK 33) ke liye media permissions
                    if (Platform.Version >= 33) {
                        permissions = [
                            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                        ];
                    }

                    const granted = await PermissionsAndroid.requestMultiple(permissions);
                    console.log('Permissions Status:', granted);
                } catch (err) {
                    console.warn('Permission Error:', err);
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
                    description: 'Downloaded via Ghost Engine V31',
                    title: fileName,
                },
            }).fetch('GET', url);
            
            setDownloadHistory(prev => [{ id: timestamp.toString(), name: fileName, time: new Date().toLocaleTimeString() }, ...prev]);
            ToastAndroid.show('✓ Saved to Gallery', ToastAndroid.SHORT);
            
            // Media store ko refresh karna
            if (Platform.OS === 'android') {
                RNFetchBlob.fs.scanFile([{ path: downloadPath }]);
            }
            
        } catch (error) {
            ToastAndroid.show('Download failed! Check connection.', ToastAndroid.SHORT);
        }
    };

    const injectedJavaScript = INJECTOR_RAW + "; true;";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Professional Top Bar */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.logoText}>Ghost Engine</Text>
                    <Text style={styles.subText}>V31 Pro Edition</Text>
                </View>
                <TouchableOpacity style={styles.historyBtn} onPress={() => setHistoryVisible(true)}>
                    <Text style={{ fontSize: 22 }}>📥</Text>
                    {downloadHistory.length > 0 && <View style={styles.badge} />}
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: 'https://www.instagram.com' }}
                    userAgent={USER_AGENT}
                    javaScriptEnabled={true}
                    domStorageEnabled={true} 
                    databaseEnabled={true}    
                    mixedContentMode="always" 
                    allowFileAccess={true}
                    thirdPartyCookiesEnabled={true}
                    // Wi-Fi Fix: Hardware acceleration settings
                    androidLayerType="hardware"
                    originWhitelist={['*']}
                    injectedJavaScript={injectedJavaScript}
                    onMessage={handleMessage}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => {
                        setIsLoading(false);
                        webViewRef.current?.injectJavaScript(injectedJavaScript);
                    }}
                    // Network errors handling
                    onHttpError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        if (nativeEvent.statusCode === 404) ToastAndroid.show('Page not found', ToastAndroid.SHORT);
                    }}
                    scalesPageToFit={true}
                />
                
                {isLoading && (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#dc2743" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Loading Instagram...</Text>
                    </View>
                )}
            </View>

            {/* Download History Modal */}
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
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.historyItem}>
                                <View style={styles.fileIcon}><Text>📄</Text></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.fileTime}>{item.time} • Saved in Downloads</Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={{ fontSize: 40, marginBottom: 10 }}>📂</Text>
                                <Text style={{ color: '#999' }}>No downloads in this session.</Text>
                            </View>
                        }
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: { height: 60, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderBottomWidth: 1, borderColor: '#eee', elevation: 2 },
    logoText: { fontSize: 18, fontWeight: 'bold', color: '#dc2743' },
    subText: { fontSize: 10, color: '#999', marginTop: -4, fontWeight: '600' },
    historyBtn: { padding: 8, borderRadius: 12, backgroundColor: '#f8f8f8', position: 'relative' },
    badge: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2743', borderWeight: 1, borderColor: '#fff' },
    loader: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#333' },
    closeBtn: { color: '#dc2743', fontWeight: 'bold', fontSize: 16 },
    historyItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#f5f5f5' },
    fileIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    fileName: { fontSize: 14, fontWeight: '600', color: '#333' },
    fileTime: { fontSize: 11, color: '#999', marginTop: 2 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }
});

export default App;
