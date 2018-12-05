// const puppeteer = require('puppeteer');

// (async() => {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto('https://baidu.com');
//     await page.screenshot({ path: 'example.png' });

//     await browser.close();
// })();

//2.打开浏览器
// const puppeteer = require('puppeteer');
// const devices = require('puppeteer/DeviceDescriptors');
// const iPhone = devices['iPhone 6 Plus'];
// let timeout = function(delay) {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             try {
//                 resolve(1)
//             } catch (e) {
//                 reject(0)
//             }
//         }, delay);
//     })
// }

// async function run() {
//     // 1.打开百度
//     const browser = await puppeteer.launch({
//         headless: false //这里我设置成false主要是为了让大家看到效果，设置为true就不会打开浏览器
//     });
//     const page = await browser.newPage();

//     await page.emulate(iPhone);
//     console.log("1.打开百度");
//     await page.goto('https://www.baidu.com/');
//     await timeout(1000);

//     // 2.输入“前端”并且进行搜素
//     await page.tap("#index-kw"); //直接操作dom选择器，很方便
//     await page.type("#index-kw", "前端");
//     await page.tap("#index-bn");
//     console.log("2.输入“前端”并且进行搜素");

//     // browser.close();
// }

// run();

//3.模拟登陆
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6 Plus'];
let timeout = function(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1)
            } catch (e) {
                reject(0)
            }
        }, delay);
    })
}
let browser = null;
let page = null
let btn_position = null
let times = 0 // 执行重新滑动的次数
const distanceError = [-10, 2, 3, 5] // 距离误差
async function start() {
    browser = await puppeteer.launch({
        //设置超时时间
        timeout: 15000,
        //如果是访问https页面 此属性会忽略https错误
        ignoreHTTPSErrors: true,
        // 打开开发者工具, 当此值为true时, headless总为false
        devtools: true,
        headless: false //设置为true就不会打开浏览器
    });
    page = await browser.newPage();
    // 1.打开前端网
    await page.emulate(iPhone);
    await page.goto('https://www.qdfuns.com/');
    // await timeout(1000);
    //监听浏览器页面更新
    browser.on('targetchanged', res => {
        console.log(res._targetInfo);
    });
    //貌似只有刷新才有效
    page.on('load', (res) => {
        console.log("page load");
    });
    page.on('domcontentloaded', (res) => {
        console.log("dom finish");
        run()
    });
    run()
}
async function run() {
    let title = await page.title()
    let url = await page.url()
    console.log("页面标题:", title);
    console.log("页面地址：", url);
    // 2.打开登录页面
    await page.waitFor('a[data-type=login]')
    await page.click('a[data-type=login]')

    let startTime = new Date();

    // 3.输入账号密码
    await page.type("input[data-type='email']", '32927202@qq.com', {
        delay: 50
    });
    await timeout(500);
    await page.type('input[placeholder=密码]', 'hgf3930..', {
        delay: 50
    });
    await timeout(500);

    // 4.点击验证
    await page.waitFor('.geetest_radar_tip');
    await page.click('.geetest_radar_tip');
    var arr = []
        //这里等待拼图出现才可以去计算按钮的位置
    page.on('request', request => {
        // console.log(request.url());
        if (request.url().startsWith('https://static.geetest.com/pictures/gt')) {
            arr.push(request.url())
            console.log(request.url());
        };
    });

    btn_position = await getBtnPosition();;
    //滑动
    await drag(null)
    let diff = new Date() - startTime;
    console.log("整个过程花费：" + diff + "ms");

}

/**
 * 计算按钮需要滑动的距离 
 * */
async function calculateDistance() {
    await timeout(1000)
    const distance = await page.evaluate(() => {
        // 比较像素,找到缺口的大概位置
        function compare(document) {
            const ctx1 = document.querySelector('.geetest_canvas_fullbg'); // 完成图片
            const ctx2 = document.querySelector('.geetest_canvas_bg'); // 带缺口图片
            const pixelDifference = 30; // 像素差
            let res = []; // 保存像素差较大的x坐标

            // 对比像素
            for (let i = 50; i < 260; i++) {
                for (let j = 1; j < 160; j++) {
                    const imgData1 = ctx1.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
                    const imgData2 = ctx2.getContext("2d").getImageData(1 * i, 1 * j, 1, 1)
                    const data1 = imgData1.data;
                    const data2 = imgData2.data;
                    const res1 = Math.abs(data1[0] - data2[0]); //红 math.abs绝对值
                    const res2 = Math.abs(data1[1] - data2[1]); //黄
                    const res3 = Math.abs(data1[2] - data2[2]); //蓝
                    if (!(res1 < pixelDifference && res2 < pixelDifference && res3 < pixelDifference)) {
                        if (!res.includes(i)) {
                            res.push(i);
                        }
                    }
                }
            }
            console.log(res);

            // 返回像素差最大值跟最小值，经过调试最小值往左小7像素，最大值往左54像素
            return {
                min: res[0] - 7,
                max: res[res.length - 1] - 50
            }
        }
        return compare(document)
    })
    return distance;
}

/**
 * 计算滑块位置
 */
async function getBtnPosition() {
    await page.waitFor('.geetest_popup_ghost')
    const btn_position = await page.evaluate(() => {

        const {
            clientWidth,
            clientHeight
        } = document.querySelector('.geetest_popup_ghost')
        return {
            btn_left: clientWidth / 2 - 90,
            btn_top: clientHeight / 2 + 57
        }
    })
    return btn_position;
}

/**
 * 尝试滑动按钮
 * @param distance 滑动距离
 * */
async function tryValidation(distance) {
    //将距离拆分成两段，模拟正常人的行为
    const distance1 = distance - 10
    const distance2 = 10

    page.mouse.click(btn_position.btn_left, btn_position.btn_top, {
        delay: 1500
    })
    page.mouse.down(btn_position.btn_left, btn_position.btn_top)
    page.mouse.move(btn_position.btn_left + distance1, btn_position.btn_top, {
        steps: 30
    })
    await timeout(800);
    page.mouse.move(btn_position.btn_left + distance1 + distance2, btn_position.btn_top, {
        steps: 20
    })
    await timeout(1000);
    page.mouse.up()
    await timeout(1000);

    // 判断是否验证成功
    const isSuccess = await page.evaluate(() => {
        return document.querySelector('.geetest_success_radar_tip_content') && document.querySelector('.geetest_success_radar_tip_content').innerHTML
    });
    // await timeout(1000);
    // 判断是否需要重新计算距离
    const reDistance = await page.evaluate(() => {
        return document.querySelector('.geetest_result_content') && document.querySelector('.geetest_result_content').innerHTML
    });
    // await timeout(1000);
    return {
        isSuccess: isSuccess === '验证成功',
        reDistance: reDistance.includes('怪物吃了拼图')
    }
}

/**
 * 拖动滑块
 * @param distance 滑动距离
 * */
async function drag(_distance) {
    let a = new Date();
    let distance = _distance || await calculateDistance();
    let diff = new Date() - a;
    if (!_distance) {
        console.log("识别图片花费：" + diff + "ms");
    }
    const result = await tryValidation(distance.min)

    if (result.isSuccess) {
        // await timeout(1000);
        //登录
        console.log('验证成功')
        page.click('#modal-member-login button')
    } else if (result.reDistance) {
        console.log('重新计算滑距离')
        times = 0
        await drag(null)
    } else {
        if (distanceError[times]) {
            times++
            console.log('重新滑动')
            await drag({
                min: distance.max,
                max: distance.max + distanceError[times]
            })
        } else {
            console.log('滑动失败')
            times = 0;
            browser.close()
            browser = null;
            run()
        }
    }
}

start()