console.show();
auto.waitFor();
console.setTitle("自动任务");
console.setPosition(device.width / 3, 0)
console.setSize(device.width / 3, device.height / 3)
var ham = hamibot.env
var bounds
var centerX
var centerY
var right
var sp = 0
var X
var Y
var cxy = false
var ca = false
// 退出坐标对象
var zb
//工具模块
//提取数字
function jstime(textObj) {
    // 存储初始文本内容
    var initText = textObj.text();
    log(initText)
    //获取时间
    var match = initText.match(/\d+/g);
    return match ? parseInt(match[0]) : null;
}
//提取坐标中心
function getXy(obj) {
    var bounds = obj.bounds();
    return {
        centerX: (bounds.left + bounds.right) / 2,
        centerY: (bounds.top + bounds.bottom) / 2
    };
}
//判断广告时间
function adtime() {
    return jstime(textEndsWith("获得奖励").findOne())
}
//返回首页
function backHome(params) {
    while (!(text("书架").exists() && text("精选").exists() && text("听书").exists() && text("发现").exists() && text("我").exists())) {
        back()
    }
    console.log('已到主界面');
}
//点击坐标中心
function clickCenter(params) {
    var center = getXy(params);
    click(center.centerX, center.centerY);
    console.log('点击坐标')
}
//直到能点击
function autoClick_have(params) {
    obj = params.findOne()
    clickParentIfClickable(obj)
    if (cxy) {
        clickCenter(obj)
        cxy = false
    } else {
        //点击事件成功
        return true
    }
}
function clickParentIfClickable(widget) {
    if (widget === null) {
        console.log('找不到');
        return;  // 终止递归的条件：如果 widget 是空值，则结束递归
    }
    if (widget.click()) {
        console.log('已点击');
        return;  // 点击控件
    }
    var parentWidget = widget.parent();  // 获取控件的父类
    if (parentWidget === null) {
        console.log('不可点击');
        return cxy = true;
    }
    clickParentIfClickable(parentWidget);  // 递归调用自身，传入父类控件进行下一次查找和点击
}
//直到能长按 
function autolongClick_have(params) {
    obj = params.findOne()
    longClickParentIfClickable(obj)
}
function longClickParentIfClickable(widget) {
    if (widget === null) {
        console.log('找不到');
        return;  // 终止递归的条件：如果 widget 是空值，则结束递归
    }
    if (widget.longClick()) {
        console.log('已长按');
        return;  // 点击控件
    }
    var parentWidget = widget.parent();  // 获取控件的父类
    if (parentWidget === null) {
        console.log('不可长按');
        return ca = true
    }
    longClickParentIfClickable(parentWidget);  // 递归调用自身，传入父类控件进行下一次查找和点击
}



//主界面模块
//启动起点获取坐标中心点
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
//投推荐票
function poll(params) {
    if (ham.text_01 === '') {
        console.log('没填书');
        return;
    }

    var bookText = textContains(ham.text_01).findOnce();
    if (bookText === null) {
        console.log('没找到该书');
        return;
    }

    longClickParentIfClickable(bookText);
    if (ca) {
        console.log('投票出现问题请重试');
        ca = false;
        return;
    }

    autoClick_have(text('投推荐票'));
    var recommendTicket = textMatches(/拥有\d+主站推荐票/).findOne();
    if (jstime(recommendTicket) > 0) {
        autoClick_have(text('全部'));
        autoClick_have(textMatches(/投\d+票/));
    } else {
        console.log('没有推荐票');
        back();
    }
}
//签到
function qdao() {
    log("签到")
    autoClick_have(textStartsWith('签到'))
    //等待加载   
    waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
    text("阅读积分").waitFor()
    var today = new Date();
    var dayOfWeek = today.getDay();
    autoClick_have(text("连签礼包 "))
    text("连签说明").waitFor()
    do {       
        clickParentIfClickable(text("未领取").findOnce())
    } while (text("未领取").exists());
    back() 
    log("抽奖详情")
    while (true) {
        if (textContains("明日").exists() || textContains("明天").exists() || descContains("明日").exists() || descContains("明天").exists()) {
            log("抽奖结束")
            break
        } else if (descContains("抽奖").exists() && !text("抽 奖").exists() && !text("看视频抽奖喜+1").exists()) {
            log("点击抽奖")
            autoClick_have(descContains("抽奖"))
            log("等待抽奖界面出现")
            sleep(1200)
        } else if (text("抽 奖").exists()) {
            log("点击抽奖")
            autoClick_have(text("抽 奖"))
            log("等待转盘结束")
            sleep(3200)
        } else if (text("看视频抽奖喜+1").exists()) {
            log("点击看视频抽奖喜+1")
            autoClick_have(text("看视频抽奖喜+1"))
            waitad()
            sleep(1200)
            // if (!textContains("抽").exists()) {
            //     log('未退出广告，重新退出')
            //     back()
            //     // clickParentIfClickable(className("android.widget.ImageView").clickable(true).findOne())
            //     // if (cxy) {
            //     //     clickCenter(className("android.widget.ImageView").clickable(true).findOne())
            //     //     cxy = false
            //     // }
            //     // click(X, Y)
            // }
        }
    }
    if (dayOfWeek === 0) {
        log("今天是周日");
        back()
        sleep(1000)
        autoClick_have(textStartsWith('签到'))
        //等待加载
        waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
        text("阅读积分").waitFor()
        // text("周日兑换章节卡").findOne().parent().click()
        autoClick_have(text("周日兑换章节卡"))
        sleep(500)
        array = text("兑换").find()
        clickParentIfClickable(array[array.length - 1])
        sleep(500)
        array = text("兑换").find()
        // console.log(array.length);
        clickParentIfClickable(array[array.length - 1])
        sleep(1500)
    }
    else {
        log("今天不是周日");
    }
    back()

}



//精选模块
//激励碎片
function looksp() {
    log('领碎片')
    autoClick_have(text("精选"))
    log('已进入精选')
    autoClick_have(text("新书"))
    log('已进入新书')
    log('点击换一换')
    autoClick_have(text("换一换"))
    sleep(800)
    autoClick_have(id("rootBookLayout"))
    log('已进入小说详细页')
    autoClick_have(textEndsWith("阅读"))
    log('已打开小说')
    waitForActivity("com.qidian.QDReader.ui.activity.QDReaderActivity");
    // sleep(2000)
    //找红包
    while (true) {
        while (true) {
            log('找红包位置')
            while (true) {
                click(right - 1, centerY);
                click(centerX, centerY);
                log('点击屏幕')
                sleep(700)
                if (text("听书").exists()) {
                    break
                }
            }
            autoClick_have(text("下一章"))
            waitForActivity("com.qidian.QDReader.ui.activity.QDReaderActivity");
            click(1, centerY);
            click(1, centerY);
            sleep(800)
            if (text("红包").exists()) {
                log('红包位置已找到')
                break
            }
        }
        if (text("0个").exists()) {
            log('没有红包')
            break
        }
        log('点击红包')
        autoClick_have(text("红包"))
        log('打开红包')
        autoClick_have(text("马上抢"))
        //看视频
        waitad()
        do {
            if (!text("立即领取").exists() && text("1个").exists()) {
                log('点击红包')
                autoClick_have(text("红包"))
                log('打开红包')
                autoClick_have(text("马上抢"))
                waitad()
            } else {
                break
            }
        } while (true);
        // sleep(700)
        // if (!text("立即领取").exists()) {
        //     back()
        //     sleep(500)
        // }
        //领碎片
        log('领碎片')
        autoClick_have(text("立即领取"))
        sleep(500)
        if (id("btnOk").exists()) {
            id("btnOk").findOne().click()
        }
        click(right - 1, centerY);
    }
    log('碎片已领完')
    back()
    autoClick_have(text("取消"))
    backHome()
    // sleep(500)
    // back()
    // sleep(500)
    // back()
    // sleep(500)
    // back()
}



//福利中心模块
//看视频
function lookvd() {
    autoClick_have(text("我"))
    waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
    sleep(700)
    if (text("我知道了").exists()) {
        autoClick_have(text("我知道了"))
    }
    autoClick_have(textContains("福利中心"))
    log("等待福利中心加载")
    text("限时彩蛋").waitFor()
    do {
        if (text("看视频开宝箱").exists()) {
            autoClick_have(text("看视频开宝箱"))
            // log(2)
            waitad()
            // if (!text("限时彩蛋").exists()) {
            //     back()
            //     sleep(500)
            // }
            // sleep(300)
            // if (text("我知道了").exists()) {
            //     autoClick_have(text("我知道了"))
            // }
        } else if (text("看视频领福利").exists() && !(text("明日再来吧").exists())) {
            autoClick_have(text("看视频领福利"))
            // clickCenter(text("看视频领福利").findOne())
            // log(3)
            waitad()
            // if (!text("限时彩蛋").exists()) {
            //     back()
            //     sleep(500)
            // }

            // if (text("我知道了").exists()) {
            //     autoClick_have(text("我知道了"))
            // }
        } else if (desc("看视频").exists()) {
            autoClick_have(desc("看视频"))
            // clickCenter(desc("看视频").findOne())
            // log(4)
            waitad()
            // if (!text("限时彩蛋").exists()) {
            //     back()
            //     sleep(500)
            // }
            // sleep(300)
            // if (text("我知道了").exists()) {
            //     autoClick_have(text("我知道了"))
            // }
        } else {
            break
        }
    } while (true)
    log('视频已看完')
    log("听书")
    listenToBook()
    log("玩游戏")
    play()
    log("领取奖励")
    getPrize()
    log("碎片兑换")
    buy()
    backHome()

}
//等待广告
function waitad() {
    sp++
    log('看视频' + sp + '个')
    log('看广告')
    // sleep(500)text = muteClose
    textEndsWith("获得奖励").waitFor()
    // text("muteOn").waitFor()
    while (true) {
        zb = textEndsWith("获得奖励").findOne().parent().children()
        if (zb.length > 3 && (text("muteOn").exists() || text("muteClose").exists() || id("d").exists())) {
            break
        }
    }
    if (!text("cross").exists()) {
        var video_quit = textEndsWith("获得奖励").findOne().bounds()
        var x1 = 0;
        var x2 = video_quit.left;
        var y1 = video_quit.top;
        var y2 = video_quit.bottom;
        X = parseInt((x1 + x2) / 2)
        Y = parseInt((y1 + y2) / 2)
        var nocross = true
    }

    //等待时间
    var time = adtime()
    //获取不到时间
    var num = 0
    var isOne = true
    var justone
    var ifback
    var iscontinue
    if (time) {
        //成功获取时间
        justone = true
        isOne = false
    }
    // var again
    while (true) {
        if (!(text("muteOn").exists() || text("muteClose").exists() || id("d").exists())) {
            if (ifback) {
                back()
                sleep(500)
            }
            break
        } else if (justone) {
            log('等待' + time + '秒')
            justone = false
            sleep(1000 * time)
            do {
                if (nocross) {
                    click(X, Y)
                } else {
                    clickCenter(zb[0])
                }
                sleep(500)
                if (text("继续观看").exists()) {
                    autoClick_have(text("继续观看"))
                    sleep(1000)
                    log('等待1秒')
                }
            } while (text("muteOn").exists() || text("muteClose").exists() || id("d").exists());

            // autoClick_have(text("cross"))
            // sleep(500)
            // if (textContains("继续观看").exists()) {
            //     autoClick_have(textContains("继续观看"))
            //     sleep(1000 * (time / 6))
            //     if (nocross) {
            //         click(X, Y)
            //     } else {
            //         clickCenter(zb[0])
            //     }
            //     if (!textEndsWith("获得奖励").exists()) {
            //         iscontinue = true
            //         continue
            //     }
            // }
        }
        else {
            num++
            sleep(1000)
            log('等待' + num + '秒')
            if (isOne) {
                log('获取不到时间，重新获取')
                log('点击退出')
                while (true) {
                    // clickParentIfClickable(zb[0])
                    // if (cxy) {
                    //     clickCenter(zb[0])
                    //     cxy = false
                    // }
                    // click(X, Y)
                    if (nocross) {
                        click(X, Y)
                    } else {
                        clickCenter(zb[0])
                    }
                    sleep(500)
                    if (text("继续观看").exists()) {
                        break
                    }
                }
                time = adtime()
                if (time) {
                    log('成功获取')
                    autoClick_have(textContains("继续观看"))
                    log('等待' + time + '秒')
                    isOne = false
                    sleep(1000 * time)
                    // if (!textEndsWith("获得奖励").exists()) {
                    //     log('返回退出')

                    //     back()
                    //     break
                    // }

                    // click(X, Y)
                    do {
                        if (nocross) {
                            click(X, Y)
                        } else {
                            clickCenter(zb[0])
                        }
                        sleep(500)
                        if (text("继续观看").exists()) {
                            autoClick_have(text("继续观看"))
                            sleep(1000)
                            log('等待1秒')
                        }
                    } while (text("muteOn").exists() || text("muteClose").exists() || id("d").exists());
                    // again = time / 5
                } else {
                    log('等待视频结束')
                    autoClick_have(text("继续观看"))
                    isOne = false
                    ifback = true
                }
            }
        }
    }
    //点击退出
    // if (!textEndsWith("获得奖励").exists()) {
    //     log('返回退出')
    //     back()
    // } else {
    //     log('点击退出')
    //     clickParentIfClickable(zb[0])
    //     if (cxy) {
    //         clickCenter(zb[0])
    //         cxy = false
    //     }
    //     click(X, Y)
    // }
    log("广告结束")
    // sleep(300)
    if (text("我知道了").exists()) {
        autoClick_have(text("我知道了"))
    }
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
    if (one.click()) {
        sleep(500)
        if (textContains("确认").exists()) {
            className("android.widget.Button").text("确认").findOne().click()
            log('兑换成功7天')
        }
    }
    sleep(500)
    if (two.click()) {
        sleep(500)
        if (textContains("确认").exists()) {
            className("android.widget.Button").text("确认").findOne().click()
            log('兑换成功3天')
        }
    }
    sleep(500)
    if (three.click()) {
        sleep(500)
        if (textContains("确认").exists()) {
            className("android.widget.Button").text("确认").findOne().click()
            log('兑换成功1天')
        }
    }
    sleep(1000)
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
            sleep(1000 * 10)
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
                var pt = playtime()
                // var repetitions = 4
                if (pt) {
                    do {
                        clickParentIfClickable(games[gamei - 3])
                        if (cxy) {
                            back()
                            autoClick_have(textContains("游戏中心"))
                            cxy = false
                        }
                        sleep(500)
                    } while (textContains("当日玩游戏").exists());
                    log("前往游戏中心")
                    textContains("热门").waitFor()
                    textContains("喜欢").waitFor()
                    textContains("推荐").waitFor()
                    if (text("排行").findOne(1000 * 15) == null) {
                        autoClick_have(text("在线玩"))
                    } else {
                        autoClick_have(text("排行"))
                        text("新游榜").waitFor()
                        text("热门榜").waitFor()
                        text("畅销榜").waitFor()
                        autoClick_have(text("在线玩"))
                        // repetitions++
                    }
                    log("进入游戏")
                    log('剩余' + (pt + 0.5) + '分钟')
                    startCountdown(pt + 0.5)
                    backHome()
                    // for (let index = 0; index < repetitions; index++) {
                    //     back()
                    //     sleep(1000)
                    // }
                    log("重新进入福利中心")
                    autoClick_have(text("我"))
                    waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
                    sleep(700)
                    if (text("我知道了").exists()) {
                        autoClick_have(text("我知道了"))
                    }
                    autoClick_have(textContains("福利中心"))
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
    prizePool = text("领奖励").find()
    for (i = 0; i < prizePool.length; i++) {
        prizePool[i].click()
        sleep(500)
        if (textContains("我知道了").exists()) {
            autoClick_have(textContains("我知道了"))
        }
    }
}
//倒计时
function startCountdown(minutes) {
    var count = minutes * 60; // 倒计时的秒数
    var lastToastTime = minutes
    for (var i = count; i >= 0; i--) {
        var remainingMinutes = Math.floor(i / 60); // 剩余分钟数
        var remainingSeconds = i % 60; // 剩余秒数
        // 每分钟提示倒计时
        if (lastToastTime > (i / 60).toFixed(1) && i > 5 && remainingSeconds != 0) {
            lastToastTime = (i / 60).toFixed(1)
            log("倒计时还剩 " + (i / 60).toFixed(1) + " 分钟 ");
        }
        if (remainingMinutes >= 1 && remainingSeconds == 0) {
            log("倒计时还剩 " + remainingMinutes + " 分钟 ");
        }
        // 剩余10秒钟提示倒计时
        if (i <= 5) {
            log("倒计时还剩 " + i + " 秒");
        }
        sleep(1000); // 等待1秒
    }
    log("倒计时已结束");
}


start()
//投推荐票
poll()
//签到
if (ham.checkbox_01) {
    qdao()
}
//领碎片
if (ham.checkbox_02) {
    looksp()
}
//做福利任务
if (ham.checkbox_03) {
    lookvd()
}
console.log('运行结束');
console.hide()
engines.stopAllAndToast()