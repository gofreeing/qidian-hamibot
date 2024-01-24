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
var InitialValue = null
var ca = false
// var clickResults
// var news = ''
//工具模块
/*//通知
function observeNews() {
    events.observeToast();
    events.onToast(function (toast) {
        news = toast.getText();
    });
}*/

//提取数字
function jstime(textObj) {
    // 存储初始文本内容
    var initText = textObj.text();
    // log(initText)
    //获取时间
    var match = initText.match(/\d+/g);
    return match ? parseInt(match[0]) : null;
}

/*//提取坐标中心-老方法
function getXy(obj) {
    var bounds = obj.bounds();
    return {
        centerX: (bounds.left + bounds.right) / 2,
        centerY: (bounds.top + bounds.bottom) / 2
    };
}
//点击坐标中心
function clickCenter(params) {
    var center = getXy(params);
    click(center.centerX, center.centerY);
    console.log('点击坐标')
}*/

//提取坐标中心
function getXy(obj) {
    if (obj == null) {
        return null;
    }
    var bounds = obj.bounds();
    return {
        centerX: (bounds.left + bounds.right) / 2,
        centerY: (bounds.top + bounds.bottom) / 2
    };
}

//点击坐标中心
function clickCenter(params) {
    var center = getXy(params);
    if (center == null) {
        console.log('没找到')
        return
    }
    click(center.centerX, center.centerY);
    console.log('点击坐标')
}

//判断广告时间
function adtime() {
    return jstime(textEndsWith("获得奖励").findOne())
}

//返回首页
function backHome(params) {
    /*while (!(text("书架").visibleToUser(true).exists() && text("精选").visibleToUser(true).exists() && text("听书").visibleToUser(true).exists() && text("发现").visibleToUser(true).exists() && text("我").visibleToUser(true).exists())) {
        back()
    }*/
    do {
        back()
    } while (!(id("normal").visibleToUser(true).exists()))
    console.log('已到主界面');
}

/*//直到能点击-老方法
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
}*/

function clickParentIfClickable(widget) {
    if (InitialValue == null) {
        InitialValue = widget
    }
    if (widget === null) {
        console.log('找不到');
        return null;  // 终止递归的条件：如果 widget 是空值，则结束递归
    }
    if (widget.click()) {
        console.log('已点击');
        return true;  // 点击控件
    }
    var parentWidget = widget.parent();  // 获取控件的父类
    if (parentWidget === null) {
        console.log('不可点击');
        clickCenter(InitialValue)
        InitialValue = null
        return false;
    }
    return clickParentIfClickable(parentWidget);
    // 递归调用自身，传入父类控件进行下一次查找和点击
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
        id("btnCheckIn").waitFor()
        id("imgClose").findOne(1000)
        bounds = className("android.widget.FrameLayout").depth(0).findOne()
        centerX = getXy(bounds).centerX;
        centerY = getXy(bounds).centerY;
        right = bounds.bounds().right
        log("应用已启动")
        // sleep(1500)
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
    clickParentIfClickable(text('投推荐票').findOne());
    var recommendTicket = textMatches(/拥有\d+主站推荐票/).findOne();
    if (jstime(recommendTicket) > 0) {
        clickParentIfClickable(text('全部').findOne());
        clickParentIfClickable(textMatches(/投\d+票/).findOne());
    } else {
        console.log('没有推荐票');
        back();
    }
}

//签到
function qdao() {
    log("签到")
    clickParentIfClickable(textStartsWith('签到').findOne())
    //等待加载   
    waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
    text("阅读积分").waitFor()
    var today = new Date();
    var dayOfWeek = today.getDay();
    clickParentIfClickable(text("连签礼包 ").findOne())
    text("连签说明").waitFor()
    do {
        clickParentIfClickable(text("未领取").findOnce())
    } while (text("未领取").exists());
    back()
    sleep(500)
    back()
    textStartsWith('签到').visibleToUser(true).waitFor()
    clickParentIfClickable(textStartsWith('签到').findOne())
    waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
    text("阅读积分").waitFor()
    log("抽奖详情")
    /*while (true) {
        if (textContains("明日").exists() || textContains("明天").exists() || descContains("明日").exists() || descContains("明天").exists()) {
            log("抽奖结束")
            break
        } else if (descContains("抽奖").exists() && !text("抽 奖").exists() && !text("看视频抽奖喜+1").exists()) {
            log("点击抽奖")
            clickParentIfClickable(descContains("抽奖").findOne())
            log("等待抽奖界面出现")
            sleep(1200)
        } else if (text("抽 奖").exists() && !text("剩余0次").exists()) {
            log("点击抽奖")
            clickParentIfClickable(text("抽 奖").findOne())
            log("等待转盘结束")
            sleep(3200)

        } else if (text("看视频抽奖喜+1").exists()) {
            log("点击看视频抽奖喜+1")
            clickParentIfClickable(text("看视频抽奖喜+1").findOne())
            waitad()
            sleep(1200)
        }
    }*/
    //抽奖
    if (desc("点击抽奖+1").exists()) {
        clickParentIfClickable(desc("点击抽奖+1").findOne())
        do {
            let num = textMatches(/剩余\d+次/).findOne();
            num = jstime(num);
            for (let i = 0; i < num; i++) {
                clickParentIfClickable(desc("抽 奖").findOne())
                textStartsWith("恭喜获得").waitFor()
            }
            if (desc("明天再来").exists() || desc("明日再来抽奖").exists()) {
                break
            }
            clickParentIfClickable(desc("看视频抽奖喜+1").findOne())
            waitad()
            desc("抽 奖").waitFor()
        } while (true)
    } else if (desc("看视频，得抽奖机会").exists()) {
        clickParentIfClickable(desc("看视频，得抽奖机会").findOne())
        do {
            clickParentIfClickable(desc("看视频抽奖喜+1").findOne())
            waitad()
            desc("抽 奖").waitFor()
            let num = textMatches(/剩余\d+次/).findOne();
            num = jstime(num);
            for (let i = 0; i < num; i++) {
                clickParentIfClickable(desc("抽 奖").findOne())
                textStartsWith("恭喜获得").waitFor()
            }
            if (desc("明天再来").exists() || desc("明日再来抽奖").exists()) {
                break
            }
        } while (true)
    }
    //兑换章节卡
    if (dayOfWeek === 0) {
        log("今天是周日");
        back()
        sleep(1000)
        clickParentIfClickable(textStartsWith('签到').findOne())
        //等待加载
        waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
        text("阅读积分").waitFor()
        // text("周日兑换章节卡").findOne().parent().click()
        clickParentIfClickable(text("周日兑换章节卡").findOne())
        sleep(500)
        array = text("兑换").find()
        clickParentIfClickable(array[array.length - 1])
        sleep(500)
        array = text("兑换").find()
        // console.log(array.length);
        clickParentIfClickable(array[array.length - 1])
        sleep(1500)
    } else {
        log("今天不是周日");
    }
    back()

}


//精选模块
//激励碎片
function looksp() {
    log('领碎片')
    clickParentIfClickable(text("精选").findOne())
    log('已进入精选')
    clickParentIfClickable(text("新书").findOne())
    log('已进入新书')
    log('点击换一换')
    clickParentIfClickable(text("换一换").findOne())
    sleep(800)
    clickParentIfClickable(id("rootBookLayout").findOne())
    log('已进入小说详细页')
    clickParentIfClickable(textEndsWith("阅读").findOne())
    log('已打开小说')
    waitForActivity("com.qidian.QDReader.ui.activity.QDReaderActivity");
    // sleep(2000)
    // var action
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
            clickParentIfClickable(text("下一章").findOne())
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
        // var is
        // clickParentIfClickable(text("立即领取").findOne())
        do {

            log('点击红包')
            clickParentIfClickable(text("红包").findOne())
            log('打开红包')

            clickParentIfClickable(text("马上抢").findOne())
            //看视频
            waitad()
            //领碎片
            log('领碎片')

        } while (clickParentIfClickable(text("立即领取").findOne(3000)) == null)
        /*sleep(500)
        if (id("btnOk").exists()) {
            id("btnOk").findOne().click()
        }*/
        clickParentIfClickable(id("btnOk").findOne(500))
        click(right - 1, centerY);
    }
    log('碎片已领完')
    back()
    clickParentIfClickable(text("取消").findOne())
    backHome()

}


//福利中心模块
//看视频
function lookvd() {
    clickParentIfClickable(text("我").findOne())
    waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
    clickParentIfClickable(text("我知道了").findOne(1000))
    clickParentIfClickable(text("福利中心").findOne())
    log("等待福利中心加载")
    text("限时彩蛋").waitFor()

    while (text("看视频开宝箱").exists()) {
        clickParentIfClickable(text("看视频开宝箱").findOne())
        waitad()
        clickParentIfClickable(text("我知道了").findOne(500))
    }

    while (text("看视频领福利").exists() && !(text("明日再来吧").exists())) {

        clickParentIfClickable(text("看视频领福利").findOne())
        waitad()
        clickParentIfClickable(text("我知道了").findOne(500))

    }
    while (desc("看视频").exists()) {
        clickParentIfClickable(desc("看视频").findOne())
        waitad()
        clickParentIfClickable(text("我知道了").findOne(500))
    }
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
    /*// 假设你需要在某个操作开始的时候记录一个时间戳
        var startTimestamp = new Date().getTime();
    // 在需要的时候获取当前时间的时间戳
        var endTimestamp
    // 计算时间差，单位为毫秒
        var timeDiff
    // 将时间差转换为相应单位的时间
        var seconds*/
    // 广告时间对象
    var reward
    // textEndsWith("获得奖励").waitFor()
    // reward = textEndsWith("获得奖励").findOne().parent().children()
//等待广告时间对象
    /*do {
        reward = textEndsWith("，可获得奖励").findOnce()
        endTimestamp = new Date().getTime();
        timeDiff = endTimestamp - startTimestamp;
        seconds = Math.floor(timeDiff / 1000);
        if (seconds >= 9) {
            if (textStartsWith("点击").visibleToUser(true).exists() && reward == null) {
                back()
                sleep(500)
                console.log('广告未加载');
                return
            } else {
                return;
            }
        }
    } while (reward == null)*/
    reward = textEndsWith("，可获得奖励").findOne(9000)
    if (reward == null) {
        if (textStartsWith("点击").visibleToUser(true).exists()) {
            back()
            sleep(500)
            console.log('广告未加载');
            return
        } else {
            return;
        }
    }
    //获取关闭坐标
    var gb = text("关闭").findOnce()
    var cross = text("cross").findOnce()
    var tg = text("跳过广告").findOnce()
    var zb = null
    if (gb) {
        zb = gb
    } else if (cross) {
        zb = cross
    } else if (tg) {
        zb = tg
    }
    /*if (zb == null) {
        console.log('获取关闭坐标')
        var video_quit = reward.bounds()
        var x1 = 0;
        var x2 = video_quit.left;
        var y1 = video_quit.top;
        var y2 = video_quit.bottom;
        X = parseInt((x1 + x2) / 2)
        Y = parseInt((y1 + y2) / 2)
        // var nocross = true
    }*/
    // reward = reward.parent().children()
    //等待广告出现
    while (className("android.view.View").depth(4).exists()) {
        sleep(500)
    }
    // 获取等待时间
    var time = adtime()
    if (time == null) {
        log('获取不到时间，重新获取')
        log('点击退出')
        do {
            if (textStartsWith("点击").visibleToUser(true).exists() && textEndsWith("，可获得奖励").findOnce() == null) {
                back()
                sleep(500)
                console.log('广告未加载');
                return
            }
            clickCenter(zb)
            /*if (zb) {
                clickCenter(zb)
            }*/
            /*else {
                click(X, Y)
            }*/
            sleep(500)
        } while (!text("继续观看").exists())
        time = adtime()
        clickParentIfClickable(text("继续观看").findOne())

    }


    /* reward = reward.parent().children()
     while (true) {
         if (reward.length > 3) {
             break
         } else if (textStartsWith("点击").visibleToUser(true).exists()) {
             back()
             sleep(500)
             console.log('广告未加载');
             return
         }
     }*/

//等待广告结束
    var num
    if (time) {
        log('等待' + time + '秒')
        // justone = false
        sleep(1000 * time)
        num = 0
        do {
            clickCenter(zb)
            /*if (zb) {
                clickCenter(zb)
            }*/
            /*else {
                click(X, Y)
            }*/
            sleep(500)
            if (text("继续观看").exists()) {
                clickParentIfClickable(text("继续观看").findOne())
                sleep(1000)
                num++
                log('等待' + num + '秒')
            }
        } while (textEndsWith("，可获得奖励").exists());
        /*if (text("点击打开").exists() || text("点击下载").exists() || text("点击卡片").exists()) {
            back()
            sleep(500)
        }*/
        if (text("关闭").exists()) {
            back()
            sleep(500)
        }

    } else {
        //获取不到时间
        log('等待视频结束')
        // clickParentIfClickable(text("继续观看").findOne())
        num = 0
        do {
            num++
            sleep(1000)
            log('等待' + num + '秒')
        } while (textEndsWith("，可获得奖励").exists() || textStartsWith("观看").exists());
        back()
        sleep(500)
        // clickParentIfClickable(text("此图片未加标签。打开右上角的“更多选项”菜单即可获取图片说明。").findOne())
    }


    log('广告结束')

}

//兑换
function buy() {
    /*desc('更多好礼').findOne().click()
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
    sleep(1000)*/
    clickParentIfClickable(desc('更多好礼').findOne())
    text('畅享卡').waitFor()
    var enjoyCard = textStartsWith('7天').findOne().parent().parent()
    var convertibleList = enjoyCard.find(text('兑换'))
    if (convertibleList.length > 0) {
        for (let i = convertibleList.length - 1; i >= 0; i--) {
            clickCenter(convertibleList[i])
            clickParentIfClickable(text("确认").findOne(1500))
        }
    }
    console.log('已兑换')

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

                        if (!clickParentIfClickable(games[gamei - 3])) {
                            back()
                            clickParentIfClickable(text("游戏中心").findOne())
                        }
                        sleep(500)
                    } while (textContains("当日玩游戏").exists());
                    log("前往游戏中心")
                    textContains("热门").waitFor()
                    textContains("喜欢").waitFor()
                    textContains("推荐").waitFor()
                    if (text("排行").findOne(1000 * 15) == null) {
                        clickParentIfClickable(text("在线玩").findOne())
                    } else {
                        clickParentIfClickable(text("排行").findOne())
                        text("新游榜").waitFor()
                        text("热门榜").waitFor()
                        text("畅销榜").waitFor()
                        clickParentIfClickable(text("在线玩").findOne())
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
                    clickParentIfClickable(text("我").findOne())
                    waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')


                    clickParentIfClickable(text("我知道了").findOne(1000))

                    clickParentIfClickable(text("福利中心").findOne())
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

        clickParentIfClickable(text("我知道了").findOne(500))

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
console.hide()
engines.stopAllAndToast()