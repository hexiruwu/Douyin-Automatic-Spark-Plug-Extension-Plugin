// 抖音网站结构分析脚本
// 在浏览器控制台中运行此脚本来分析当前页面结构

(function() {
    'use strict';
    
    console.log('🔍 开始分析抖音网站结构...');
    
    // 分析导航区域
    function analyzeNavigation() {
        console.log('\n📍 分析导航区域:');
        
        const navSelectors = [
            'nav', 'header', '[class*="nav"]', '[class*="header"]', 
            '[class*="top"]', '[role="navigation"]'
        ];
        
        navSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`找到 ${elements.length} 个 "${selector}" 元素`);
                elements.forEach((el, i) => {
                    console.log(`  ${i+1}. 类名: ${el.className}`);
                    console.log(`     文本内容: ${el.textContent?.substring(0, 100)}...`);
                });
            }
        });
    }
    
    // 分析可能的私信按钮
    function analyzePrivateMessageButtons() {
        console.log('\n💬 分析可能的私信按钮:');
        
        const possibleButtons = [];
        
        // 查找包含相关文本的元素
        const textKeywords = ['私信', '消息', 'message', 'chat', 'pm', 'dm'];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
            const text = (el.textContent || '').toLowerCase();
            const attributes = [
                el.getAttribute('aria-label') || '',
                el.getAttribute('title') || '',
                el.className || '',
                el.getAttribute('data-e2e') || ''
            ].join(' ').toLowerCase();
            
            textKeywords.forEach(keyword => {
                if ((text.includes(keyword) || attributes.includes(keyword)) && 
                    (el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button')) {
                    possibleButtons.push({
                        element: el,
                        keyword: keyword,
                        text: el.textContent?.trim() || '',
                        className: el.className,
                        tagName: el.tagName
                    });
                }
            });
        });
        
        if (possibleButtons.length > 0) {
            console.log(`找到 ${possibleButtons.length} 个可能的私信按钮:`);
            possibleButtons.forEach((btn, i) => {
                console.log(`  ${i+1}. ${btn.tagName} - "${btn.text}" (关键词: ${btn.keyword})`);
                console.log(`     类名: ${btn.className}`);
                console.log('     元素:', btn.element);
            });
        } else {
            console.log('❌ 未找到可能的私信按钮');
        }
        
        return possibleButtons;
    }
    
    // 分析链接结构
    function analyzeLinks() {
        console.log('\n🔗 分析链接结构:');
        
        const links = document.querySelectorAll('a[href]');
        const relevantLinks = [];
        
        links.forEach(link => {
            const href = link.href.toLowerCase();
            const text = (link.textContent || '').trim();
            
            if (href.includes('message') || href.includes('chat') || href.includes('im') ||
                text.includes('私信') || text.includes('消息')) {
                relevantLinks.push({
                    href: link.href,
                    text: text,
                    className: link.className
                });
            }
        });
        
        if (relevantLinks.length > 0) {
            console.log(`找到 ${relevantLinks.length} 个相关链接:`);
            relevantLinks.forEach((link, i) => {
                console.log(`  ${i+1}. "${link.text}" -> ${link.href}`);
                console.log(`     类名: ${link.className}`);
            });
        } else {
            console.log('❌ 未找到相关链接');
        }
    }
    
    // 分析页面的React/Vue组件
    function analyzeComponents() {
        console.log('\n⚛️ 分析前端框架组件:');
        
        // 检查React
        if (window.React || document.querySelector('[data-reactroot]') || 
            document.querySelector('[data-react-helmet]')) {
            console.log('✅ 检测到React框架');
        }
        
        // 检查Vue
        if (window.Vue || document.querySelector('[data-server-rendered]')) {
            console.log('✅ 检测到Vue框架');
        }
        
        // 查找data-e2e属性（测试标识符）
        const testElements = document.querySelectorAll('[data-e2e]');
        if (testElements.length > 0) {
            console.log(`找到 ${testElements.length} 个测试标识符元素:`);
            const uniqueIds = [...new Set(Array.from(testElements).map(el => el.getAttribute('data-e2e')))];
            uniqueIds.slice(0, 10).forEach(id => console.log(`  - data-e2e="${id}"`));
            if (uniqueIds.length > 10) {
                console.log(`  ... 还有 ${uniqueIds.length - 10} 个`);
            }
        }
    }
    
    // 分析输入框
    function analyzeInputElements() {
        console.log('\n📝 分析输入框元素:');
        
        const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        
        if (inputs.length > 0) {
            console.log(`找到 ${inputs.length} 个输入元素:`);
            inputs.forEach((input, i) => {
                console.log(`  ${i+1}. ${input.tagName}`);
                console.log(`     类型: ${input.type || 'N/A'}`);
                console.log(`     placeholder: ${input.placeholder || input.getAttribute('placeholder') || 'N/A'}`);
                console.log(`     类名: ${input.className}`);
                if (input.contentEditable === 'true') {
                    console.log('     可编辑: true');
                }
            });
        } else {
            console.log('❌ 未找到输入元素');
        }
    }
    
    // 生成选择器建议
    function generateSelectorSuggestions(possibleButtons) {
        console.log('\n💡 选择器建议:');
        
        if (possibleButtons.length > 0) {
            console.log('基于找到的元素，建议使用以下选择器:');
            
            possibleButtons.forEach((btn, i) => {
                const suggestions = [];
                
                if (btn.className) {
                    const classes = btn.className.split(' ').filter(c => c.length > 0);
                    if (classes.length > 0) {
                        suggestions.push(`.${classes[0]}`);
                        if (classes.length > 1) {
                            suggestions.push(`.${classes.slice(0, 2).join('.')}`);
                        }
                    }
                }
                
                if (btn.text) {
                    suggestions.push(`${btn.tagName.toLowerCase()}:contains("${btn.text}")`);
                }
                
                console.log(`  ${i+1}. 针对 "${btn.text}":`);
                suggestions.forEach(suggestion => console.log(`     - ${suggestion}`));
            });
        }
        
        console.log('\n通用建议选择器:');
        console.log('  - a[href*="message"], a[href*="chat"], a[href*="im"]');
        console.log('  - button[aria-label*="私信"], [data-e2e*="message"]');
        console.log('  - .nav-item, .header-item, .navigation-item');
    }
    
    // 执行所有分析
    analyzeNavigation();
    const possibleButtons = analyzePrivateMessageButtons();
    analyzeLinks();
    analyzeComponents();
    analyzeInputElements();
    generateSelectorSuggestions(possibleButtons);
    
    console.log('\n✅ 分析完成！请查看上述信息来优化脚本选择器。');
    
    // 提供辅助函数供手动测试
    window.douyinAnalyzer = {
        findPrivateMessageButton: function() {
            console.log('🔍 测试增强的私信按钮查找...');
            // 这里可以调用实际的findPrivateMessageButton函数
            return possibleButtons;
        },
        highlightElements: function(selector) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.border = '3px solid red';
                el.style.background = 'yellow';
            });
            console.log(`高亮了 ${elements.length} 个元素: ${selector}`);
            
            // 5秒后清除高亮
            setTimeout(() => {
                elements.forEach(el => {
                    el.style.border = '';
                    el.style.background = '';
                });
            }, 5000);
        }
    };
    
    console.log('\n🛠️ 可用的辅助函数:');
    console.log('  - douyinAnalyzer.highlightElements("选择器") - 高亮匹配的元素');
    console.log('  - douyinAnalyzer.findPrivateMessageButton() - 测试按钮查找');
    
})();