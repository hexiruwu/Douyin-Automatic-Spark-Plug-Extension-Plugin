# 抖音自动续火花脚本 - 快速设置指南

## 📦 安装使用

### 方法1: 直接使用改进版脚本

1. **安装Tampermonkey插件**
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)

2. **导入脚本**
   - 复制 `project.js` 中的全部内容
   - 在Tampermonkey中创建新脚本
   - 粘贴并保存

3. **配置参数**
   ```javascript
   // 修改联系人列表
   const CONTACTS = ["你的联系人1", "你的联系人2"];
   
   // 修改消息内容
   const MESSAGE = "你想发送的消息内容";
   
   // 修改发送间隔（可选）
   const INTERVAL = 1000 * 60 * 60 * 24; // 24小时
   ```

### 方法2: 测试脚本功能

1. **下载测试页面**
   - 保存 `test_improvements.html` 到本地
   - 用浏览器打开

2. **测试各项功能**
   - 点击测试按钮验证功能
   - 查看测试结果

## 🔧 配置说明

### 联系人配置
```javascript
const CONTACTS = ["HH", "联系人2"];
```
⚠️ **注意**: 联系人昵称必须与抖音私信列表中显示的完全一致

### 消息内容配置
```javascript
const MESSAGE = "[自动程序发送]续火花咯！";
```

### 定时设置
```javascript
const ENABLE_AUTO = true;  // 启用自动执行
const SCHEDULE_TIME = "09:00";  // 每天9点执行
```

## 🚀 使用步骤

1. **打开抖音网站** - https://www.douyin.com
2. **登录账号** - 确保已登录
3. **启动脚本** - 点击右上角的"手动续火花"按钮
4. **查看日志** - 点击"🐛 查看日志"按钮查看执行情况

## 🐛 故障排除

### 常见问题

#### 1. "未找到私信按钮"
**解决方案:**
- ✅ 确认页面已完全加载
- ✅ 确认已登录抖音账号
- ✅ 刷新页面重试
- ✅ 检查浏览器控制台错误信息

#### 2. "未找到联系人"
**解决方案:**
- ✅ 检查联系人昵称是否正确
- ✅ 确认联系人在私信列表中
- ✅ 确认已成功进入私信页面

#### 3. "未找到消息输入框"
**解决方案:**
- ✅ 确认已成功选择联系人
- ✅ 等待聊天界面完全加载
- ✅ 检查是否有权限发送消息

### 高级调试

#### 1. 使用网站结构分析工具
```javascript
// 在抖音网站控制台中运行
// 复制 analyze_douyin_structure.js 内容并执行
```

#### 2. 启用详细日志
```javascript
// 在脚本配置中添加
errorReporter.logLevel = 'DEBUG';
```

#### 3. 手动测试选择器
```javascript
// 在控制台测试
douyinAnalyzer.highlightElements('你的选择器');
```

## ⚙️ 高级配置

### 自定义等待时间
```javascript
const WAIT = 3000; // 增加到3秒（如果网络较慢）
```

### 自定义重试次数
修改各函数中的循环次数：
```javascript
for (let i = 0; i < 20; i++) { // 增加到20次
```

### 添加自定义选择器
在 `findPrivateMessageButton` 函数中添加：
```javascript
const customSelectors = [
    '.your-custom-selector',
    '[data-your-attribute]'
];
```

## 📱 浏览器兼容性

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Edge
- ⚠️ Safari (可能需要额外配置)

## 🔒 隐私安全

- ✅ 脚本仅在抖音网站运行
- ✅ 不收集任何个人信息
- ✅ 不向外部服务器发送数据
- ✅ 开源代码，可自行审查

## 📞 技术支持

如果遇到问题：

1. **查看错误日志** - 使用脚本内置的日志功能
2. **运行分析工具** - 使用提供的网站结构分析脚本
3. **检查配置** - 确认联系人昵称等配置正确
4. **更新脚本** - 确保使用最新版本的增强脚本

## 🎯 成功指标

脚本正常工作时，你应该看到：
- ✅ 找到私信按钮并成功点击
- ✅ 成功进入私信界面
- ✅ 找到并选择目标联系人
- ✅ 成功发送消息
- ✅ 显示执行成功通知

---

💡 **小贴士**: 首次使用建议先进行手动测试，确认所有功能正常后再启用自动执行。