module.exports = `(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        checkInterval: 1000, 
        buttonClass: 'basekey-download-btn',
        processedClass: 'basekey-processed'
    };
    
    function sendToNative(url, type) {
        const payload = JSON.stringify({
            action: 'download',
            url: url,
            type: type,
            timestamp: Date.now()
        });
        
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(payload);
        }
    }
    
    function createDownloadButton(mediaUrl, mediaType) {
        const btn = document.createElement('button');
        btn.className = CONFIG.buttonClass;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16Z" fill="currentColor"/><path d="M6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 3.99933 18.5493 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.021 19.412 19.413C19.02 19.805 18.5493 20.0007 18 20H6Z" fill="currentColor"/></svg><span>Download</span>';
        
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendToNative(mediaUrl, mediaType);
            btn.innerHTML = '✓ Downloading...';
            setTimeout(() => {
                btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16Z" fill="currentColor"/><path d="M6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 3.99933 18.5493 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.021 19.412 19.413C19.02 19.805 18.5493 20.0007 18 20H6Z" fill="currentColor"/></svg><span>Download</span>';
            }, 2000);
        };
        return btn;
    }
    
    function injectPostButton(article) {
        if (article.classList.contains(CONFIG.processedClass)) return;
        const img = article.querySelector('img[srcset]');
        const video = article.querySelector('video source') || article.querySelector('video');
        if (!img && !video) return;
        
        let mediaUrl, mediaType;
        if (video) {
            mediaUrl = video.src || video.getAttribute('src');
            mediaType = 'video';
        } else if (img) {
            const srcset = img.getAttribute('srcset');
            if (srcset) {
                const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
                mediaUrl = urls[urls.length - 1];
            } else {
                mediaUrl = img.src;
            }
            mediaType = 'image';
        }
        
        if (!mediaUrl) return;
        const actionBar = article.querySelector('section > div');
        if (actionBar && !actionBar.querySelector('.' + CONFIG.buttonClass)) {
            actionBar.appendChild(createDownloadButton(mediaUrl, mediaType));
            article.classList.add(CONFIG.processedClass);
        }
    }
    
    function injectStoryButton() {
        const storyViewer = document.querySelector('section[role="dialog"]');
        if (!storyViewer || storyViewer.classList.contains(CONFIG.processedClass)) return;
        const img = storyViewer.querySelector('img[draggable="false"]');
        const video = storyViewer.querySelector('video');
        let mediaUrl, mediaType;
        if (video) {
            mediaUrl = video.src;
            mediaType = 'video';
        } else if (img) {
            mediaUrl = img.src;
            mediaType = 'image';
        }
        if (!mediaUrl) return;
        const header = storyViewer.querySelector('header');
        if (header && !header.querySelector('.' + CONFIG.buttonClass)) {
            const downloadBtn = createDownloadButton(mediaUrl, mediaType);
            downloadBtn.style.marginLeft = 'auto';
            header.appendChild(downloadBtn);
            storyViewer.classList.add(CONFIG.processedClass);
        }
    }
    
    function injectStyles() {
        if (document.getElementById('ghost-styles')) return;
        const style = document.createElement('style');
        style.id = 'ghost-styles';
        style.textContent = \`
            .\${CONFIG.buttonClass} {
                display: flex; align-items: center; gap: 6px; padding: 6px 12px;
                background: linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045);
                color: white; border: none; border-radius: 6px;
                font-weight: 600; font-size: 12px; cursor: pointer;
                margin-left: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
        \`;
        document.head.appendChild(style);
    }
    
    function init() {
        injectStyles();
        setInterval(() => {
            document.querySelectorAll('article').forEach(injectPostButton);
            injectStoryButton();
        }, CONFIG.checkInterval);
    }
    
    init();
})();\`;
