const puppeteer = require('puppeteer');
const accountInfo = require("./account_info").accountInfo;
const util = require("./util")

let browser = null;
let page = null;
let btn_position = null;

const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6 Plus'];

async function start() {
    const width = 1920
    const height = 1080
    browser = await puppeteer.launch({
        // executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        // devtools: true,
        // slowMo: 80,
        args: ['--no-sandbox', `--window-size=${ width },${ height }`],
        headless: false,
    });
    // // 创建一个匿名的浏览器上下文
    // const context = await browser.createIncognitoBrowserContext();
    // // 在一个原生的上下文中创建一个新页面
    // page = await context.newPage();


    page = await browser.newPage();

    await util.preparePageForTests(page);
    //拦截图片
    // await page.setRequestInterception(true);
    // page.on('request', interceptedRequest => {
    //     // console.log("有请求啦"+interceptedRequest.url());
    //     if (interceptedRequest.url().endsWith('.jpg') || interceptedRequest.url().endsWith('.png'))
    //         interceptedRequest.abort();
    //     else
    //         interceptedRequest.continue();
    // });
    await page.setViewport({
        width,
        height
    });
    // await page.emulate(iPhone);
    await page.goto('https://login.taobao.com/');
    await login();
    await page.goto("https://item.taobao.com/item.htm?spm=a1z0k.7628869.0.0.376073036fO8aW&id=581939039549&_u=t2dmg8j26111");
    // 监听浏览器页面更新
    browser.on('targetchanged', res => {
        console.log(new Date().getTime() + "------------新页面：url：" + res._targetInfo.url + "-------------");
    });
    page.on('load', async(res) => {
        console.log(new Date().getTime() + "------>page load");
        if (page.url().indexOf('login.taobao.com') > -1) {
            login();
        } else if (page.url().indexOf('detail.tmall.com') > -1 || page.url().indexOf('detail.taobao.com') > -1) {
            seckill()
        } else if (page.url().indexOf('alipay.com/standard/') > -1) {
            // payMoney()
        }
    });
    page.on('domcontentloaded', (res) => {
        console.log(new Date().getTime() + "------>dom finish");
        if (page.url().indexOf('buy.tmall.com') > -1 || page.url().indexOf('buy.taobao.com') > -1) {
            doPay();
        }
    });
}

async function login() {
    console.log("进行登录操作");
    //登陆成功会重新load一次登录页面，做个判断，防止报错
    let isRepeatLoginPage = await page.evaluate(() => {
        return document.querySelector("#J_LoginBox") && true
    });
    if (!isRepeatLoginPage) {
        console.log("跳出第二次登录页面");
        return
    }
    let boxClass = await page.$eval("#J_LoginBox", e => {
        return e.className
    });
    // console.log(boxClass.split(" "));
    let boxClassArr = boxClass.split(" ");
    //如果是二维码页面则先切换到输入页面
    if (boxClassArr.includes('module-quick')) {
        await page.click('#J_Quick2Static')
    }
    //判断有没有已经填写的账号，有就点击删除
    let isInput = await page.evaluate(() => {
        return true && document.querySelector(".nickx")
    })
    if (isInput) {
        await page.click('.nickx');
    }
    await page.click('#TPL_username_1', {
        button: 'middle'
    })
    await page.waitFor(1000)
    await page.type('#TPL_username_1', accountInfo.username, {
        delay: 50
    })
    await page.click('#TPL_password_1', {
        button: 'middle'
    })
    await page.waitFor(300)
    await page.type('#TPL_password_1', accountInfo.pwd, {
        delay: 50
    })
    let isCode = await page.evaluate(() => {
        return document.querySelector("#nocaptcha").style.display == "block"
    })
    if (isCode) {
        console.log("需要验证码，进行模拟活动");
        await page.waitFor(500)
        await tryMove("#nc_1_n1t", "#nc_1_n1z");
        await page.waitFor(500);
        // 判断是否验证成功
        const isSuccess = await page.evaluate(() => {
            return document.querySelector("#nc_1__scale_text b") && document.querySelector("#nc_1__scale_text b").innerText
        });
        if (isSuccess === "验证通过") {
            console.log("模拟滑动成功");
            const [response] = await Promise.all([
                page.click("#J_SubmitStatic"),
                page.waitForNavigation()
            ]);
        } else {
            console.log("滑动失败");
            return false;
        }
    } else {
        const [response] = await Promise.all([
            page.click("#J_SubmitStatic"),
            page.waitForNavigation()
        ]);
    }
}


/**
 * //获取滑动按钮的位置
 *
 * @param {*} selector css选择器
 * @returns 按钮相对浏览器的left和top
 */
async function getBtnPosition(selector) {
    // console.log(selector);
    await page.waitForSelector(selector)
        //这里传递的参数需要写在后面
    let btn_position = await page.evaluate(async(selector) => {
        let btn_left = document.querySelector(selector).getBoundingClientRect().left + document.querySelector(selector).clientWidth / 2;
        let btn_top = document.querySelector(selector).getBoundingClientRect().top + document.querySelector(selector).clientHeight / 2;
        return {
            btn_left: btn_left,
            btn_top: btn_top
        }
    }, selector);
    console.log("按钮位置是：");
    console.log(btn_position);
    return btn_position;
}

/**
 *模拟滑动
 *
 * @param {*} totalSelector 滑动父选择器
 * @param {*} btnSelector 滑动按钮选择器
 * @returns
 */
async function tryMove(totalSelector, btnSelector) {

    const distance = await page.evaluate((totalSelector, btnSelector) => {
        let totalWidth = document.querySelector(totalSelector).clientWidth;
        let btnWidth = document.querySelector(btnSelector).clientWidth;
        let diff = totalWidth - btnWidth;
        return diff + 30;
    }, ...[totalSelector, btnSelector]);

    console.log("距离获取成功，为");
    console.log(distance);


    //将距离拆分成两段，模拟正常人的行为
    const distance1 = distance - 40;
    const distance2 = 40;
    let rdnHeight = Math.random() * 20;
    console.log("正在获取滑动按钮的位置....");
    btn_position = await getBtnPosition(btnSelector);
    console.log("位置获取成功！");
    console.log("尝试模拟滑动..............");

    await page.mouse.click(btn_position.btn_left, btn_position.btn_top, {
        delay: 500
    });

    await page.mouse.down(btn_position.btn_left, btn_position.btn_top);

    page.mouse.move(btn_position.btn_left + distance1, btn_position.btn_top, {
        steps: 15
    });
    // await page.waitFor(500);
    page.mouse.move(btn_position.btn_left + distance1 + distance2, btn_position.btn_top, {
        steps: 5
    });
    await page.waitFor(500);
    page.mouse.up();
}

//抢购
async function seckill() {
    let start = new Date().getTime();
    console.log(start + " 进入到了抢购页面");
    //等待购买按钮的出现
    await page.waitForFunction(() => document.querySelector(".tb-action").style.display != 'none' && !document.querySelector(".tb-btn-buy").className.includes("tb-hidden"), { timeout: 0 });
    console.log(new Date().getTime() + "--------->点击购买按钮，耗时 " + (new Date().getTime() + -start) + "ms" + "<---------");
    await Promise.all([
        await page.click("#J_LinkBuy"),
        await page.waitForNavigation({
            waitUntil: "domcontentloaded"
        })
    ]);
    console.log(new Date().getTime() + "------->点击购买完成，跳转页面");
}

//购买
async function doPay() {
    let start = new Date().getTime();
    // await page.waitForSelector(".go-btn");
    console.log("--------->付款耗时:" + (new Date().getTime() - start) + "<----------");
    await page.click(".go-btn");
    // return
}

async function payMoney() {
    console.log("赶紧输入密码吧");
    await page.type("#payPassword_rsainput", "3930hgf", {
        dealy: 10
    });
    await page.click("#J_authSubmit");
    console.log("购买完成！！！");

}









start()