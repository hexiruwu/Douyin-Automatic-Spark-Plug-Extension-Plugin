
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

    // ====== 主逻辑 ======
    async function sendFireToContact(contact) {
        try {
            errorReporter.info(`开始为联系人 "${contact}" 续火花`);
            
            // 验证联系人参数
            if (!contact || typeof contact !== 'string') {
                throw new Error('联系人参数无效');
            }

            // 1. 点击首页右上角"私信"按钮
            errorReporter.debug('步骤1: 查找私信按钮');
            let msgBtn = null;
            
            for (let i = 0; i < 10; i++) {
                try {
                    msgBtn = findElementByText('私信', ['a[aria-label]', 'button[aria-label]', 'span[aria-label]', 'a[title]', 'button[title]', 'span[title]', 'a', 'button', 'span']);
                    
                    if (msgBtn) {
                        errorReporter.debug('找到私信按钮，准备点击');
                        msgBtn.click();
                        break;
                    }
                } catch (e) {
                    errorReporter.warn(`第${i+1}次查找私信按钮失败: ${e.message}`);
                }
                await sleep(500);
            }
            
            if (!msgBtn) {
                throw new Error('未找到私信按钮，请确认页面已正确加载');
            }
            
            await sleep(WAIT * 2);

            // 2. 查找联系人
            errorReporter.debug(`步骤2: 查找联系人 "${contact}"`);
            let found = false;
            
            for (let i = 0; i < 10; i++) {
                try {
                    // 多种方式查找联系人
                    let contactNode = Array.from(document.querySelectorAll('div[title],span[title],div,span,img[alt]'))
                        .find(node => {
                            if (node.tagName === 'IMG' && node.alt && node.alt.includes(contact)) return true;
                            if (node.title && node.title.includes(contact)) return true;
                            if (node.textContent && node.textContent.includes(contact)) return true;
                            return false;
                        });
                    
                    if (contactNode) {
                        errorReporter.debug(`找到联系人节点: ${contactNode.tagName}`);
                        // 若为img，点击父级；否则点击自己
                        const clickable = contactNode.tagName === 'IMG' && contactNode.parentElement ? contactNode.parentElement : contactNode;
                        clickable.click();
                        found = true;
                        break;
                    }
                } catch (e) {
                    errorReporter.warn(`第${i+1}次查找联系人失败: ${e.message}`);
                }
                await sleep(WAIT);
            }
            
            if (!found) {
                throw new Error(`未找到联系人 "${contact}"，请检查联系人昵称是否正确或联系人是否在私信列表中`);
            }
            
            await sleep(WAIT);

            // 3. 查找输入框
            errorReporter.debug('步骤3: 查找消息输入框');
            let inputBox = null;
            
            for (let i = 0; i < 10; i++) {
                try {
                    // 多种选择器尝试
                    const inputSelectors = [
                        'div[contenteditable="true"][placeholder]',
                        'textarea[placeholder]',
                        'div[contenteditable="true"]',
                        'textarea',
                        'input[type="text"]'
                    ];
                    
                    for (const selector of inputSelectors) {
                        inputBox = document.querySelector(selector);
                        if (inputBox) {
                            errorReporter.debug(`找到输入框: ${selector}`);
                            break;
                        }
                    }
                    
                    if (inputBox) break;
                } catch (e) {
                    errorReporter.warn(`第${i+1}次查找输入框失败: ${e.message}`);
                }
                await sleep(500);
            }
            
            if (!inputBox) {
                throw new Error('未找到消息输入框，请确认已进入聊天界面');
            }
            
            // 输入消息
            errorReporter.debug(`输入消息: "${MESSAGE}"`);
            try {
                if (inputBox.tagName === 'TEXTAREA' || inputBox.tagName === 'INPUT') {
                    inputBox.value = MESSAGE;
                    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    inputBox.innerText = MESSAGE;
                    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } catch (e) {
                throw new Error(`输入消息失败: ${e.message}`);
            }
            
            await sleep(500);

            // 4. 发送消息
            errorReporter.debug('步骤4: 发送消息');
            try {
                let sendBtn = findElementByText('发送', ['button', 'span', 'div']);
                
                if (sendBtn && !sendBtn.disabled) {
                    errorReporter.debug('通过发送按钮发送消息');
                    sendBtn.click();
                } else {
                    errorReporter.debug('通过回车键发送消息');
                    const evt = new KeyboardEvent('keydown', { 
                        bubbles: true, 
                        cancelable: true, 
                        key: 'Enter', 
                        code: 'Enter', 
                        which: 13, 
                        keyCode: 13 
                    });
                    inputBox.dispatchEvent(evt);
                }
            } catch (e) {
                throw new Error(`发送消息失败: ${e.message}`);
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
