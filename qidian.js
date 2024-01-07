console.show();
auto.waitFor();
console.setTitle("调试");
console.setPosition(5, device.height / 3)
console.setSize(device.width / 6, device.width / 2)
var ham = hamibot.env
var bounds
var centerX
var centerY
var right
var sp = 0
// setScreenMetrics(device.width, device.height);
//提取数字
function jstime(datatime) {
    var textObj = datatime
    // 存储初始文本内容
    var initText = textObj.text();
    log(initText)
    //获取时间
    var match = initText.match(/\d+/g);
    if (match) {
        var numbers = [];
        for (var i = 0; i < match.length; i++) {
            numbers.push(parseInt(match[i]));
        }
        return numbers[0]
    } else {
        return null
    }
}
//提取坐标中心
function getXy(obj) {
    var button = obj;
    var bounds = button.bounds();
    var centerX = (bounds.left + bounds.right) / 2;
    var centerY = (bounds.top + bounds.bottom) / 2;

    return {
        centerX: centerX,
        centerY: centerY
    };
}
//启动起点
function start() {
    if (auto.service == null) {
        log("请先开启无障碍服务！");
    } else {
        log("无障碍服务已开启");
        home()
        sleep(1000)
        app.launchPackage("com.qidian.QDReader");
        waitForPackage('com.qidian.QDReader')
        waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
        id("btnCheckIn").waitFor
        bounds = className("android.widget.FrameLayout").depth(0).findOne()
        centerX = getXy(bounds).centerX;
        centerY = getXy(bounds).centerY;
        right = bounds.bounds().right
        log("应用已启动")
        sleep(1500)
        back()
    }
}

//签到
function qdao() {
    log("签到")
    id("btnCheckIn").findOne().click()
    //等待加载
    log("等待抽奖")
    text("福利中心经验值").waitFor()
    sleep(1500)
    var today = new Date();
    var dayOfWeek = today.getDay();

    if (descContains("抽奖").exists()) {
        log("点击抽奖")
        descContains("抽奖").findOne().click()
    }
    log("抽奖详情")
    while (true) {
        if (textContains("明日").exists() || descContains("明日").exists()) {
            log("抽奖结束")
            break
        }
        sleep(1500)
        if (className("android.view.View").text("抽 奖").exists()) {
            log("点击抽奖")
            className("android.view.View").text("抽 奖").findOne().click()
            log("等待转盘结束")
            sleep(3000)
        } else {
            log("点击看视频抽奖喜+1")
            textContains("看视频抽奖喜+1").findOne().click()
            waitad()
            sleep(1000)
        }
    }
    if (dayOfWeek === 0) {
        log("今天是周日");
        text("周日兑换章节卡").findOne().parent().click()
        sleep(500)
        className("android.widget.ListView").depth(17).findOne().children().forEach(child => {
            var target = child.findOne(className("android.view.View").desc("兑换"));
            target.click();
        });
        sleep(500)
        className("android.view.View").desc("兑换").clickable(true).depth(16).findOne().click()
        // click(centerX, centerY)
        // sleep(500)
    } else {
        log("今天不是周日");
    }
    if (ham.checkbox_03) {
        //勾选福利任务
        click('领取', 0)
    } else {
        back()
    }
}

//看视频
function lookvd() {
    if (!ham.checkbox_01) {
        //不勾选签到时
        id("view_tab_title_title").className("android.widget.TextView").text("我").findOne().parent().parent().click()
        waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
        sleep(1000)
        if (textContains("我知道了").exists()) {
            textContains("我知道了").findOne().click()
        }
        textContains("福利中心").findOne().parent().click()
    }
    log("等待福利中心加载")
    text("限时彩蛋").waitFor()
    log("看视频")

    while (true) {
        sleep(500)
        if (textContains("宝箱").exists()) {
            textContains("宝箱").findOne().click()
            waitad()

        }
        if (textContains("看视频").exists() && !(textContains("明日").exists())) {
            textContains("看视频").findOne().click()
            waitad()

        } else if (desc("看视频").exists()) {
            desc("看视频").findOne().click()
            waitad()

        } else {
            break
        }
    }
    log("听书")
    listenToBook()
    log("玩游戏")
    play()
    log("领取奖励")
    getPrize()
    log("碎片兑换")
    buy()
    while (true) {
        if (id("btnCheckIn").exists()) {
            break
        } else {
            back()
            sleep(800)
        }
    }
}

//激励碎片
function looksp() {
    log('领碎片')
    id("view_tab_title_title").className("android.widget.TextView").textContains("精选").findOne().parent().parent().click()
    log('已进入精选')
    id("layoutTitle").className("android.widget.TextView").text(" ").findOne().parent().parent().click()
    log('已进入新书')
    log('点击换一换')
    textContains('换一换').findOne().parent().click()
    sleep(800)
    id("rootBookLayout").findOne().click()
    log('已进入小说详细页')
    id("goReadLayout").findOne().click()
    log('已打开小说')
    waitForActivity("com.qidian.QDReader.ui.activity.QDReaderActivity");
    sleep(2000)
    //找红包
    while (true) {

        while (true) {
            log('找红包位置')
            while (true) {
                click(right - 1, centerY);
                sleep(500)
                click(centerX, centerY);
                log('点击屏幕')
                sleep(700)
                if (id("ivAudioContentB").exists()) {
                    break
                }
            }
            if (textContains("下一章").findOne().info.clickable) {
                textContains("下一章").findOne().click()
                // sleep(500)
                // textContains("下一章").findOne().click()
                // sleep(300)

            } else {
                textContains("下一章").findOne().parent().click()
                // sleep(500)
                // textContains("下一章").findOne().parent().click()
                // sleep(300)

            }
            waitForActivity("com.qidian.QDReader.ui.activity.QDReaderActivity");
            click(1, centerY);
            click(1, centerY);
            sleep(800)
            if (id("layout_hongbao").exists()) {
                log('红包位置已找到')
                break
            }
        }
        i = id("tv_hongbao_value").findOne().text()
        if (i == "0个") {
            log('没有红包')
            break
        }
        id("layout_hongbao").findOne().click()
        sleep(1000)
        id("layoutHongbaoRoot").findOne().click()
        //看视频
        waitad()
        //领碎片
        sleep(500)
        log('领碎片')
        id("btnRight").findOne().click()
        sleep(700)
        if (id("btnOk").exists()) {
            id("btnOk").findOne().click()
        }
        sleep(700)
        click(right - 1, centerY);
    }
    log('碎片已领完')
    back()
    id("btnLeft").findOne().click()
    sleep(500)
    back()
    sleep(500)
    back()
}

//兑换
function buy() {
    desc('更多好礼').findOne().click()
    text('畅享卡').waitFor()
    var one
    var two
    var three
    one = textStartsWith('7天').findOne().parent()
    two = textStartsWith('3天').findOne().parent()
    three = textStartsWith('1天').findOne().parent()
    one = one.child(one.childCount() - 1)
    two = two.child(two.childCount() - 1)
    three = three.child(three.childCount() - 1)
    if (one.text() == '兑换') {
        one.click()
        sleep(500)
        if (textContains("确认").exists()) {
            className("android.widget.Button").text("确认").findOne().click()
            log('兑换成功7天')
        }
    }
    if (two.text() == '兑换') {
        two.click()
        sleep(500)
        if (textContains("确认").exists()) {
            className("android.widget.Button").text("确认").findOne().click()
            log('兑换成功3天')
        }
    }
    if (three.text() == '兑换') {
        three.click()
        sleep(500)
        if (textContains("确认").exists()) {
            className("android.widget.Button").text("确认").findOne().click()
            log('兑换成功1天')
        }
    }
    sleep(1000)
}

//等待广告
function waitad() {
    sp++
    log('看视频' + sp + '个')
    log('看广告')
    sleep(500)
    textContains("观看").waitFor()
    // className("android.widget.Image").waitFor()
    // text("muteOn").waitFor()
    // className("android.view.View").depth(6).waitFor()
    // className("android.view.View").clickable(true).depth(11).waitFor()
    // sleep(1000)  id("d") id("b")
    var video_quit//退出坐标
    video_quit = textContains("观看").findOne().bounds()
    var x1 = 0;
    var x2 = video_quit.left;
    var y1 = video_quit.top;
    var y2 = video_quit.bottom;
    // 退出坐标
    // var ads = textContains("观看").findOne().parent().children()
    // bounds = ads[0]
    // X = getXy(bounds).centerX;
    // Y = getXy(bounds).centerY;
    //等待时间
    var time = adtime()
    if (time) {
        //成功获取时间
        log('等待' + time + '秒')
        sleep(1000 * (time + 1))
    } else {
        //获取不到时间
        var num = 0
        var isOne = true
        while (true) {
            sleep(500)
            if (textContains("已").exists() || !(textContains("观看").exists())) {
                log("视频已结束")
                break
            } else {
                num++
                sleep(1000)
                log('等待' + num + '秒')
                if (isOne) {
                    log('获取不到时间，重新获取')
                    log('点击退出')
                    // quitad.click()
                    while (true) {
                        click(parseInt((x1 + x2) / 2 + 1), parseInt((y1 + y2) / 2))
                        sleep(500)
                        if (textContains("继续观看").exists()) {
                            break
                        }
                    }
                    time = adtime()
                    if (time) {
                        log('成功获取')
                        textContains("继续观看").findOne().click()
                        log('等待' + time + '秒')
                        sleep(1000 * (time + 1))
                        break
                    } else {
                        log('等待视频结束')
                        textContains("继续观看").findOne().click()
                        isOne = false
                    }
                }
            }
        }
    }
    //点击退出

    while (true) {
        log('点击退出')
        click(parseInt((x1 + x2) / 2 + 1), parseInt((y1 + y2) / 2))
        sleep(500)
        if (textContains("继续观看").exists()) {
            time = adtime()
            textContains("继续观看").findOne().click()
            log('等待' + time + '秒')
            sleep(1000 * (time + 1))
        } else {
            break
        }
    }   
    log("广告已关闭")
    sleep(500)
    if (desc("我知道了").exists()) {
        desc("我知道了").findOne().click()
    }
}
//判断广告时间
function adtime() {
    return jstime(textContains("观看").findOne())
}

//听书
function listenToBook() {
    var bookV
    var bookVs//集合
    var bookVi//数量
    bookV = textContains("当日听书").findOne().parent()
    bookVs = bookV.children()
    bookVi = bookV.childCount()
    if (bookVs[bookVi - 1].child(0)) {
        if (bookVs[bookVi - 1].child(0).text() == '去完成') {
            bookVs[bookVi - 1].click()
            text("听原创小说").waitFor()
            var xy = getXy(id("playIv").findOne())
            click(xy.centerX, xy.centerY)
            // id("flIvContent").waitFor()
            // id("pagContent").waitFor()
            // waitForActivity('com.qidian.QDReader.ui.activity.AudioPlayActivity')
            sleep(4500)
            back()
            sleep(500)
            if (id("btnLeft").exists()) {
                id("btnLeft").findOne().click()
            }
            back()
        }
    }
}

//玩游戏
function play() {
    var game
    var games//集合
    var gamei//数量
    game = textContains("当日玩游戏").findOne().parent()
    games = game.children()
    gamei = game.childCount()
    if (games[gamei - 3].child(0)) {
        if (games[gamei - 3].child(0).text() == '去完成') {
            while (true) {
                sleep(5000)
                var pt = playtime()
                if (pt) {

                    games[gamei - 3].click()
                    log("前往游戏中心")
                    // sleep(500)com.qidian.QDReader.ui.activity.QDBrowserActivity
                    // waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
                    // textContains("今日必玩推荐").waitFor()
                    // textContains("本周热门").waitFor()
                    sleep(10000)
                    swipe(1, device.height, 1, device.height / 20, 500)
                    sleep(500)
                    textContains("在线玩").findOne().parent().click()
                    log("进入游戏")
                    log('剩余' + pt + '分钟')
                    sleep(1000 * 60 * (pt + 0.5))
                    back()
                    sleep(1500)
                    back()
                    sleep(1500)
                    back()
                    if (ham.checkbox_01) {
                        text("福利中心经验值").waitFor()
                        click(right, centerY)
                        sleep(500)
                        click('领取', 0)
                    } else {
                        textContains("福利中心").findOne().parent().click()
                    }
                    log("等待福利中心加载")
                    text("限时彩蛋").waitFor()
                } else {
                    break
                }
            }
        }
    }
}
//判断游戏时间
function playtime() {
    var game
    var games//集合
    var gamei//数量
    game = textContains("当日玩游戏").findOne().parent()
    games = game.children()
    gamei = game.childCount()
    return jstime(games[gamei - 1]) - jstime(games[gamei - 2])
}
//领取
function getPrize() {
    var prizePool
    prizePool = textContains("领奖励").find()
    for (i = 0; i < prizePool.length; i++) {
        prizePool[i].click()
        sleep(500)
        if (desc("我知道了").exists()) {
            desc("我知道了").findOne().click()
        }
    }
}

// qdao()
// lookvd()
// looksp()

//签到
start()
//领碎片
if (ham.checkbox_02) {
    looksp()
}
if (ham.checkbox_01) {
    qdao()
}
//做福利任务
if (ham.checkbox_03) {
    lookvd()
}



// listenToBook()
// play()
console.hide()
engines.stopAllAndToast()
// var screenHeight = device.height;

// var bounds = className("android.widget.FrameLayout").depth(1).findOne();
//     var centerX = getXy(bounds).centerX;
//     var centerY = getXy(bounds).centerY;
//     var right = bounds.bounds().right
//     click(centerX, centerY);
// // 计算滑动距离
// var distance = screenHeight / 2;

// // 滑动屏幕
// swipe(device.width / 2, screenHeight - distance, device.width / 2, distance, 500);
// listenToBook()
// buy()去完成text("当日游戏充值1次")com.qidian.QDReader.ui.activity.QDBrowserActivity
// log(textContains("看视频").exists())
// log(desc("看视频").exists())
// p=id("task_957227467168022528").findOne()
// log(p.text())
// log(p.child(p.childCount()-2).text())
// log(p.child(p.childCount()-1).text())
// var textObj = textContains("观看").findOne();
//     // 存储初始文本内容
//     var initText = textObj.text();
//     log(initText)
//     //获取时间
//     var match = initText.match(/\d+/g);
//     if (match) {
//         var numbers = [];
//         for (var i = 0; i < match.length; i++) {
//             numbers.push(parseInt(match[i]));
//         }
//         return numbers[0]
//     } else {
//         return null
//     }






