console.show();
auto.waitFor();
// if (!requestScreenCapture()) {
//     toastLog('没有授予 Hamibot 屏幕截图权限');
//     hamibot.exit();
// }
sleep(1000)
console.setTitle("自动任务");
console.setPosition(device.width * 2 / 5, 0)
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
/*var thread = threads.start(function(){
    events.observeToast();
    events.onToast(function (toast) {
        news = toast.getText();
        console.log(news);
    });
});*/

//提取数字
function jstime(textObj) {
    if (textObj == null) {
        return null
    }
    // 存储初始文本内容
    var initText = textObj.text();
    // log(initText)
    //获取时间
    var match = initText.match(/\d+/g);
    return match ? parseInt(match[0]) : null;
}


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

//返回首页
function backHome(params) {
    do {
        back()
    } while (id("normal").findOne(500) == null)
    console.log('已到主界面');
}


function clickParentIfClickable(widget) {
    if (InitialValue == null) {
        InitialValue = widget
    }
    if (widget === null) {
        console.log('找不到');
        InitialValue = null
        return null;  // 终止递归的条件：如果 widget 是空值，则结束递归
    }
    if (widget.click()) {
        console.log('已点击');
        InitialValue = null
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


function longClickParentIfClickable(widget) {
    if (widget === null) {
        console.log('找不到');
        return null;  // 终止递归的条件：如果 widget 是空值，则结束递归
    }
    if (widget.longClick()) {
        console.log('已长按');
        return true;  // 点击控件
    }
    var parentWidget = widget.parent();  // 获取控件的父类
    if (parentWidget === null) {
        console.log('不可长按');
        return false
    }
    return longClickParentIfClickable(parentWidget);  // 递归调用自身，传入父类控件进行下一次查找和点击
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
        launch("com.qidian.QDReader");
        waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
        // id("imgClose").findOne(750)
        // textStartsWith("签到").findOne(3000)
        back()
        bounds = className("android.widget.FrameLayout").depth(0).findOne()
        centerX = getXy(bounds).centerX;
        centerY = getXy(bounds).centerY;
        right = bounds.bounds().right
        log("应用已启动")
        // sleep(1500)

    }
}

//投推荐票
function poll(params) {
    if (ham.text_01 === '') {
        console.log('没填书');
        return;
    }

    var bookText = textContains(ham.text_01).findOne(500);
    if (bookText === null) {
        console.log('没找到该书');
        return;
    }
    if (!longClickParentIfClickable(bookText)) {
        console.log('投票出现问题请重试');
        return;
    }
    /*if (ca) {
        console.log('投票出现问题请重试');
        ca = false;
        return;
    }*/
    clickParentIfClickable(text('投推荐票').findOne());
    var recommendTicket = textMatches(/拥有\d+主站推荐票/).findOne();
    let votes = jstime(recommendTicket);
    if (votes > 0) {
        clickParentIfClickable(text('全部').findOne());
        clickParentIfClickable(textMatches(/投\d+票/).findOne());
        console.log('已投' + votes + '票');
        back();
    } else {
        console.log('没有推荐票');
        back();
    }
}

//签到
/*
function qdao() {
    log("签到")
    clickParentIfClickable(textStartsWith('签到').findOne())
    var today = new Date();
    var dayOfWeek = today.getDay();
    var thread = threads.start(function () {
        events.observeToast();
        events.onToast(function (toast) {
            let news = toast.getText();
            if (news.indexOf('风险等级') != -1) {
                console.log(news);
                engines.stopAllAndToast()
            }
        });
    });
    clickParentIfClickable(text("免费抽奖").findOne(1500))
    clickParentIfClickable(text("连签礼包 ").findOne())
    text("连签说明").waitFor()
    do {
        clickParentIfClickable(text("未领取").findOnce())
    } while (text("未领取").exists());
    back()
    waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
    text("阅读积分").waitFor()
    log("抽奖详情")
    //抽奖
    let initialNumber
    let currentNumber
    // let endable = false
    if (desc("明天再来").exists() || desc("明日再来抽奖").exists()) {
        console.log('无抽奖')
    } else {
        do {
            clickParentIfClickable(descContains("抽奖").findOne())
            while (!(desc("抽 奖").exists() || desc("看视频抽奖喜+1").exists()) && !(desc("明天再来").exists() || desc("明日再来抽奖").exists())) {
                sleep(500)
            }
            if (desc("抽 奖").exists()) {
//点击抽奖
                console.log('点击抽奖')
                while (clickParentIfClickable(desc("抽 奖").findOne(1000)) == null) {
                    swipe(centerX, centerY, centerX, centerY - 100, 100)
                }
                initialNumber = jstime(textMatches(/剩余\d+次/).findOne())
                while (initialNumber == (currentNumber = jstime(textMatches(/剩余\d+次/).findOne())) && currentNumber != 0) {
                    sleep(500)
                }
            } else if (desc("看视频抽奖喜+1").exists()) {
//看视频
                while (clickParentIfClickable(desc("看视频抽奖喜+1").findOne(1000)) == null) {
                    swipe(centerX, centerY, centerX, centerY - 100, 100)
                }
                waitad()
            }
            clickParentIfClickable(desc("javascript:").findOne(500))
            sleep(500)
        } while (!(desc("明天再来").exists() || desc("明日再来抽奖").exists()))
    }
    //停止线程执行
    thread.interrupt();
    //兑换章节卡
    if (dayOfWeek === 0) {
        log("今天是周日");
        /!*back()
        sleep(1000)
        clickParentIfClickable(textStartsWith('签到').findOne())
        //等待加载
        waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
        text("阅读积分").waitFor()*!/
        do {
            if (clickParentIfClickable(text("周日兑换章节卡").findOne(1000)) == null && clickParentIfClickable(text("积攒碎片可在本周日兑换").findOne(1000)) == null) {
                swipe(centerX, centerY, centerX, centerY - 100, 100)
            }
            sleep(500)
        } while (!text("兑换").exists())
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
    sleep(500)
    if (text("免费抽奖").exists()) {
        back()
    }
}
*/
function qdao() {
    log("签到")
    // clickParentIfClickable(textStartsWith('签到').findOne())
    clickParentIfClickable(text("我").findOne())
    // waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
    clickParentIfClickable(text("我知道了").findOne(1000))
    clickParentIfClickable(text("福利中心").findOne())
    log("等待福利中心加载")
    //text("限时彩蛋").waitFor()
    text("看视频得奖励").waitFor()
    var today = new Date();
    var dayOfWeek = today.getDay();
    var thread = threads.start(function () {
        events.observeToast();
        events.onToast(function (toast) {
            let news = toast.getText();
            if (news.indexOf('风险等级') != -1) {
                console.log(news);
                engines.stopAllAndToast()
            }
        });
    });
    /*clickParentIfClickable(text("免费抽奖").findOne(1500))
    clickParentIfClickable(text("连签礼包 ").findOne())
    text("连签说明").waitFor()
    do {
        clickParentIfClickable(text("未领取").findOnce())
    } while (text("未领取").exists());
    back()
    waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
    text("阅读积分").waitFor()*/
    clickParentIfClickable(text("今日已签到").findOne(1000))
    log("抽奖详情")
    //抽奖 text = 看视频得抽奖机会text = 抽奖text = 去抽奖 ×1text = 明天再来text = 抽奖 ×0text = 今日已签到text = 看视频抽奖机会+1
    let initialNumber
    let currentNumber
    // let endable = false
    if (text("抽奖机会 ×0").findOne(500)) {
        console.log('无抽奖')
    } else {
        do {
            if (textMatches(/抽奖机会 ×\d+/).exists()) {
                console.log('抽奖')
                initialNumber = jstime(textMatches(/抽奖机会 ×\d+/).findOne())
                clickParentIfClickable(textMatches(/抽奖机会 ×\d+/).findOne())
                // clickParentIfClickable(text("抽奖").findOne(1500))
                do {
                    if (clickParentIfClickable(text("抽奖").findOne(1500)) == null) {
                        home()
                        sleep(1000)
                        launch("com.qidian.QDReader")
                    }
                    sleep(3000)
                } while (!(text("抽奖机会 ×0").exists() || text("看视频抽奖机会+1").exists() || text("看视频可抽奖").exists()))
                // if (text("抽奖 ×0").exists()||text("明天再来").exists())
                // {
                //     break
                // }
            } else if (text("看视频可抽奖").exists()) {
                console.log('看视频')
                clickParentIfClickable(text("看视频可抽奖").findOne())
                if (clickParentIfClickable(text("看视频抽奖机会+1").findOne(1500)) == null) {
                    home()
                    sleep(1000)
                    launch("com.qidian.QDReader")
                }
                waitad()
                do {
                    sleep(3000)
                } while (clickParentIfClickable(text("看视频抽奖机会+1").findOne(1000)) != null)
            }
            /*clickParentIfClickable(descContains("抽奖").findOne())
            while (!(desc("抽 奖").exists() || desc("看视频抽奖喜+1").exists()) && !(desc("明天再来").exists() || desc("明日再来抽奖").exists())) {
                sleep(500)
            }
            if (desc("抽 奖").exists()) {
//点击抽奖
                console.log('点击抽奖')
                while (clickParentIfClickable(desc("抽 奖").findOne(1000)) == null) {
                    swipe(centerX, centerY, centerX, centerY - 100, 100)
                }
                initialNumber = jstime(textMatches(/剩余\d+次/).findOne())
                while (initialNumber == (currentNumber = jstime(textMatches(/剩余\d+次/).findOne())) && currentNumber != 0) {
                    sleep(500)
                }
            } else if (desc("看视频抽奖喜+1").exists()) {
//看视频
                while (clickParentIfClickable(desc("看视频抽奖喜+1").findOne(1000)) == null) {
                    swipe(centerX, centerY, centerX, centerY - 100, 100)
                }
                waitad()
            }
            clickParentIfClickable(desc("javascript:").findOne(500))
            sleep(500)*/
        } while (!(text("抽奖 ×0").exists() || text("明天再来").exists()))
    }
    //停止线程执行
    thread.interrupt();
    //兑换章节卡 text =  兑换
    if (dayOfWeek === 0) {
        log("今天是周日");
        /*back()
        sleep(1000)
        clickParentIfClickable(textStartsWith('签到').findOne())
        //等待加载 text = 积攒碎片兑章节卡
        waitForActivity('com.qidian.QDReader.ui.activity.QDBrowserActivity')
        text("阅读积分").waitFor()*/
        /*do {
            if (clickParentIfClickable(text("周日兑换章节卡").findOne(1000)) == null && clickParentIfClickable(text("积攒碎片兑章节卡").findOne(1000)) == null) {
                swipe(centerX, centerY, centerX, centerY - 100, 100)
            }
            sleep(500)
        } while (!text("兑换").exists())*/
        clickParentIfClickable(text("去兑换 周日").findOne(1500))
        sleep(2000)
        array = text("兑换").find()
        clickParentIfClickable(array[array.length - 1])
        sleep(2000)
        array = text("兑换").find()
        clickParentIfClickable(array[array.length - 1])
        sleep(2500)
    } else {
        log("今天不是周日");
    }
    /*back()
    sleep(500)text = 兑换
    if (text("免费抽奖").exists()) {
        back()
    }*/
    backHome()
}


//精选模块
//激励碎片
function looksp() {
    log('领碎片')
    clickParentIfClickable(text("精选").findOne())
    log('已进入精选')
    clickParentIfClickable(text("新书").findOne())
    clickParentIfClickable(text("换一换").findOne())
    sleep(800)
    clickParentIfClickable(id("rootBookLayout").findOne())
    log('已进入小说详细页')
    clickParentIfClickable(textEndsWith("阅读").findOne())
    log('已打开小说')
    waitForActivity("com.qidian.QDReader.ui.activity.QDReaderActivity");
    // sleep(2000)
    // var action
    // var currentPage
    //找红包
    while (true) {
        do {
            log('找红包位置')
            while (true) {
                do {
                    click(right - 1, centerY);
                } while (id("tag").exists())
                click(centerX, centerY);
                log('点击屏幕')
                sleep(700)
                if (text("目录").exists()) {
                    break
                }
                if (text("粉丝值说明").exists() || text("全部").exists() || textMatches(/书友圈\d+书友正在讨论/).exists() || text("快去参与讨论").exists()) {
                    back()
                    sleep(1000)
                } else if (text("发表").exists()) {
                    back()
                    back()
                    sleep(1000)
                }
            }
            clickParentIfClickable(text("下一章").findOne())
            // waitForActivity("com.qidian.QDReader.ui.activity.QDReaderActivity");
            click(1, centerY);
            click(1, centerY);
            sleep(800)
        } while (!textEndsWith("红包").exists())
        log('红包位置已找到')
        if (textStartsWith("0个").exists()) {
            log('没有红包')
            break
        }
        // var is
        // clickParentIfClickable(text("立即领取").findOne())
        // currentPage = currentActivity();
        do {

            log('点击红包')
            clickParentIfClickable(textEndsWith("红包").findOne())
            log('打开红包')
            // clickParentIfClickable(id("layoutHongbaoRoot").findOne())
            text("红包广场").waitFor()
            sleep(1000)
            if (text("当前章节暂无红包").exists()) {
                break
            }
            text("马上抢").waitFor()
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
        do {
            click(right - 1, centerY);
        } while (text("红包").exists() || id("tag").exists())
    }
    log('碎片已领完')
    back()
    clickParentIfClickable(text("取消").findOne(500))
    backHome()

}


//福利中心模块
//看视频
function lookvd() {
    clickParentIfClickable(text("我").findOne())
    // waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
    clickParentIfClickable(text("我知道了").findOne(1000))
    clickParentIfClickable(text("福利中心").findOne())
    log("等待福利中心加载")
    //text("限时彩蛋").waitFor()
    text("看视频得奖励").waitFor()
    var thread1 = threads.start(function () {
        let stop = textContains("领奖上限").findOne()
        console.log(stop.text());
        engines.stopAllAndToast();
    });
    var thread2 = threads.start(function () {
        let stop = textContains("风险等级").findOne()
        console.log(stop.text());
        engines.stopAllAndToast();
    });

    /*while (clickParentIfClickable(text("看视频开宝箱").findOnce()) != null) {
        waitad()
        clickParentIfClickable(text("我知道了").findOne(500))
    }*/

    /*while (clickParentIfClickable(text("看视频领福利").findOnce()) != null && !(text("明日再来吧").exists())) {
        waitad()
        clickParentIfClickable(text("我知道了").findOne(500))
    }*/
    while (clickParentIfClickable(text("看视频").findOnce()) != null) {
        waitad()
        clickParentIfClickable(text("我知道了").findOne(500))
    }
    log('视频已看完')
    bounds = className("android.widget.FrameLayout").depth(0).findOne()
    centerX = getXy(bounds).centerX;
    centerY = getXy(bounds).centerY;
    swipe(centerX, centerY, centerX, 0, 1000)
    log("听书")
    listenToBook()
    log("玩游戏")
    play()
    log("领取奖励")
    getPrize()
    //停止线程执行
    thread1.interrupt();
    thread2.interrupt();
    // log("碎片兑换")
    // buy()
    backHome()

}

//等待广告
function waitad() {

    log('看广告')
    // 广告时间对象
    var reward
    //等待广告出现
    while (className("android.view.View").depth(4).exists()) {
        sleep(500)
    }
//等待广告时间对象
    reward = textEndsWith("可获得奖励").findOne(7000)
    if (reward == null) {
        if (className("android.view.View").depth(4).exists()) {
            while (className("android.view.View").depth(4).exists()) {
                sleep(500)
            }
            if (!textEndsWith("可获得奖励").exists()) {
                back()
                sleep(500)
                console.log('广告未加载1');
                return
            }
        } else if (className("android.view.View").depth(5).exists()) {
            back()
            sleep(500)
            console.log('广告未加载2');
            return
        }
        // else if (className("android.widget.TextView").findOne(1000) || className("android.widget.ProgressBar").findOne(1000) || className("android.view.ViewGroup").depth(14).findOne(1000) || className("android.view.View").depth(16).findOne(1000) || ocr.recognizeText(captureScreen()).text.match(/观看.*可获得/)) {
        //     do {
        //         sleep(1000)
        //     } while (className("android.widget.TextView").findOne(1000) || className("android.widget.ProgressBar").findOne(1000) || className("android.view.ViewGroup").depth(14).findOne(1000) || className("android.view.View").depth(16).findOne(1000))
        //     waitad2()
        //     return;
        // }
        else {
            console.log('未进入广告页面');
            return
        }
    }
    //等待广告出现
    while (className("android.view.View").depth(4).exists()) {
        sleep(500)
    }
    if (!textEndsWith("可获得奖励").exists()) {
        back()
        sleep(500)
        console.log('广告未加载3');
        return
    }
    //获取关闭坐标
    var gb = text("关闭").findOne(400)
    var cross = text("cross").findOne(400)
    var tg = text("跳过广告").findOne(400)
    // var wz = text("此图片未加标签。打开右上角的“更多选项”菜单即可获取图片说明。").findOnce()
    var zb = null
    if (gb) {
        zb = gb
    } else if (cross) {
        zb = cross
    } else if (tg) {
        zb = tg
    } /*else if (wz) {
        zb = wz
    }*/
    if (zb == null) {
        console.log('获取关闭坐标')
        var video_quit = reward.bounds()
        var x1 = 0;
        var x2 = video_quit.left;
        var y1 = video_quit.top;
        var y2 = video_quit.bottom;
        X = parseInt((x1 + x2) / 2)
        Y = parseInt((y1 + y2) / 2)
        // var nocross = true
    }
    // 获取等待时间
    let textObj = textEndsWith("可获得奖励").findOne()
    var time = jstime(textObj)
    if (textObj.text().includes("有声书")) {
        if (zb == null) {
            click(X, Y)
        } else {
            clickParentIfClickable(zb)
        }
        sleep(500)
        clickParentIfClickable(textStartsWith("继续").findOne())
    }
    if (time == null) {
        log('获取不到时间，重新获取')
        log('点击退出')
        do {
            if (!textEndsWith("可获得奖励").exists()) {
                back()
                sleep(500)
                console.log('获取不到坐标')
                return
            }
            if (zb == null) {
                click(X, Y)
            } else {
                clickParentIfClickable(zb)
            }
            sleep(500)
        } while (!textStartsWith("继续").exists())
        time = jstime(textEndsWith("可获得奖励").findOne())
        clickParentIfClickable(textStartsWith("继续").findOne())
        /*
                if (time == null) {
                    time = textMatches(/\d+/).findOnce()
                    if (time) {
                        time = parseInt(time.text())
                    }
                }
        */
    }

//等待广告结束
    var num
    if (time) {
        log('等待' + (time + 1) + '秒')
        sleep(1000 * (time + 1))
        num = 0
        do {
            if (zb == null) {
                click(X, Y)
            } else {
                clickParentIfClickable(zb)
            }
            if (clickParentIfClickable(textStartsWith("继续").findOne(500))) {
                sleep(1000)
                num++
                log('等待' + num + '秒')
            }
        } while (textEndsWith("可获得奖励").exists());
    } else {
//获取不到时间
        log('等待视频结束')
        // clickParentIfClickable(text("继续观看").findOne())
        num = 0
        do {
            num++
            sleep(1000)
            log('等待' + num + '秒')
        } while (textEndsWith("可获得奖励").exists());
    }
//判断是否还在广告页面
    if (className("android.view.View").depth(5).exists()) {
        back()
        sleep(500)
    }
    log('广告结束')
    sp++
    log('已看视频' + sp + '个')
}

//等待广告
/*
function waitad2() {

    console.log('获取关闭坐标')
    // var templ = images.read('https://tutu.to/image/hBWyI');
    var templ = images.read('https://www.helloimg.com/i/2025/01/10/6781031fc8fbc.png');
    var p = findImage(captureScreen(), templ);
    X = p.x
    Y = p.y
    do {
        // 获取等待时间
        time = ocr.recognizeText(captureScreen()).text.match(/观看.*可获得/).match(/\d+/g)
        //等待广告结束
        log('等待' + (time + 1) + '秒')
        sleep(1000 * (time + 1))
    } while (ocr.recognizeText(captureScreen()).text.match(/恭喜获得/) == null);
    click(X, Y)
    log('广告结束')
    sp++
    log('已看视频' + sp + '个')
}
*/
function waitad2() {
    console.log('获取关闭');
    // 图片URL地址
    var templUrl = 'https://www.helloimg.com/i/2025/01/10/6781031fc8fbc.png';
    // 下载图片到本地
    var downloadPath = '/sdcard/templ.png'; // 指定下载路径
    http.get(templUrl, function (error, response) {
        console.log(1)
        if (!error && response.statusCode == 200) {
            // 将图片内容保存到本地文件
            files.writeBytes(downloadPath, response.body.bytes());
            // 从本地加载图片
            var templ = images.read(downloadPath);
            console.log(2)
            if (templ) {
                var p = findImage(captureScreen(), templ);
                if (p) {
                    var X = p.x;
                    var Y = p.y;
                    do {
                        // 获取等待时间
                        var screenText = ocr.recognizeText(captureScreen()).text;
                        var timeMatch = screenText.match(/观看.*可获得/);
                        if (timeMatch) {
                            var time = timeMatch[0].match(/\d+/g);
                            if (time) {
                                time = parseInt(time[0], 10);
                                // 等待广告结束
                                console.log('等待' + (time + 1) + '秒');
                                sleep(1000 * (time + 1));
                            }
                        }
                    } while (!screenText.match(/恭喜获得/));
                    click(X, Y);
                    console.log('广告结束');
                    sp++;
                    console.log('已看视频' + sp + '个');
                } else {
                    console.log('未找到关闭广告的坐标');
                }
            } else {
                console.error('模板图片加载失败，请检查下载路径是否正确：' + downloadPath);
            }
        } else {
            console.error('下载图片失败，错误信息：', error);
        }
    });
}

//兑换
function buy() {
    clickParentIfClickable(desc('更多好礼').findOne())
    text('畅享卡').waitFor()
    var enjoyCard = textStartsWith('7天').findOne().parent().parent()
    var convertibleList = enjoyCard.find(text('兑换'))
    if (convertibleList.length > 0) {
        for (let i = convertibleList.length - 1; i >= 0; i--) {
            clickParentIfClickable(convertibleList[i])
            clickParentIfClickable(text("确认").findOne(2000))
            sleep(500)
        }

    }
    console.log('已兑换')

}

//听书
function listenToBook() {
    var bookV
    // let listenTime
    bookV = textContains("当日听书").findOne(1000)
    if (bookV == null) {
        console.log('没有听书')
        return
    }
    // let listeningTime = jstime(bookV);
    // if (textContains("当日玩游戏").findOnce() == null) {
    //      listenTime = jstime(bookVs);
    // }
    bookV = bookV.parent()
    if (clickParentIfClickable(bookV.findOne(text('去完成'))) != null) {
        sleep(1500)
        let isback = false
        if (text("听原创小说").exists()) {
            isback = true
            text("听原创小说").waitFor()
            clickParentIfClickable(id("playIv").findOne())
        }
        id("ivPlayCenter").waitFor()
//         sleep(1000 * 10)
        back()
        clickParentIfClickable(id("btnLeft").findOne(850))
        if (isback) {
            back()
        }
    }
}

//玩游戏
/*
function play() {
    var game
    game = textContains("当日玩游戏").findOne(1000)
    if (game == null) {
        console.log('没有游戏可玩')
        return
    }
    game = game.parent()
    let finishing
    var pt
    device.keepScreenDim();
    while ((finishing = game.findOne(text('去完成'))) != null) {
        pt = jstime(game.findOne(textMatches(/\/\d+分钟/))) - jstime(game.findOne(textMatches(/\d+/)))
        // var repetitions = 4
        do {

            if (!clickParentIfClickable(finishing)) {
                back()
                clickParentIfClickable(text("游戏中心").findOne())
            }
            sleep(500)
        } while (textContains("当日玩游戏").exists());
        log("前往游戏中心")
        textContains("热门").waitFor()
        // textContains("喜欢").waitFor()
        textContains("推荐").waitFor()
        if (clickParentIfClickable(text("排行").findOne(5000)) == null) {
            clickParentIfClickable(text("在线玩").findOne())
        } else {
            text("新游榜").waitFor()
            text("热门榜").waitFor()
            text("畅销榜").waitFor()
            clickParentIfClickable(text("热门榜").findOne())
            clickParentIfClickable(text("在线玩").findOne())
            // repetitions++
        }
        log("进入游戏")
        log('剩余' + (pt + 0.5) + '分钟')
        startCountdown(pt + 0.5)
        backHome()
        log("重新进入福利中心")
        clickParentIfClickable(text("我").findOne())
        // waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
        // clickParentIfClickable(text("我知道了").findOne(750))
        clickParentIfClickable(text("福利中心").findOne())
        log("等待福利中心加载")
        // text("限时彩蛋").waitFor()
        text("看视频得奖励").waitFor()
        game = textContains("当日玩游戏").findOne(1000)
        game = game.parent()
    }
    device.cancelKeepingAwake();
}
*/
function play() {
    var game
    game = textContains("当日玩游戏").findOne(1000)
    if (game == null) {
        console.log('没有游戏可玩')
        return
    }
    game = game.parent()
    let finishing
    var pt
    device.keepScreenDim();
    while ((finishing = game.findOne(textMatches(/ 再玩\d+分钟可获得 /))) != null) {
        pt = jstime(finishing)
        if (pt == null) {
            break
        }
        // log(pt)
        // var repetitions = 4
        do {

            // if (!clickParentIfClickable(text('去完成').findOne(1500))) {
            //     back()
            //     clickParentIfClickable(text("游戏中心").findOne())
            // }
            // clickParentIfClickable(text('去完成').findOne(1500))
            className("android.widget.TextView").text("去完成").clickable(true).depth(16).findOne().click()
            sleep(1000)
        } while (textContains("当日玩游戏").exists());
        log("前往游戏中心")
        textContains("热门").waitFor()
        // textContains("喜欢").waitFor()
        textContains("推荐").waitFor()
        if (clickParentIfClickable(text("排行").findOne(5000)) == null) {
            clickParentIfClickable(text("在线玩").findOne())
        } else {
            text("新游榜").waitFor()
            text("热门榜").waitFor()
            text("畅销榜").waitFor()
            clickParentIfClickable(text("热门榜").findOne())
            clickParentIfClickable(text("在线玩").findOne())
            // repetitions++
        }
        log("进入游戏")
        log('剩余' + (pt + 0.5) + '分钟')
        startCountdown(pt + 0.5)
        backHome()
        log("重新进入福利中心")
        clickParentIfClickable(text("我").findOne())
        // waitForActivity('com.qidian.QDReader.ui.activity.MainGroupActivity')
        // clickParentIfClickable(text("我知道了").findOne(750))
        clickParentIfClickable(text("福利中心").findOne())
        log("等待福利中心加载")
        // text("限时彩蛋").waitFor()
        text("看视频得奖励").waitFor()
        bounds = className("android.widget.FrameLayout").depth(0).findOne()
        centerX = getXy(bounds).centerX;
        centerY = getXy(bounds).centerY;
        swipe(centerX, centerY, centerX, 0, 1000)
        game = textContains("当日玩游戏").findOne(1000)
        game = game.parent()
    }
    device.cancelKeepingAwake();
}

//领取
function getPrize() {
    var prizePool
    prizePool = text("领奖励").find()
    for (i = 0; i < prizePool.length; i++) {
        // prizePool[i].click()
        clickParentIfClickable(prizePool[i])
        clickParentIfClickable(text("我知道了").findOne(750))
    }
    clickParentIfClickable(id("ivClose").findOne(500))
}

//倒计时
function startCountdown(minutes) {
    var count = minutes * 60; // 倒计时的秒数
    var remainingMinutes
    var remainingSeconds
    for (var i = count; i >= 0; i--) {
        remainingMinutes = Math.floor(i / 60); // 剩余分钟数
        remainingSeconds = i % 60; // 剩余秒数
        //清除控制台
        console.clear()
        // 每分钟提示倒计时
        if (i > 60) {
            log("倒计时还剩 " + remainingMinutes + " 分钟 " + remainingSeconds + " 秒 ");
        }
        // 剩余60秒钟提示倒计时
        if (i <= 60) {
            log("倒计时还剩 " + i + " 秒");
        }
        sleep(1000); // 等待1秒
        device.wakeUpIfNeeded();
    }
    console.clear()
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
/*//停止线程执行
thread.interrupt();*/
console.hide()
engines.stopAllAndToast()