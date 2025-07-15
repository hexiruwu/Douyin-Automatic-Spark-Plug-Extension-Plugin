// ==UserScript==
// @name         抖音自动续火花
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动给抖音指定联系人发送私信，保持互动（续火花）
// @author       Copilot
// @match        https://www.douyin.com/*
// @icon         https://www.douyin.com/favicon.ico
// @grant        none
// ==/UserScript==

/*
 * 更新说明 v1.1：
 * - 修复了私信按钮检测问题，支持嵌套HTML结构
 * - 改进了元素选择器，能够找到类似 <p class="jenVD1aU">私信</p> 的按钮
 * - 增加了更多调试日志，便于问题排查
 * - 优化了联系人查找逻辑
 * - 改进了错误提示信息
 */

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

    // ====== 工具函数 ======
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ====== 主逻辑 ======
    async function sendFireToContact(contact) {
        // 1. 点击首页右上角“私信”按钮
        let msgBtn = null;
        for (let i = 0; i < 10; i++) {
            // 首先尝试原有的直接选择器
            msgBtn = Array.from(document.querySelectorAll('a[aria-label],button[aria-label],span[aria-label],a[title],button[title],span[title]'))
                .find(el => /私信/.test(el.getAttribute('aria-label')||'') || /私信/.test(el.getAttribute('title')||'') || /私信/.test(el.textContent));
            
            // 如果没找到，尝试更广泛的搜索，包括嵌套元素
            if (!msgBtn) {
                // 查找包含"私信"文本的p元素，然后找其可点击的父元素
                const msgText = Array.from(document.querySelectorAll('p, span, div'))
                    .find(el => el.textContent && el.textContent.trim() === '私信');
                if (msgText) {
                    // 向上查找可点击的父元素
                    let parent = msgText.parentElement;
                    while (parent && parent !== document.body) {
                        if (parent.tagName === 'A' || parent.tagName === 'BUTTON' || 
                            parent.onclick || parent.getAttribute('role') === 'button' ||
                            parent.style.cursor === 'pointer' || parent.classList.contains('clickable')) {
                            msgBtn = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }
            }
            
            // 如果还是没找到，尝试查找任何包含"私信"的可点击元素
            if (!msgBtn) {
                msgBtn = Array.from(document.querySelectorAll('a, button, div[role="button"], span[role="button"], div[onclick], span[onclick]'))
                    .find(el => el.textContent && el.textContent.includes('私信'));
            }
            
            // 最后尝试：查找任何包含"私信"文本的元素及其父级
            if (!msgBtn) {
                const allElements = document.querySelectorAll('*');
                for (let el of allElements) {
                    if (el.textContent && el.textContent.includes('私信') && el.textContent.length < 20) {
                        // 检查元素本身或父级是否可点击
                        let candidate = el;
                        while (candidate && candidate !== document.body) {
                            if (candidate.tagName === 'A' || candidate.tagName === 'BUTTON' || 
                                candidate.onclick || candidate.getAttribute('role') === 'button' ||
                                window.getComputedStyle(candidate).cursor === 'pointer') {
                                msgBtn = candidate;
                                break;
                            }
                            candidate = candidate.parentElement;
                        }
                        if (msgBtn) break;
                    }
                }
            }
            
            if (msgBtn) {
                console.log('[续火花] 找到私信按钮:', msgBtn);
                msgBtn.click();
                break;
            }
            console.log(`[续火花] 第${i+1}次尝试查找私信按钮...`);
            await sleep(500);
        }
        if (!msgBtn) {
            console.log('[续火花] 未找到私信按钮，请检查页面是否正常加载');
            return;
        }
        await sleep(WAIT * 2);

        // 2. 查找联系人（右侧圆形头像/昵称）
        let found = false;
        for (let i = 0; i < 10; i++) {
            // 优先找头像旁的昵称
            let contactNode = Array.from(document.querySelectorAll('div[title],span[title],div,span,img[alt]'))
                .find(node => {
                    if (node.tagName === 'IMG' && node.alt && node.alt.includes(contact)) return true;
                    if (node.title && node.title.includes(contact)) return true;
                    if (node.textContent && node.textContent.includes(contact)) return true;
                    return false;
                });
            if (contactNode) {
                // 若为img，点父级；否则点自己
                let clickable = contactNode.tagName === 'IMG' && contactNode.parentElement ? contactNode.parentElement : contactNode;
                console.log(`[续火花] 找到联系人 ${contact}:`, clickable);
                clickable.click();
                found = true;
                break;
            }
            console.log(`[续火花] 第${i+1}次尝试查找联系人: ${contact}...`);
            await sleep(WAIT);
        }
        if (!found) {
            console.log(`[续火花] 未找到联系人: ${contact}，请确认联系人昵称是否正确`);
            return;
        }
        await sleep(WAIT);

        // 3. 查找输入框（底部 placeholder="发送消息..." 或 contenteditable）
        let inputBox = null;
        for (let i = 0; i < 10; i++) {
            inputBox = document.querySelector('div[contenteditable="true"][placeholder],textarea[placeholder]');
            if (!inputBox) {
                // 兼容无placeholder
                inputBox = document.querySelector('div[contenteditable="true"]');
            }
            if (inputBox) {
                console.log('[续火花] 找到输入框:', inputBox);
                break;
            }
            console.log(`[续火花] 第${i+1}次尝试查找输入框...`);
            await sleep(500);
        }
        if (!inputBox) {
            console.log('[续火花] 未找到输入框，请确认已进入私信对话界面');
            return;
        }
        // 输入消息
        inputBox.innerText = MESSAGE;
        inputBox.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(500);

        // 4. 发送消息（优先点“发送”按钮，否则模拟回车）
        let sendBtn = Array.from(document.querySelectorAll('button,span')).find(el => /发送/.test(el.textContent));
        if (sendBtn && !sendBtn.disabled) {
            console.log('[续火花] 使用发送按钮发送消息');
            sendBtn.click();
        } else {
            console.log('[续火花] 使用回车键发送消息');
            let evt = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', which: 13, keyCode: 13 });
            inputBox.dispatchEvent(evt);
        }
        await sleep(WAIT);

        console.log(`[续火花] 已向 ${contact} 发送消息: "${MESSAGE}"`);
    }

    async function main() {
        console.log('[续火花] 开始执行自动续火花任务');
        for (let contact of CONTACTS) {
            console.log(`[续火花] 处理联系人: ${contact}`);
            await sendFireToContact(contact);
            await sleep(WAIT);
        }
        console.log('[续火花] 本轮续火花任务完成');
    }


    // ====== 定时执行 ======
    function runWithInterval() {
        main();
        setInterval(main, INTERVAL);
    }

    // ====== 每天定时执行 ======
    function runAtSchedule() {
        function getNextTimeout() {
            const now = new Date();
            const [h, m] = SCHEDULE_TIME.split(":").map(Number);
            const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            return next - now;
        }
        async function scheduleLoop() {
            while (true) {
                const timeout = getNextTimeout();
                await sleep(timeout);
                main();
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
        btn.style.position = "fixed";
        btn.style.top = "80px";
        btn.style.right = "30px";
        btn.style.zIndex = 9999;
        btn.style.background = "#ff2c55";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "6px";
        btn.style.padding = "10px 18px";
        btn.style.fontSize = "16px";
        btn.style.cursor = "pointer";
        btn.onclick = async () => {
            btn.disabled = true;
            btn.innerText = "正在续火花...";
            try {
                await main();
            } catch (e) {
                alert('脚本执行出错：' + e);
                console.error(e);
            }
            btn.innerText = "手动续火花";
            btn.disabled = false;
        };
        document.body.appendChild(btn);
    }

    // 页面加载完成后自动运行
    window.addEventListener('load', () => {
        setTimeout(() => {
            addManualButton();
            if (ENABLE_AUTO) {
                runAtSchedule();
            }
        }, 2000);
    });

})();
