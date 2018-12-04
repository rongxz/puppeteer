const puppeteer = require('puppeteer');
const accountInfo = require("./account_info").accountInfo;
let browser = null;
let page = null;
let btn_position = null;
//绕过无头浏览器检测的方法
// This is where we'll put the code to get around the tests.
const preparePageForTests = async(page) => {
    // // Pass the User-Agent Test.
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    // Pass the Chrome Test.
    await page.evaluateOnNewDocument(() => {
        // We can mock this in as much depth as we need for the test.
        window.navigator.chrome = {
            runtime: {},
            // etc.
        };
    });


    // Pass the Plugins Length Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3],
        });
    });

    // Pass the Languages Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['zh-CN', 'zh', 'en'],
        });
    });
}

async function start() {
    const width = 1920
    const height = 1080
    browser = await puppeteer.launch({
        executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        // devtools: true,
        slowMo: 80,
        args: ['--no-sandbox', `--window-size=${ width },${ height }`],
        headless: false,
    });
    // // 创建一个匿名的浏览器上下文
    // const context = await browser.createIncognitoBrowserContext();
    // // 在一个原生的上下文中创建一个新页面
    // page = await context.newPage();

    page = await browser.newPage();

    await preparePageForTests(page);
    //拦截图片
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('.jpg') || interceptedRequest.url().endsWith('.webp'))
            interceptedRequest.abort();
        else
            interceptedRequest.continue();
    });
    await page.setViewport({
        width,
        height
    });

    await page.goto('https://login.taobao.com/');
    await login();
    await page.goto("https://detail.tmall.com/item.htm?id=555141815172&skuId=3588245895042");
    // 监听浏览器页面更新
    browser.on('targetchanged', res => {
        console.log(new Date().getTime() + "------------新页面：url：" + res._targetInfo.url + "-------------");
    });
    page.on('load', async(res) => {
        console.log(new Date().getTime() + "------>page load");

    });
    page.on('domcontentloaded', (res) => {
        console.log(new Date().getTime() + "------>dom finish");
        if (page.url().indexOf('login.taobao.com') > -1) {
            login();
        } else if (page.url().indexOf('buy.tmall.com') > -1 || page.url().indexOf('buy.taobao.com') > -1) {
            doPay();
        } else if (page.url().indexOf('detail.tmall.com') > -1 || page.url().indexOf('detail.taobao.com') > -1) {
            seckill()
        } else if (page.url().indexOf('alipay.com/standard/') > -1) {
            payMoney()
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
    await page.click('#TPL_username_1', { button: 'middle' })
    await page.waitFor(300)
    await page.type('#TPL_username_1', accountInfo.username, {
        delay: 30
    })
    await page.click('#TPL_password_1', { button: 'middle' })
    await page.waitFor(300)
    await page.type('#TPL_password_1', accountInfo.pwd, {
        delay: 30
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
            const [response] = await Promise.all([
                page.click("#J_SubmitStatic"),
                page.waitForNavigation()
            ]);
        } else {
            console.log("滑动失败");
            return
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
    await page.waitForSelector(".tb-btn-buy", {
        timeout: 0
    });
    console.log(new Date().getTime() + "---->点击购买按钮，耗时 " + (new Date().getTime() + -start) + "ms");
    await Promise.all([
        page.click("#J_LinkBuy"),
        page.waitForNavigation()
    ]);
    console.log(new Date().getTime() + "------->点击购买完成，跳转页面");
}

//购买
async function doPay() {
    let start = new Date().getTime();
    await page.waitForSelector(".go-btn", {
        timeout: 0
    });
    console.log(new Date().getTime() - start + "ms--------->付款耗时");
    await page.click(".go-btn");
}

async function payMoney() {
    console.log("赶紧输入密码吧");

    // await page.type("#payPassword_rsainput", "12345678", {
    //     dealy: 10
    // });
    // await page.click("#J_authSubmit");
}









start()