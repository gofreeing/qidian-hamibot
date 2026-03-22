"ui"; // 第一行必须是这个

var taskMode = "all"; // 全局变量，记录用户选了什么模式

ui.layout(
    <vertical padding="16">
        <text text="起点福利中心助手" textSize="22sp" gravity="center" margin="10" textColor="#333333" />
        <button id="btn_video" text="1. 只看视频任务" margin="8" height="60" />
        <button id="btn_game" text="2. 只挂游戏任务" margin="8" height="60" />
        <button id="btn_all" text="3. 全部顺序执行" margin="8" height="60" />
        <text text="点击按钮后，脚本将自动运行" margin="10" gravity="center" textColor="#666666" />
    </vertical>
);

// --- 核心修复：点击事件必须用 threads.start ---

ui.btn_video.click(() => {
    taskMode = "video";
    runScript(); // 调用下面定义的启动函数
});

ui.btn_game.click(() => {
    taskMode = "game";
    runScript();
});

ui.btn_all.click(() => {
    taskMode = "all";
    runScript();
});

function runScript() {
    threads.start(function () {
        updateLog("当前执行模式: " + taskMode);
        try {
            main();
        } catch (e) {
            updateLog("发生异常: " + e);
        } finally {
            device.cancelKeepingAwake();
            updateLog("脚本运行结束。");
            // --- 关键修改点：关闭 UI 页面 ---
            ui.post(() => {
                ui.finish(); // 彻底关闭脚本界面
            });
        }
    });
}

var qidianPackageName = "com.qidian.QDReader";

// --- 1. 配置：任务筛选与全词库 ---
var whiteList = ["激励任务", "惊喜福利", "3个广告", "玩游戏", "再玩"];
var claimKeywords = ["领奖励", "领章节卡", "领积分"];

var jumpKeywords = ["下载应用", "了解更多", "查看详情", "点击.*", "去.*", "立即.*", "领取.*"];
var timerKeywords = ["获得奖励", "看", "秒", "还剩", "浏览", "继续看", "点击后"];
var jumpRegex = new RegExp(jumpKeywords.join("|"));

// --- 2. 基础工具函数 ---

function jstime(textStr) {
    if (!textStr) return null;
    let reg = /(?:还剩|看|浏览|等待|继续看|点击后)\s*(\d+)\s*秒|(\d+)\s*秒(?:后)?/g;
    let match = reg.exec(textStr);
    if (match) return parseInt(match[1] || match[2]);
    return null;
}

function strHasArr(s, a) {
    if (!s) return false;
    for (let i = 0; i < a.length; i++) {
        // 如果关键词里包含正则表达式符号 .*
        if (a[i].indexOf(".*") > -1) {
            if (new RegExp(a[i]).test(s)) return true;
        } else {
            // 普通文字匹配
            if (s.indexOf(a[i]) > -1) return true;
        }
    }
    return false;
}

function clickParentIfClickable(widget) {
    if (!widget) return false;
    if (widget.clickable()) return widget.click();
    let p = widget.parent();
    if (p) return clickParentIfClickable(p);
    return false;
}

function findCloseBtn() {
    let reg = /.*close.*|.*[xX×✕].*|关闭|退出|放弃|知道了|收下奖励|领奖成功|跳过/;

    // --- 策略 A: 尝试属性匹配 (ID, Text, Desc) ---
    let btn = idMatches(reg).findOnce() || textMatches(reg).findOnce() || descMatches(reg).findOnce();
    if (btn) {
        updateLog("侦测到属性匹配按钮: [" + (btn.text() || btn.desc() || "ID属性") + "]");
        return btn;
    }

    // --- 策略 B: 利用 OCR 结果定位 (处理图片里的 X) ---
    let img = captureScreen();
    if (img) {
        let results = paddle.ocr(img);
        for (let res of results) {
            // 如果 OCR 在右上角区域识别到了类似 x, X, ×, ✕ 的符号
            if (res.text.match(/[xX×✕✕]/) && res.bounds.left > device.width * 0.6 && res.bounds.bottom < device.height * 0.2) {
                updateLog("OCR 识别到图片中的关闭符号: " + res.text);
                // 构造一个兼容的对象返回
                return { bounds: () => res.bounds, clickable: () => true };
            }
        }
    }

    // --- 策略 C: 坐标判定优化 ---
    let list = classNameMatches(/.*View|.*ImageView|.*ViewGroup/).find();
    let target = null;
    let maxRight = 0;

    for (let i = 0; i < list.length; i++) {
        let b = list[i].bounds();
        if (b.left > device.width * 0.85 && b.top < device.height * 0.2 && b.top > 40) {
            if (b.width() > 50 && b.width() < 160 && Math.abs(b.width() - b.height()) < 25) {
                // 如果有多个，取最靠右的一个
                if (b.left > maxRight) {
                    maxRight = b.left;
                    target = list[i];
                }
            }
        }
    }

    if (target) {
        updateLog("侦测到最右侧关闭容器: " + target.className());
        return target;
    }
    updateLog("所有策略均未找到按钮");
    return null;
}

function closeAdByScan() {
    updateLog("启动精准盲点补偿...");
    // 往左多靠一点，不要在最边缘点
    let xr = device.width - 60;
    // 增加覆盖范围：从高度 150 扫描到 450
    for (let i = 0; i < 10; i++) {
        let yr = 200 + (i * 30);
        click(xr, yr);
        // 如果点中了，页面通常会发生变化
        if (textMatches(/激励任务|领奖励|去完成/).exists()) {
            updateLog("盲点成功归位");
            return;
        }
        sleep(100);
    }
}

function updateLog(txt) { console.info("> " + txt); }

function getFreshCapture() {
    swipe(500, 1000, 501, 1001, 5); 
    sleep(300); 
    let temp = captureScreen();
    if (temp) temp.recycle(); 
    let realCap = captureScreen();
    return realCap;
}

// --- 3. 强化版启动逻辑 ---

function cleanPopups() {
    let currAct = currentActivity();
    if (currAct.indexOf("dialog") > -1 || currAct.indexOf("judian") > -1) {
        updateLog("检测到弹窗 [" + currAct.split('.').pop() + "]，执行 back...");
        back();
        sleep(1000);
        return true;
    }
    return false;
}

function launchAndGo() {
    updateLog("准备启动起点 App...");
    app.launchPackage(qidianPackageName);

    let atMePage = false;
    for (let i = 0; i < 15; i++) {
        let currAct = currentActivity();
        updateLog("当前页面: " + currAct.split('.').pop());

        if (currAct.indexOf("dialog") > -1 || currAct.indexOf("judian") > -1) {
            updateLog("检测到 Activity 弹窗，执行 back...");
            back(); sleep(1500);
            continue;
        }

        if (currAct.indexOf("MainGroupActivity") > -1) {
            if (text("福利中心").exists()) {
                updateLog("成功到达【我】页面");
                atMePage = true;
                break;
            } else if (i > 3) {
                updateLog("疑似存在 View 型弹窗遮挡，尝试执行 back...");
                back();
                sleep(1500);
            }
        }

        let meTab = text("我").boundsInside(0, device.height * 0.8, device.width, device.height).findOnce();
        if (meTab) {
            updateLog("点击底部【我】Tab");
            clickParentIfClickable(meTab);
        } else {
            updateLog("等待主页加载...");
        }

        sleep(1500);
    }

    if (!atMePage) {
        updateLog("无法确认进入【我】页面，尝试直接寻找福利中心...");
    }

    let entryClicked = false;
    for (let i = 0; i < 5; i++) {
        cleanPopups(); 

        let fcEntry = text("福利中心").findOnce();
        if (fcEntry) {
            updateLog("点击进入福利中心...");
            clickParentIfClickable(fcEntry);
            entryClicked = true;
            break;
        }
        sleep(1000);
    }

    if (entryClicked) {
        let isLoaded = false;
        for (let i = 0; i < 12; i++) {
            if (currentActivity().indexOf("QDBrowserActivity") > -1) {
                if (classNameContains("WebView").exists() || textMatches(/规则|去完成/).exists()) {
                    updateLog("福利中心加载成功");
                    sleep(2500); 
                    isLoaded = true;
                    break;
                }
            }
            sleep(1000);
        }
        return isLoaded;
    }
    return false;
}

// --- 4. 游戏任务处理逻辑 ---

function game_look(btn, taskInfo) {
    let min = 0;
    let match = taskInfo.match(/再玩(\d+)分钟/);
    if (match) {
        min = parseInt(match[1]);
        updateLog("识别到任务需要挂机: " + min + " 分钟");
    } else {
        updateLog("未能识别分钟数，跳过挂机逻辑，按普通视频任务处理");
        return;
    }

    let totalMin = min + 1;

    if (!clickParentIfClickable(btn)) click(btn.bounds().centerX(), btn.bounds().centerY());
    sleep(4000);

    updateLog("正在寻找进入点...");
    let rankBtn = text("排行").findOne(5000);
    if (rankBtn) {
        click(rankBtn.bounds().centerX(), rankBtn.bounds().centerY());
        sleep(2500);
        text("在线玩").findOne().click(); 
    } else {
        swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.3, 800);
        text("在线玩").findOne().click();
    }
    sleep(5000); 

    device.wakeUp();
    device.keepScreenOn(totalMin * 60 * 1000 + 10000);

    for (let i = totalMin; i > 0; i--) {
        updateLog("游戏挂机中，剩余 " + i + " 分钟...");
        swipe(device.width / 2, device.height / 2, device.width / 2 + 30, device.height / 2 + 30, 300);
        sleep(60000); 

        if (textMatches(/福利中心|激励任务/).exists()) {
            updateLog("检测到已不在游戏页面，提前结束计时");
            break;
        }
    }

    device.cancelKeepingAwake();
    updateLog("挂机时间到，正在返回福利中心...");
    let backCount = 0;
    while (!textMatches(/福利中心|激励任务|去完成|已领取/).exists() && backCount < 6) {
        back(); sleep(2000); backCount++;
    }
}

// --- 5. 视频处理逻辑 ---

function video_look(btn, taskInfo) {
    updateLog("点击广告任务，进入监测...");
    clickParentIfClickable(btn);

    let vCount = 0;
    while (vCount < 15) {
        if (textMatches(/.*验证.*|.*依次点击.*/).exists() || textContains("安全验证").exists()) {
            device.vibrate(500);
            updateLog("发现验证码，请手动处理...");
            while (textMatches(/.*验证.*|.*依次点击.*|确认|确定/).exists()) { sleep(2000); }
            updateLog("验证完毕"); sleep(2000);
        }
        if (!text("激励任务").exists()) break;
        sleep(1000); vCount++;
    }

    let adFinished = false;
    let jumpRegex = new RegExp(jumpKeywords.join("|"));

    while (!adFinished) {
        updateLog("--- 进入动态核验模式 ---");
        let igniteMode = "";
        let isConfirmedSilent = false;
        let lastDetectedSec = -1;

        let startTime = Date.now();
        let targetEndTime = startTime + 22000;

        while (Date.now() < targetEndTime) {
            if (textMatches(/恭喜|已获得|重新播放|领奖成功|知道了/).exists()) {
                updateLog("检测到奖励达标标识，提前结束。");
                adFinished = true; break;
            }
            
            let cap = getFreshCapture();
            if (cap) {
                updateLog("截屏中---");
                let res = paddle.ocr(cap);
                cap.recycle();

                let headerStr = "";
                let fullStr = "";
                let currentSec = -1;
                let ocrBtnObj = null;
                
                for (let r of res) {
                    if (r.bounds.top < device.height * 0.15) {
                        headerStr += r.text;
                    }
                    fullStr += r.text;
                    let s = jstime(r.text);
                    if (s !== null) currentSec = s;

                    if (strHasArr(r.text, jumpKeywords) && r.text.length <= 10) {
                        ocrBtnObj = r;
                    }
                }

                let isIgniteAd = false;
                if (headerStr.indexOf("点击") > -1 && igniteMode == "") {
                    if (/观看|还剩/.test(fullStr) || fullStr.match(/看\d+秒/)) {
                        if (headerStr.indexOf("点击后") > -1 || headerStr.indexOf("点击浏览") > -1) {
                            isIgniteAd = true;
                        }
                    } else {
                        isIgniteAd = true;
                    }
                }

                // --- MODIFIED: 移除嵌套 1.2s 重试，依靠外层 while 循环自然轮询 ---
                if (isIgniteAd) {
                    let waitSec = jstime(headerStr) || 15;
                    let randomExtra = (Math.random() * 1 + 1).toFixed(1);
                    let finalWait = (parseFloat(waitSec) + parseFloat(randomExtra)).toFixed(1);

                    updateLog("核验：【点火类】，避免静默广告误判，等待 " + finalWait + " 秒后归位...");
                    igniteMode = performIgniteAction(ocrBtnObj);

                    if (igniteMode != "") {
                        sleep(finalWait * 1000);
                        break; 
                    }
                }

                if (currentSec > 0 && igniteMode == "") {
                    if (lastDetectedSec != -1 && currentSec < lastDetectedSec) {
                        if (!isConfirmedSilent) updateLog("监测：【静默广告】倒计时中... (当前: " + currentSec + "s)");
                        isConfirmedSilent = true;
                    }
                    lastDetectedSec = currentSec;
                    targetEndTime = Date.now() + (currentSec + 2) * 1000;
                }
            }
            sleep(2000);
        }

        updateLog("计时结束，正在收尾...");

        let sysPkgs = ["miui.systemui.plugin", "com.miui.securitycore", "com.android.systemui", "android", "com.android.packageinstaller", "com.android.settings", "com.miui.securitycenter", "com.huawei.android.packageinstaller"];

        if (igniteMode == "internal_browser" && currentPackage() == qidianPackageName) {
            updateLog("当前处于内部浏览器，执行 Back 返回原广告页...");
            back(); sleep(2000);
        }

        let cancelBtn = textMatches(/取消|拒绝|放弃|留在.*/).findOnce();
        if (cancelBtn || sysPkgs.indexOf(currentPackage()) > -1) {
            if (cancelBtn) {
                updateLog("发现系统拦截框，点击 [" + cancelBtn.text() + "] 归位...");
                click(cancelBtn.bounds().centerX(), cancelBtn.bounds().centerY());
                let waitPkg = 0;
                while (sysPkgs.indexOf(currentPackage()) > -1 && waitPkg < 6) { sleep(500); waitPkg++; }
                if (currentPackage() == qidianPackageName && (classNameContains("WebView").exists() || className("android.widget.ProgressBar").exists())) {
                    updateLog("判定处于内部浏览器落地页，执行 Back 返回广告页...");
                    back(); sleep(1500);
                }
            } else {
                updateLog("处于系统环境，执行返回...");
                back(); sleep(1500);
            }
        }

        let finalPkg = currentPackage();
        if (finalPkg != qidianPackageName && finalPkg.indexOf("autojs") == -1 && sysPkgs.indexOf(finalPkg) == -1) {
            updateLog("确认处于真正的外部 App [" + finalPkg + "]，执行快速归位...");
            let backRetry = 0;
            while (currentPackage() != qidianPackageName && backRetry < 5) {
                updateLog("返回中...");
                back(); sleep(500); backRetry++;
            }
            if (currentPackage() != qidianPackageName && currentPackage().indexOf("autojs") == -1 && sysPkgs.indexOf(currentPackage()) == -1) {
                updateLog("环境依然异常，强行调起起点...");
                app.launchPackage(qidianPackageName);
                sleep(2500);
            }
        }

        if (currentPackage() == qidianPackageName || sysPkgs.indexOf(currentPackage()) > -1) {
            let rewardOk = text("知道了").findOne(500);
            if (rewardOk) {
                updateLog("检测到奖励到账，点击 [知道了]...");
                click(rewardOk.bounds().centerX(), rewardOk.bounds().centerY());
                sleep(1500);
                adFinished = true;
            } else {
                let xBtn = findCloseBtn();
                if (xBtn) {
                    let b = xBtn.bounds();
                    let rx = b.centerX() + Math.round((Math.random() - 0.5) * (b.width() * 0.4));
                    let ry = b.centerY() + Math.round((Math.random() - 0.5) * (b.height() * 0.4));
                    let rt = 100 + Math.floor(Math.random() * 60);
                    updateLog("正在模拟真人点击组件: (" + rx + ", " + ry + ")，时长: " + rt + "ms");
                    press(rx, ry, rt);
                    sleep(500);
                    if (!textMatches(/激励任务|领奖励|去完成|领积分/).exists()) {
                        updateLog("组件点击未生效，触发盲扫兜底...");
                        closeAdByScan();
                    }
                    adFinished = true;
                } else {
                    if (textMatches(/激励任务|领奖励|领积分|去完成/).exists()) {
                        adFinished = true;
                    } else {
                        closeAdByScan();
                    }
                }
            }
        }

        let rescueBtn = text("知道了").findOnce() || text("点击去浏览").findOnce() || text("继续看视频").findOnce();
        if (rescueBtn) {
            updateLog("拦截弹窗，执行点击: " + rescueBtn.text());
            click(rescueBtn.bounds().centerX(), rescueBtn.bounds().centerY());
            sleep(2000);
            if (rescueBtn.text() == "知道了") adFinished = true;
        } else {
            if (textMatches(/激励任务|去完成|领奖励/).exists()) {
                adFinished = true;
            } else {
                back(); sleep(1000);
                if (textMatches(/激励任务|去完成/).exists()) adFinished = true;
            }
        }
    }

    function performIgniteAction(preOcrBtn) {
        let mode = "";
        let uiBtn = textMatches(jumpRegex).findOnce();
        if (uiBtn && uiBtn.bounds().width() > 50) {
            updateLog(">> 命中路径：【UI 系统控件】");
            click(uiBtn.bounds().centerX(), uiBtn.bounds().centerY());
        }
        else if (preOcrBtn) {
            updateLog(">> 命中路径：【OCR 图像识别】");
            click(preOcrBtn.bounds.centerX(), preOcrBtn.bounds.centerY());
        }
        else {
            updateLog(">> 命中路径：【坐标兜底模式】");
            click(device.width / 2, device.height * 0.88);
        }
        sleep(2500); 

        let checkStart = Date.now();
        while (Date.now() - checkStart < 6000) {
            let pkg = currentPackage();
            if (pkg == qidianPackageName && classNameContains("WebView").exists()) {
                mode = "internal_browser"; break;
            }
            if (textMatches(/取消|选择.*应用$/).exists()) {
                mode = "system"; break;
            }
            if (pkg != qidianPackageName && pkg.indexOf("autojs") == -1) {
                mode = "external"; break;
            }
            sleep(1000);
        }
        return mode;
    }
}

// --- 6. 主循环 ---

function main() {
    auto.waitFor();
    // 保持屏幕常亮，防止截图获取到旧的缓存画面
    device.keepScreenOn(3600 * 1000); // 保持1小时，脚本结束后会自动取消
    updateLog("已设置屏幕常亮，防止OCR获取缓存。");

    if (!requestScreenCapture()) return;

    launchAndGo();

    updateLog("正在核验今日核心进度...");

    let scrollRetry = 0;
    while (scrollRetry < 2) {
        let adTaskDone = false;
        let gameTaskDone = false;

        let allTexts = className("android.widget.TextView").find();
        let allBtns = textMatches(/去完成|领奖励|领章节|看视频|领积分/).find();
        let foundAction = false;

        for (let i = 0; i < allBtns.length; i++) {
            let btn = allBtns[i];
            if (btn.bounds().top < 150 || btn.bounds().bottom > device.height - 100) continue;

            let ty = btn.bounds().centerY();
            let rowText = "";
            for (let j = 0; j < allTexts.length; j++) {
                if (Math.abs(allTexts[j].bounds().centerY() - ty) < 90) rowText += allTexts[j].text() + "|";
            }

            if (rowText.indexOf("已领取") > -1 || rowText.indexOf("充值") > -1) continue;

            if (strHasArr(rowText, whiteList)) {
                if (strHasArr(btn.text(), claimKeywords)) {
                    updateLog("检测到奖励可领...");
                    clickParentIfClickable(btn); sleep(2000);
                    let ik = text("知道了").findOnce(); if (ik) ik.click();
                    foundAction = true; break;
                }

                let isGame = rowText.indexOf("再玩") > -1;
                if (isGame) {
                    if (taskMode == "video") continue;
                    game_look(btn, rowText);
                    foundAction = true;
                    scrollRetry = 0;
                    break;
                } else {
                    if (taskMode == "game") continue;
                    if (!adTaskDone) {
                        video_look(btn, rowText);
                        foundAction = true;
                        scrollRetry = 0;
                        break;
                    }
                }
            }
        }

        if (!foundAction) {
            updateLog("下滑搜寻任务...");
            swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.3, 800);
            sleep(2500); scrollRetry++;
        } else {
            swipe(device.width / 2, device.height * 0.3, device.width / 2, device.height * 0.8, 500);
            sleep(2000);
        }
    }
    updateLog("所有核心白名单任务已完成，脚本正常退出。");
}
