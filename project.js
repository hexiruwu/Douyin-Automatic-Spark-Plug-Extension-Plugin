
// ==UserScript==
// @name         抖音自动续火花 (增强错误报告版)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  自动给抖音指定联系人发送私信，保持互动（续火花）- 增强版错误报告功能
// @author       Copilot + Enhanced Error Reporting
// @match        https://www.douyin.com/*
// @icon         https://www.douyin.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ====== 配置区 ======
    // 联系人昵称（与抖音私信列表显示一致）
    const CONTACTS = ["HH", "联系人2"];
    // 要发送的消息内容
    const MESSAGE = "[自动程序发送]续火花咯！";

    // 每次发送的间隔（毫秒）
    const INTERVAL = 1000 * 60 * 60 * 24; // 24小时
    // 每次操作前的等待时间（毫秒）
    const WAIT = 2000;

    // ====== 触发模式配置 ======
    // true: 启用定时自动触发；false: 仅手动触发
    const ENABLE_AUTO = true;
    // 定时触发时间（24小时制，格式："HH:MM"，如 "09:00"）
    const SCHEDULE_TIME = "09:00";

    // ====== 错误报告系统 ======
    class ErrorReporter {
        constructor() {
            this.errors = [];
            this.logLevel = 'INFO'; // DEBUG, INFO, WARN, ERROR
            this.maxErrors = 100;
            this.initErrorDisplay();
        }

        log(level, message, error = null) {
            const timestamp = new Date().toISOString();
            const errorEntry = {
                timestamp,
                level,
                message,
                error: error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : null,
                url: window.location.href
            };
            
            this.errors.push(errorEntry);
            if (this.errors.length > this.maxErrors) {
                this.errors.shift();
            }
            
            // 控制台输出
            const logMethod = console[level.toLowerCase()] || console.log;
            logMethod(`[续火花-${level}] ${message}`, error);
            
            // 更新错误显示
            this.updateErrorDisplay();
            
            // 严重错误时显示通知
            if (level === 'ERROR') {
                this.showErrorNotification(message, error);
            }
        }

        debug(message, error = null) { this.log('DEBUG', message, error); }
        info(message, error = null) { this.log('INFO', message, error); }
        warn(message, error = null) { this.log('WARN', message, error); }
        error(message, error = null) { this.log('ERROR', message, error); }

        initErrorDisplay() {
            const errorPanelId = "douyin-fire-error-panel";
            if (document.getElementById(errorPanelId)) return;
            
            const panel = document.createElement("div");
            panel.id = errorPanelId;
            panel.style.cssText = `
                position: fixed;
                top: 120px;
                right: 30px;
                width: 300px;
                max-height: 400px;
                background: rgba(0,0,0,0.9);
                color: #fff;
                border-radius: 8px;
                padding: 10px;
                z-index: 10000;
                font-size: 12px;
                overflow-y: auto;
                display: none;
                font-family: monospace;
            `;
            
            const header = document.createElement("div");
            header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;";
            header.innerHTML = `
                <span>🐛 续火花错误日志</span>
                <div>
                    <button id="toggle-errors" style="background: #ff2c55; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; margin-right: 5px;">清空</button>
                    <button id="close-errors" style="background: #666; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer;">×</button>
                </div>
            `;
            
            const content = document.createElement("div");
            content.id = "error-content";
            content.style.cssText = "max-height: 300px; overflow-y: auto;";
            
            panel.appendChild(header);
            panel.appendChild(content);
            document.body.appendChild(panel);
            
            // 绑定事件
            document.getElementById("close-errors").onclick = () => panel.style.display = "none";
            document.getElementById("toggle-errors").onclick = () => {
                this.errors = [];
                this.updateErrorDisplay();
            };
        }

        updateErrorDisplay() {
            const content = document.getElementById("error-content");
            if (!content) return;
            
            const recentErrors = this.errors.slice(-20).reverse();
            content.innerHTML = recentErrors.map(err => `
                <div style="margin-bottom: 8px; padding: 5px; border-left: 3px solid ${this.getLevelColor(err.level)}; background: rgba(255,255,255,0.05);">
                    <div style="font-weight: bold; color: ${this.getLevelColor(err.level)};">[${err.level}] ${err.timestamp.split('T')[1].split('.')[0]}</div>
                    <div style="margin: 2px 0;">${err.message}</div>
                    ${err.error ? `<div style="color: #ff6b6b; font-size: 10px;">错误: ${err.error.message}</div>` : ''}
                </div>
            `).join('') || '<div style="color: #888;">暂无错误日志</div>';
        }

        getLevelColor(level) {
            const colors = {
                'DEBUG': '#888',
                'INFO': '#4ade80',
                'WARN': '#fbbf24',
                'ERROR': '#ef4444'
            };
            return colors[level] || '#fff';
        }

        showErrorNotification(message, error = null) {
            // 创建临时错误通知
            const notification = document.createElement("div");
            notification.style.cssText = `
                position: fixed;
                top: 50px;
                right: 30px;
                background: #ef4444;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10001;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            notification.innerHTML = `
                <div style="font-weight: bold;">❌ 续火花执行失败</div>
                <div style="margin-top: 5px; font-size: 13px;">${message}</div>
                ${error ? `<div style="margin-top: 5px; font-size: 11px; opacity: 0.8;">详情: ${error.message}</div>` : ''}
            `;
            
            document.body.appendChild(notification);
            
            // 3秒后自动消失
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }

        showErrorPanel() {
            const panel = document.getElementById("douyin-fire-error-panel");
            if (panel) {
                panel.style.display = panel.style.display === "none" ? "block" : "none";
            }
        }

        validateConfig() {
            const errors = [];
            
            if (!Array.isArray(CONTACTS) || CONTACTS.length === 0) {
                errors.push("CONTACTS 配置错误: 必须是非空数组");
            }
            
            if (typeof MESSAGE !== 'string' || MESSAGE.trim().length === 0) {
                errors.push("MESSAGE 配置错误: 必须是非空字符串");
            }
            
            if (typeof INTERVAL !== 'number' || INTERVAL < 1000) {
                errors.push("INTERVAL 配置错误: 必须是大于1000的数字");
            }
            
            if (typeof WAIT !== 'number' || WAIT < 100) {
                errors.push("WAIT 配置错误: 必须是大于100的数字");
            }
            
            if (!/^\d{2}:\d{2}$/.test(SCHEDULE_TIME)) {
                errors.push("SCHEDULE_TIME 配置错误: 格式必须为 HH:MM");
            }
            
            if (errors.length > 0) {
                this.error("配置验证失败", new Error(errors.join('; ')));
                return false;
            }
            
            this.info("配置验证通过");
            return true;
        }

        getErrorSummary() {
            const summary = {
                total: this.errors.length,
                byLevel: {},
                recent: this.errors.slice(-5)
            };
            
            this.errors.forEach(err => {
                summary.byLevel[err.level] = (summary.byLevel[err.level] || 0) + 1;
            });
            
            return summary;
        }
    }

    // 创建全局错误报告器实例
    const errorReporter = new ErrorReporter();

    // ====== 工具函数 ======
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function waitForElement(selector, timeout = 10000, description = "元素") {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                errorReporter.debug(`找到${description}: ${selector}`);
                return element;
            }
            await sleep(500);
        }
        throw new Error(`超时: 未找到${description} (${selector})`);
    }

    function findElementByText(text, selectors = ['button', 'span', 'div', 'a'], exact = false) {
        for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector));
            const found = elements.find(el => {
                const content = el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '';
                return exact ? content === text : content.includes(text);
            });
            if (found) {
                errorReporter.debug(`通过文本找到元素: "${text}" -> ${selector}`);
                return found;
            }
        }
        return null;
    }

    // 增强的私信按钮查找函数
    function findPrivateMessageButton() {
        errorReporter.debug('开始增强的私信按钮查找...');
        
        // 策略1: 文本匹配 - 多种可能的文本
        const textVariations = ['私信', '消息', 'Message', 'PM', 'DM'];
        const textSelectors = [
            'a[href*="message"]', 'a[href*="chat"]', 'a[href*="im"]',
            'button[aria-label*="私信"]', 'button[aria-label*="消息"]',
            'span[title*="私信"]', 'span[title*="消息"]',
            'div[data-e2e*="message"]', 'div[data-e2e*="chat"]',
            'a', 'button', 'span', 'div'
        ];
        
        for (const text of textVariations) {
            const element = findElementByText(text, textSelectors);
            if (element) {
                errorReporter.debug(`策略1成功: 通过文本"${text}"找到私信按钮`);
                return element;
            }
        }
        
        // 策略2: CSS类名和数据属性匹配
        const cssSelectors = [
            // 通用的消息/聊天相关选择器
            '[class*="message"]', '[class*="chat"]', '[class*="im-"]',
            '[class*="private"]', '[class*="conversation"]',
            // 抖音可能的特定选择器
            '[class*="nav-item"]', '[class*="header-"]', '[class*="navigation"]',
            '[data-e2e*="message"]', '[data-e2e*="chat"]', '[data-e2e*="im"]',
            '[data-testid*="message"]', '[data-testid*="chat"]',
            // 链接类型
            'a[href*="/message"]', 'a[href*="/chat"]', 'a[href*="/im"]',
            'a[href*="/conversation"]', 'a[href*="/inbox"]'
        ];
        
        for (const selector of cssSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    // 检查元素是否可见且可点击
                    if (isElementVisible(element) && isElementClickable(element)) {
                        // 进一步验证是否为私信相关元素
                        const content = (element.textContent || '').toLowerCase();
                        const attributes = [
                            element.getAttribute('aria-label') || '',
                            element.getAttribute('title') || '',
                            element.getAttribute('data-e2e') || '',
                            element.className || ''
                        ].join(' ').toLowerCase();
                        
                        if (content.includes('私信') || content.includes('消息') || 
                            attributes.includes('message') || attributes.includes('chat') ||
                            attributes.includes('私信') || attributes.includes('消息')) {
                            errorReporter.debug(`策略2成功: 通过选择器"${selector}"找到私信按钮`);
                            return element;
                        }
                    }
                }
            } catch (e) {
                errorReporter.debug(`选择器"${selector}"查找失败: ${e.message}`);
            }
        }
        
        // 策略3: 位置和上下文分析
        // 查找顶部导航区域中的相关元素
        const navigationAreas = [
            'header', 'nav', '[class*="header"]', '[class*="navigation"]',
            '[class*="nav-"]', '[class*="top-"]', '[role="navigation"]'
        ];
        
        for (const navSelector of navigationAreas) {
            try {
                const navElements = document.querySelectorAll(navSelector);
                for (const navElement of navElements) {
                    // 在导航区域内查找可能的私信按钮
                    const candidates = navElement.querySelectorAll('a, button, span, div');
                    for (const candidate of candidates) {
                        if (isElementVisible(candidate) && isElementClickable(candidate)) {
                            const text = (candidate.textContent || '').trim();
                            const label = candidate.getAttribute('aria-label') || '';
                            const title = candidate.getAttribute('title') || '';
                            
                            if (text === '私信' || text === '消息' || 
                                label.includes('私信') || label.includes('消息') ||
                                title.includes('私信') || title.includes('消息')) {
                                errorReporter.debug(`策略3成功: 在导航区域"${navSelector}"中找到私信按钮`);
                                return candidate;
                            }
                        }
                    }
                }
            } catch (e) {
                errorReporter.debug(`导航区域"${navSelector}"查找失败: ${e.message}`);
            }
        }
        
        // 策略4: SVG图标检测
        // 查找包含消息相关SVG图标的元素
        const svgSelectors = [
            'svg[class*="message"]', 'svg[class*="chat"]',
            'use[href*="message"]', 'use[href*="chat"]',
            'path[d*="message"]', 'path[d*="chat"]'
        ];
        
        for (const svgSelector of svgSelectors) {
            try {
                const svgElements = document.querySelectorAll(svgSelector);
                for (const svg of svgElements) {
                    // 找到SVG的可点击父元素
                    let parent = svg.parentElement;
                    let depth = 0;
                    while (parent && depth < 5) {
                        if (isElementClickable(parent) && isElementVisible(parent)) {
                            errorReporter.debug(`策略4成功: 通过SVG图标找到私信按钮`);
                            return parent;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }
                }
            } catch (e) {
                errorReporter.debug(`SVG选择器"${svgSelector}"查找失败: ${e.message}`);
            }
        }
        
        // 策略5: 智能模糊匹配
        // 查找所有可点击元素，进行智能匹配
        const allClickableElements = document.querySelectorAll('a, button, [onclick], [role="button"]');
        for (const element of allClickableElements) {
            if (isElementVisible(element)) {
                const fullText = [
                    element.textContent || '',
                    element.getAttribute('aria-label') || '',
                    element.getAttribute('title') || '',
                    element.getAttribute('data-e2e') || '',
                    element.className || ''
                ].join(' ').toLowerCase();
                
                // 更智能的匹配逻辑
                const messageKeywords = ['私信', '消息', 'message', 'chat', 'im', 'inbox', 'conversation'];
                const hasMessageKeyword = messageKeywords.some(keyword => fullText.includes(keyword));
                
                if (hasMessageKeyword) {
                    // 排除一些明显不是私信按钮的元素
                    const excludeKeywords = ['广告', 'ad', 'advertisement', '分享', 'share', '举报', 'report'];
                    const hasExcludeKeyword = excludeKeywords.some(keyword => fullText.includes(keyword));
                    
                    if (!hasExcludeKeyword) {
                        errorReporter.debug(`策略5成功: 通过智能匹配找到私信按钮`);
                        return element;
                    }
                }
            }
        }
        
        errorReporter.warn('所有策略均未找到私信按钮');
        return null;
    }
    
    // 检查元素是否可见
    function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }
    
    // 检查元素是否可点击
    function isElementClickable(element) {
        if (!element) return false;
        const tagName = element.tagName.toLowerCase();
        return tagName === 'a' || 
               tagName === 'button' || 
               element.hasAttribute('onclick') || 
               element.getAttribute('role') === 'button' ||
               element.hasAttribute('href') ||
               window.getComputedStyle(element).cursor === 'pointer';
    }

    // ====== 主逻辑 ======
    async function sendFireToContact(contact) {
        try {
            errorReporter.info(`开始为联系人 "${contact}" 续火花`);
            
            // 验证联系人参数
            if (!contact || typeof contact !== 'string') {
                throw new Error('联系人参数无效');
            }

            // 1. 点击首页右上角"私信"按钮
            errorReporter.debug('步骤1: 使用增强算法查找私信按钮');
            let msgBtn = null;
            
            for (let i = 0; i < 15; i++) {
                try {
                    // 使用增强的私信按钮查找函数
                    msgBtn = findPrivateMessageButton();
                    
                    if (msgBtn) {
                        errorReporter.debug('找到私信按钮，准备点击');
                        
                        // 滚动到元素可见区域
                        msgBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await sleep(500);
                        
                        // 尝试多种点击方式
                        try {
                            msgBtn.click();
                            errorReporter.debug('使用普通点击成功');
                        } catch (clickError) {
                            errorReporter.warn(`普通点击失败，尝试模拟点击: ${clickError.message}`);
                            // 模拟鼠标点击事件
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            msgBtn.dispatchEvent(clickEvent);
                            errorReporter.debug('模拟点击成功');
                        }
                        break;
                    }
                } catch (e) {
                    errorReporter.warn(`第${i+1}次查找私信按钮失败: ${e.message}`);
                }
                await sleep(1000); // 增加等待时间，给页面更多加载时间
            }
            
            if (!msgBtn) {
                // 提供更详细的错误信息和建议
                const debugInfo = {
                    currentUrl: window.location.href,
                    pageTitle: document.title,
                    navigationElements: document.querySelectorAll('nav, header, [class*="nav"], [class*="header"]').length,
                    allLinks: document.querySelectorAll('a').length,
                    allButtons: document.querySelectorAll('button').length
                };
                errorReporter.error('未找到私信按钮 - 调试信息', new Error(JSON.stringify(debugInfo, null, 2)));
                throw new Error('未找到私信按钮。可能原因：1) 页面未完全加载 2) 需要先登录 3) 页面结构已更新。请确认已在抖音首页且已登录。');
            }
            
            await sleep(WAIT * 2);

            // 2. 查找联系人
            errorReporter.debug(`步骤2: 使用增强算法查找联系人 "${contact}"`);
            let found = false;
            
            for (let i = 0; i < 15; i++) {
                try {
                    // 等待私信页面加载
                    await sleep(1000);
                    
                    // 增强的联系人查找策略
                    let contactNode = null;
                    
                    // 策略1: 在聊天列表中查找
                    const chatListSelectors = [
                        '[class*="chat-list"]', '[class*="conversation-list"]', 
                        '[class*="contact-list"]', '[class*="message-list"]',
                        '[data-e2e*="chat"]', '[data-e2e*="conversation"]'
                    ];
                    
                    for (const listSelector of chatListSelectors) {
                        const chatLists = document.querySelectorAll(listSelector);
                        for (const chatList of chatLists) {
                            contactNode = findContactInContainer(chatList, contact);
                            if (contactNode) {
                                errorReporter.debug(`在聊天列表容器中找到联系人`);
                                break;
                            }
                        }
                        if (contactNode) break;
                    }
                    
                    // 策略2: 全局查找联系人
                    if (!contactNode) {
                        contactNode = findContactGlobally(contact);
                    }
                    
                    if (contactNode) {
                        errorReporter.debug(`找到联系人节点: ${contactNode.tagName}`);
                        
                        // 滚动到联系人可见
                        contactNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await sleep(500);
                        
                        // 尝试点击联系人
                        const clickable = getClickableElement(contactNode);
                        if (clickable) {
                            try {
                                clickable.click();
                                errorReporter.debug('联系人点击成功');
                                found = true;
                                break;
                            } catch (clickError) {
                                errorReporter.warn(`联系人点击失败，尝试模拟点击: ${clickError.message}`);
                                const clickEvent = new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                clickable.dispatchEvent(clickEvent);
                                found = true;
                                break;
                            }
                        } else {
                            errorReporter.warn('找到联系人但无法确定可点击元素');
                        }
                    }
                } catch (e) {
                    errorReporter.warn(`第${i+1}次查找联系人失败: ${e.message}`);
                }
                await sleep(1500); // 增加等待时间
            }
            
            if (!found) {
                const debugInfo = {
                    currentUrl: window.location.href,
                    availableContacts: Array.from(document.querySelectorAll('[class*="chat"], [class*="conversation"], [class*="contact"]'))
                        .map(el => el.textContent?.trim() || '').filter(text => text.length > 0).slice(0, 10)
                };
                errorReporter.error('联系人查找失败 - 调试信息', new Error(JSON.stringify(debugInfo, null, 2)));
                throw new Error(`未找到联系人 "${contact}"。请检查：1) 联系人昵称是否正确 2) 联系人是否在私信列表中 3) 是否已成功进入私信页面。可见联系人: ${debugInfo.availableContacts.join(', ')}`);
            }
            
            await sleep(WAIT);
    
    // 在指定容器中查找联系人
    function findContactInContainer(container, contact) {
        if (!container) return null;
        
        const selectors = [
            '[class*="contact"]', '[class*="chat-item"]', '[class*="conversation"]',
            '[class*="user"]', '[class*="avatar"]', '[class*="name"]',
            'div[title]', 'span[title]', 'img[alt]', 'div', 'span', 'li'
        ];
        
        for (const selector of selectors) {
            const elements = container.querySelectorAll(selector);
            for (const element of elements) {
                if (isContactMatch(element, contact)) {
                    return element;
                }
            }
        }
        return null;
    }
    
    // 全局查找联系人
    function findContactGlobally(contact) {
        // 多种方式查找联系人
        const selectors = [
            'div[title]', 'span[title]', 'img[alt]',
            '[class*="contact"]', '[class*="chat"]', '[class*="conversation"]',
            '[class*="user"]', '[class*="name"]', '[class*="avatar"]',
            'div', 'span', 'li', 'a'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (isContactMatch(element, contact) && isElementVisible(element)) {
                    return element;
                }
            }
        }
        return null;
    }
    
    // 检查元素是否匹配联系人
    function isContactMatch(element, contact) {
        if (!element || !contact) return false;
        
        const sources = [
            element.textContent || '',
            element.getAttribute('title') || '',
            element.getAttribute('alt') || '',
            element.getAttribute('aria-label') || ''
        ];
        
        return sources.some(source => {
            const text = source.trim();
            return text === contact || text.includes(contact) || contact.includes(text);
        });
    }
    
    // 获取可点击的元素
    function getClickableElement(element) {
        if (!element) return null;
        
        // 检查当前元素是否可点击
        if (isElementClickable(element)) {
            return element;
        }
        
        // 检查父元素是否可点击
        let parent = element.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
            if (isElementClickable(parent)) {
                return parent;
            }
            parent = parent.parentElement;
            depth++;
        }
        
        // 检查子元素是否可点击
        const clickableChild = element.querySelector('a, button, [onclick], [role="button"]');
        if (clickableChild) {
            return clickableChild;
        }
        
        return element; // 返回原元素作为备选
    }
    
    // 验证输入框是否有效
    function isValidInputBox(element) {
        if (!element) return false;
        
        // 检查可见性
        if (!isElementVisible(element)) return false;
        
        // 检查是否为输入类型元素
        const tagName = element.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea' || element.contentEditable === 'true';
        if (!isInput) return false;
        
        // 检查是否可编辑
        if (element.disabled || element.readOnly) return false;
        
        // 检查输入框大小 (排除隐藏的小输入框)
        const rect = element.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 20) return false;
        
        // 检查是否为密码或其他不相关类型
        if (element.type === 'password' || element.type === 'hidden' || element.type === 'radio' || element.type === 'checkbox') {
            return false;
        }
        
        return true;
    }
    
    // 检查是否为发送按钮
    function isSendButton(element, inputBox) {
        if (!element) return false;
        
        // 检查文本内容
        const text = (element.textContent || '').trim().toLowerCase();
        const sendKeywords = ['发送', 'send', '提交', 'submit'];
        const hasKeyword = sendKeywords.some(keyword => text.includes(keyword));
        
        // 检查属性
        const attributes = [
            element.getAttribute('aria-label') || '',
            element.getAttribute('title') || '',
            element.className || '',
            element.getAttribute('data-e2e') || ''
        ].join(' ').toLowerCase();
        
        const hasAttributeKeyword = sendKeywords.some(keyword => attributes.includes(keyword));
        
        // 检查位置关系 (是否在输入框附近)
        let isNearInput = false;
        if (inputBox) {
            try {
                const inputRect = inputBox.getBoundingClientRect();
                const buttonRect = element.getBoundingClientRect();
                const distance = Math.sqrt(
                    Math.pow(inputRect.left - buttonRect.left, 2) + 
                    Math.pow(inputRect.top - buttonRect.top, 2)
                );
                isNearInput = distance < 200; // 200像素范围内
            } catch (e) {
                // 忽略位置计算错误
            }
        }
        
        // 检查是否为按钮类型元素
        const isButton = element.tagName === 'BUTTON' || 
                         element.getAttribute('role') === 'button' ||
                         element.type === 'submit';
        
        return (hasKeyword || hasAttributeKeyword) && isButton && (isNearInput || !inputBox);
    }
            
            await sleep(WAIT);

            // 3. 查找输入框
            errorReporter.debug('步骤3: 使用增强算法查找消息输入框');
            let inputBox = null;
            
            for (let i = 0; i < 15; i++) {
                try {
                    // 等待聊天界面加载
                    await sleep(1000);
                    
                    // 策略1: 专门的输入框选择器
                    const inputSelectors = [
                        // 常见的消息输入框选择器
                        'textarea[placeholder*="消息"]', 'textarea[placeholder*="输入"]', 'textarea[placeholder*="message"]',
                        'div[contenteditable="true"][placeholder*="消息"]', 'div[contenteditable="true"][placeholder*="输入"]',
                        'input[placeholder*="消息"]', 'input[placeholder*="输入"]', 'input[placeholder*="message"]',
                        // 通用输入框选择器
                        'div[contenteditable="true"]', 'textarea', 'input[type="text"]',
                        // 可能的类名选择器
                        '[class*="input"]', '[class*="text-area"]', '[class*="message-input"]',
                        '[class*="chat-input"]', '[class*="compose"]', '[class*="editor"]',
                        // 数据属性选择器
                        '[data-e2e*="input"]', '[data-e2e*="message"]', '[data-e2e*="compose"]'
                    ];
                    
                    for (const selector of inputSelectors) {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                            if (isValidInputBox(element)) {
                                inputBox = element;
                                errorReporter.debug(`找到输入框: ${selector}`);
                                break;
                            }
                        }
                        if (inputBox) break;
                    }
                    
                    // 策略2: 在聊天区域中查找输入框
                    if (!inputBox) {
                        const chatAreas = document.querySelectorAll('[class*="chat"], [class*="message"], [class*="conversation"]');
                        for (const chatArea of chatAreas) {
                            const inputs = chatArea.querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]');
                            for (const input of inputs) {
                                if (isValidInputBox(input)) {
                                    inputBox = input;
                                    errorReporter.debug('在聊天区域中找到输入框');
                                    break;
                                }
                            }
                            if (inputBox) break;
                        }
                    }
                    
                    // 策略3: 位置分析 - 查找页面底部的输入框
                    if (!inputBox) {
                        const allInputs = document.querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]');
                        let bottomInput = null;
                        let maxTop = 0;
                        
                        for (const input of allInputs) {
                            if (isValidInputBox(input)) {
                                const rect = input.getBoundingClientRect();
                                if (rect.top > maxTop) {
                                    maxTop = rect.top;
                                    bottomInput = input;
                                }
                            }
                        }
                        
                        if (bottomInput) {
                            inputBox = bottomInput;
                            errorReporter.debug('通过位置分析找到输入框');
                        }
                    }
                    
                    if (inputBox) break;
                } catch (e) {
                    errorReporter.warn(`第${i+1}次查找输入框失败: ${e.message}`);
                }
                await sleep(1000);
            }
            
            if (!inputBox) {
                const debugInfo = {
                    currentUrl: window.location.href,
                    availableInputs: Array.from(document.querySelectorAll('input, textarea, [contenteditable]'))
                        .map(el => ({
                            tag: el.tagName,
                            type: el.type || 'N/A',
                            placeholder: el.placeholder || el.getAttribute('placeholder') || 'N/A',
                            contenteditable: el.contentEditable || 'N/A'
                        })).slice(0, 10)
                };
                errorReporter.error('输入框查找失败 - 调试信息', new Error(JSON.stringify(debugInfo, null, 2)));
                throw new Error('未找到消息输入框。请确认：1) 已成功进入聊天界面 2) 聊天界面已完全加载 3) 有权限向该联系人发送消息');
            }
            
            // 确保输入框可见
            inputBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(500);
            
            // 获取焦点
            inputBox.focus();
            await sleep(300);
            
            // 输入消息
            errorReporter.debug(`输入消息: "${MESSAGE}"`);
            try {
                // 清空现有内容
                if (inputBox.tagName === 'TEXTAREA' || inputBox.tagName === 'INPUT') {
                    inputBox.value = '';
                    inputBox.focus();
                    inputBox.value = MESSAGE;
                    
                    // 触发输入事件
                    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
                    inputBox.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (inputBox.contentEditable === 'true') {
                    inputBox.focus();
                    
                    // 清空内容
                    inputBox.innerHTML = '';
                    inputBox.textContent = '';
                    
                    // 设置新内容
                    inputBox.textContent = MESSAGE;
                    
                    // 或者使用innerHTML方式
                    if (!inputBox.textContent) {
                        inputBox.innerHTML = MESSAGE;
                    }
                    
                    // 触发多种事件确保检测到输入
                    const events = ['input', 'keyup', 'change', 'paste'];
                    events.forEach(eventType => {
                        inputBox.dispatchEvent(new Event(eventType, { bubbles: true }));
                    });
                    
                    // 模拟键盘输入
                    inputBox.dispatchEvent(new KeyboardEvent('keydown', { 
                        bubbles: true, 
                        key: 'a', 
                        code: 'KeyA' 
                    }));
                }
                
                errorReporter.debug(`消息输入完成，当前内容: "${inputBox.value || inputBox.textContent}"`);
            } catch (e) {
                throw new Error(`输入消息失败: ${e.message}`);
            }
            
            await sleep(800);

            // 4. 发送消息
            errorReporter.debug('步骤4: 使用增强算法发送消息');
            let messageSent = false;
            
            // 策略1: 查找发送按钮
            const sendButtonSelectors = [
                // 文本匹配
                'button:contains("发送")', 'button:contains("Send")', 'span:contains("发送")',
                // 属性匹配
                'button[aria-label*="发送"]', 'button[title*="发送"]',
                'button[aria-label*="Send"]', 'button[title*="Send"]',
                // 类名匹配
                '[class*="send"]', '[class*="submit"]', '[class*="confirm"]',
                // 数据属性匹配
                '[data-e2e*="send"]', '[data-testid*="send"]',
                // 位置匹配 - 输入框附近的按钮
                'button', '[role="button"]'
            ];
            
            for (const selector of sendButtonSelectors) {
                try {
                    let sendBtn = null;
                    
                    if (selector.includes(':contains(')) {
                        // 自定义文本匹配
                        const text = selector.match(/contains\("([^"]+)"\)/)[1];
                        const buttons = document.querySelectorAll('button, [role="button"]');
                        sendBtn = Array.from(buttons).find(btn => 
                            btn.textContent && btn.textContent.includes(text)
                        );
                    } else {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                            if (isSendButton(element, inputBox)) {
                                sendBtn = element;
                                break;
                            }
                        }
                    }
                    
                    if (sendBtn && isElementVisible(sendBtn) && !sendBtn.disabled) {
                        errorReporter.debug(`找到发送按钮: ${selector}`);
                        
                        try {
                            sendBtn.click();
                            errorReporter.debug('发送按钮点击成功');
                            messageSent = true;
                            break;
                        } catch (clickError) {
                            errorReporter.warn(`发送按钮点击失败，尝试模拟点击: ${clickError.message}`);
                            sendBtn.dispatchEvent(new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            }));
                            messageSent = true;
                            break;
                        }
                    }
                } catch (e) {
                    errorReporter.debug(`发送按钮选择器"${selector}"失败: ${e.message}`);
                }
            }
            
            // 策略2: 键盘发送 (Enter键)
            if (!messageSent) {
                errorReporter.debug('尝试使用回车键发送消息');
                try {
                    inputBox.focus();
                    
                    // 尝试不同的回车键组合
                    const enterEvents = [
                        { key: 'Enter', code: 'Enter', keyCode: 13, which: 13 },
                        { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, ctrlKey: true },
                        { key: 'Enter', code: 'NumpadEnter', keyCode: 13, which: 13 }
                    ];
                    
                    for (const eventConfig of enterEvents) {
                        const keydownEvent = new KeyboardEvent('keydown', { 
                            bubbles: true, 
                            cancelable: true,
                            ...eventConfig
                        });
                        const keypressEvent = new KeyboardEvent('keypress', { 
                            bubbles: true, 
                            cancelable: true,
                            ...eventConfig
                        });
                        const keyupEvent = new KeyboardEvent('keyup', { 
                            bubbles: true, 
                            cancelable: true,
                            ...eventConfig
                        });
                        
                        inputBox.dispatchEvent(keydownEvent);
                        if (!keydownEvent.defaultPrevented) {
                            inputBox.dispatchEvent(keypressEvent);
                            inputBox.dispatchEvent(keyupEvent);
                            
                            await sleep(500);
                            
                            // 检查消息是否已发送 (输入框是否被清空)
                            if (!inputBox.value && !inputBox.textContent) {
                                errorReporter.debug('回车键发送成功');
                                messageSent = true;
                                break;
                            }
                        }
                    }
                } catch (e) {
                    errorReporter.warn(`回车键发送失败: ${e.message}`);
                }
            }
            
            // 策略3: 提交表单
            if (!messageSent) {
                errorReporter.debug('尝试提交表单发送消息');
                try {
                    const form = inputBox.closest('form');
                    if (form) {
                        form.submit();
                        messageSent = true;
                        errorReporter.debug('表单提交成功');
                    }
                } catch (e) {
                    errorReporter.warn(`表单提交失败: ${e.message}`);
                }
            }
            
            if (!messageSent) {
                throw new Error('所有发送方法均失败。请检查：1) 输入框是否正确 2) 是否有发送按钮 3) 网络连接是否正常');
            }
            
            await sleep(WAIT);
            errorReporter.info(`✅ 成功向联系人 "${contact}" 发送续火花消息`);
            
        } catch (error) {
            errorReporter.error(`向联系人 "${contact}" 发送消息失败`, error);
            throw error; // 重新抛出错误以便上层处理
        }
    }

    async function main() {
        try {
            errorReporter.info('=== 开始执行续火花任务 ===');
            
            // 配置验证
            if (!errorReporter.validateConfig()) {
                throw new Error('配置验证失败，请检查脚本配置');
            }
            
            let successCount = 0;
            let failCount = 0;
            const results = [];
            
            for (let i = 0; i < CONTACTS.length; i++) {
                const contact = CONTACTS[i];
                try {
                    errorReporter.info(`处理联系人 ${i + 1}/${CONTACTS.length}: ${contact}`);
                    await sendFireToContact(contact);
                    successCount++;
                    results.push({ contact, status: 'success' });
                } catch (error) {
                    failCount++;
                    results.push({ contact, status: 'failed', error: error.message });
                    errorReporter.error(`联系人 "${contact}" 处理失败`, error);
                    
                    // 失败后等待更长时间再继续
                    if (i < CONTACTS.length - 1) {
                        errorReporter.info(`等待 ${WAIT * 2}ms 后继续处理下一个联系人`);
                        await sleep(WAIT * 2);
                    }
                } finally {
                    // 每个联系人之间的间隔
                    if (i < CONTACTS.length - 1) {
                        await sleep(WAIT);
                    }
                }
            }
            
            // 执行结果汇总
            const summary = {
                total: CONTACTS.length,
                success: successCount,
                failed: failCount,
                results: results,
                timestamp: new Date().toISOString()
            };
            
            errorReporter.info(`=== 续火花任务完成 ===`);
            errorReporter.info(`总计: ${summary.total}, 成功: ${summary.success}, 失败: ${summary.failed}`);
            
            // 显示结果通知
            showExecutionSummary(summary);
            
            return summary;
            
        } catch (error) {
            errorReporter.error('续火花任务执行失败', error);
            throw error;
        }
    }

    function showExecutionSummary(summary) {
        const notification = document.createElement("div");
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 30px;
            background: ${summary.failed > 0 ? '#f59e0b' : '#10b981'};
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10001;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        const icon = summary.failed > 0 ? '⚠️' : '✅';
        const title = summary.failed > 0 ? '续火花完成(有失败)' : '续火花全部成功';
        
        notification.innerHTML = `
            <div style="font-weight: bold;">${icon} ${title}</div>
            <div style="margin-top: 8px; font-size: 13px;">
                总计: ${summary.total} | 成功: ${summary.success} | 失败: ${summary.failed}
            </div>
            ${summary.failed > 0 ? `
                <div style="margin-top: 5px; font-size: 11px; opacity: 0.9;">
                    失败联系人: ${summary.results.filter(r => r.status === 'failed').map(r => r.contact).join(', ')}
                </div>
            ` : ''}
            <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                点击查看详细日志
            </div>
        `;
        
        notification.onclick = () => errorReporter.showErrorPanel();
        notification.style.cursor = 'pointer';
        
        document.body.appendChild(notification);
        
        // 5秒后自动消失
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // ====== 定时执行 ======
    function runWithInterval() {
        errorReporter.info('启动定时执行模式');
        main().catch(error => {
            errorReporter.error('定时执行失败', error);
        });
        setInterval(() => {
            main().catch(error => {
                errorReporter.error('定时执行失败', error);
            });
        }, INTERVAL);
    }

    // ====== 每天定时执行 ======
    function runAtSchedule() {
        errorReporter.info(`启动每日定时执行模式，时间: ${SCHEDULE_TIME}`);
        
        function getNextTimeout() {
            const now = new Date();
            const [h, m] = SCHEDULE_TIME.split(":").map(Number);
            const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            return next - now;
        }
        
        async function scheduleLoop() {
            while (true) {
                try {
                    const timeout = getNextTimeout();
                    errorReporter.info(`下次执行时间: ${new Date(Date.now() + timeout).toLocaleString()}`);
                    await sleep(timeout);
                    await main();
                } catch (error) {
                    errorReporter.error('定时任务执行失败', error);
                }
            }
        }
        scheduleLoop();
    }

    // ====== 用户手动触发 ======
    function addManualButton() {
        const btnId = "douyin-fire-btn";
        if (document.getElementById(btnId)) return;
        
        const btn = document.createElement("button");
        btn.id = btnId;
        btn.innerText = "手动续火花";
        btn.style.cssText = `
            position: fixed;
            top: 80px;
            right: 30px;
            z-index: 9999;
            background: #ff2c55;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 10px 18px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        btn.onclick = async () => {
            btn.disabled = true;
            btn.innerText = "正在续火花...";
            btn.style.background = "#999";
            
            try {
                const result = await main();
                errorReporter.info('手动执行完成', null);
            } catch (e) {
                errorReporter.error('手动执行失败', e);
            } finally {
                btn.innerText = "手动续火花";
                btn.style.background = "#ff2c55";
                btn.disabled = false;
            }
        };
        
        document.body.appendChild(btn);
        errorReporter.info('已添加手动执行按钮');
    }

    // ====== 添加错误日志按钮 ======
    function addErrorLogButton() {
        const btnId = "douyin-fire-log-btn";
        if (document.getElementById(btnId)) return;
        
        const btn = document.createElement("button");
        btn.id = btnId;
        btn.innerText = "🐛 查看日志";
        btn.style.cssText = `
            position: fixed;
            top: 140px;
            right: 30px;
            z-index: 9999;
            background: #374151;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        btn.onclick = () => {
            errorReporter.showErrorPanel();
        };
        
        document.body.appendChild(btn);
        errorReporter.info('已添加错误日志按钮');
    }

    // ====== 页面加载完成后自动运行 ======
    window.addEventListener('load', () => {
        setTimeout(() => {
            try {
                errorReporter.info('=== 抖音自动续火花插件启动 ===');
                errorReporter.info(`配置: 联系人数量=${CONTACTS.length}, 自动执行=${ENABLE_AUTO}`);
                
                addManualButton();
                addErrorLogButton();
                
                if (ENABLE_AUTO) {
                    runAtSchedule();
                } else {
                    errorReporter.info('自动执行已禁用，仅可手动触发');
                }
                
                // 显示启动通知
                const startNotification = document.createElement("div");
                startNotification.style.cssText = `
                    position: fixed;
                    top: 50px;
                    right: 30px;
                    background: #10b981;
                    color: white;
                    padding: 12px;
                    border-radius: 6px;
                    z-index: 10001;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                `;
                startNotification.innerHTML = `
                    <div style="font-weight: bold;">🔥 续火花插件已启动</div>
                    <div style="margin-top: 4px; font-size: 12px;">
                        联系人: ${CONTACTS.length} | 自动: ${ENABLE_AUTO ? '是' : '否'}
                    </div>
                `;
                
                document.body.appendChild(startNotification);
                setTimeout(() => {
                    if (startNotification.parentNode) {
                        startNotification.parentNode.removeChild(startNotification);
                    }
                }, 3000);
                
            } catch (error) {
                console.error('插件启动失败:', error);
                errorReporter.error('插件启动失败', error);
            }
        }, 2000);
    });

})();
