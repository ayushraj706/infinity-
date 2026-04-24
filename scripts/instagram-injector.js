// instagram-injector.js
(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        checkInterval: 1000, // Check for new posts every 1 second
        buttonClass: 'basekey-download-btn',
        processedClass: 'basekey-processed'
    };
    
    // Utility: Send URL to React Native
    function sendToNative(url, type) {
        const payload = JSON.stringify({
            action: 'download',
            url: url,
            type: type, // 'image' or 'video'
            timestamp: Date.now()
        });
        
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(payload);
        } else {
            console.error('Native bridge not found!');
        }
    }
    
    // Create Download Button
    function createDownloadButton(mediaUrl, mediaType) {
        const btn = document.createElement('button');
        btn.className = CONFIG.buttonClass;
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16Z" fill="currentColor"/>
                <path d="M6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 3.99933 18.5493 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.021 19.412 19.413C19.02 19.805 18.5493 20.0007 18 20H6Z" fill="currentColor"/>
            </svg>
            <span>Download</span>
        `;
        
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendToNative(mediaUrl, mediaType);
            
            // Visual feedback
            btn.innerHTML = '✓ Downloading...';
            setTimeout(() => {
                btn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16Z" fill="currentColor"/>
                        <path d="M6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 3.99933 18.5493 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.021 19.412 19.413C19.02 19.805 18.5493 20.0007 18 20H6Z" fill="currentColor"/>
                    </svg>
                    <span>Download</span>
                `;
            }, 2000);
        };
        
        return btn;
    }
    
    // Inject button for Feed Posts
    function injectPostButton(article) {
        if (article.classList.contains(CONFIG.processedClass)) return;
        
        // Find media element
        const img = article.querySelector('img[srcset]');
        const video = article.querySelector('video source');
        
        if (!img && !video) return;
        
        let mediaUrl, mediaType;
        
        if (video) {
            mediaUrl = video.getAttribute('src');
            mediaType = 'video';
        } else if (img) {
            // Get highest quality image from srcset
            const srcset = img.getAttribute('srcset');
            if (srcset) {
                const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
                mediaUrl = urls[urls.length - 1]; // Last URL is usually highest quality
            } else {
                mediaUrl = img.src;
            }
            mediaType = 'image';
        }
        
        if (!mediaUrl) return;
        
        // Find action bar (Like, Comment, Share section)
        const actionBar = article.querySelector('section > div');
        
        if (actionBar && !actionBar.querySelector(`.${CONFIG.buttonClass}`)) {
            const downloadBtn = createDownloadButton(mediaUrl, mediaType);
            actionBar.appendChild(downloadBtn);
            article.classList.add(CONFIG.processedClass);
        }
    }
    
    // Inject button for Stories
    function injectStoryButton() {
        const storyViewer = document.querySelector('section[role="dialog"]');
        if (!storyViewer) return;
        
        const processed = storyViewer.classList.contains(CONFIG.processedClass);
        if (processed) return;
        
        // Find media
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
        
        // Find header section
        const header = storyViewer.querySelector('header');
        
        if (header && !header.querySelector(`.${CONFIG.buttonClass}`)) {
            const downloadBtn = createDownloadButton(mediaUrl, mediaType);
            downloadBtn.style.marginLeft = 'auto';
            header.appendChild(downloadBtn);
            storyViewer.classList.add(CONFIG.processedClass);
        }
    }
    
    // Observer for dynamic content
    function observeDOM() {
        // Process existing posts
        document.querySelectorAll('article').forEach(injectPostButton);
        
        // Check for stories
        injectStoryButton();
        
        // Watch for new content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's a post
                        if (node.tagName === 'ARTICLE') {
                            injectPostButton(node);
                        }
                        // Check for story viewer
                        if (node.matches && node.matches('section[role="dialog"]')) {
                            setTimeout(injectStoryButton, 500);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Add CSS Styles
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .${CONFIG.buttonClass} {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                margin-left: 12px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(131, 58, 180, 0.3);
            }
            
            .${CONFIG.buttonClass}:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(131, 58, 180, 0.5);
            }
            
            .${CONFIG.buttonClass}:active {
                transform: translateY(0);
            }
            
            .${CONFIG.buttonClass} svg {
                width: 20px;
                height: 20px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize
    function init() {
        injectStyles();
        
        // Wait for Instagram to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeDOM);
        } else {
            observeDOM();
        }
        
        // Periodic check for new content
        setInterval(() => {
            document.querySelectorAll('article').forEach(injectPostButton);
            injectStoryButton();
        }, CONFIG.checkInterval);
    }
    
    init();
})();
