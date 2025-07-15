// ==UserScript==
// @name         抖音自动续火花
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动给抖音指定联系人发送私信，保持互动（续火花）
// @author       Copilot
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

    // ====== 工具函数 ======
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ====== 主逻辑 ======
    async function sendFireToContact(contact) {
        // 1. 点击首页右上角“私信”按钮
        let msgBtn = null;
        for (let i = 0; i < 10; i++) {
            msgBtn = Array.from(document.querySelectorAll('a[aria-label],button[aria-label],span[aria-label],a[title],button[title],span[title]'))
                .find(el => /私信/.test(el.getAttribute('aria-label')||'') || /私信/.test(el.getAttribute('title')||'') || /私信/.test(el.textContent));
            if (msgBtn) {
                msgBtn.click();
                break;
            }
            await sleep(500);
        }
        if (!msgBtn) {
            console.log('[续火花] 未找到私信按钮');
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
                clickable.click();
                found = true;
                break;
            }
            await sleep(WAIT);
        }
        if (!found) {
            console.log(`[续火花] 未找到联系人: ` + contact);
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
            if (inputBox) break;
            await sleep(500);
        }
        if (!inputBox) {
            console.log('[续火花] 未找到输入框');
            return;
        }
        // 输入消息
        inputBox.innerText = MESSAGE;
        inputBox.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(500);

        // 4. 发送消息（优先点“发送”按钮，否则模拟回车）
        let sendBtn = Array.from(document.querySelectorAll('button,span')).find(el => /发送/.test(el.textContent));
        if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
        } else {
            let evt = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', which: 13, keyCode: 13 });
            inputBox.dispatchEvent(evt);
        }
        await sleep(WAIT);

        console.log(`[续火花] 已向 ${contact} 发送消息`);
    }

    async function main() {
        for (let contact of CONTACTS) {
            await sendFireToContact(contact);
            await sleep(WAIT);
        }
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
