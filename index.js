const puppeteer = require('puppeteer');
puppeteer.launch({
    headless: false,
}).then(async browser => {
    let page = await browser.newPage();

    await page.goto('https://www.baidu.com/');
    // await page.waitFor(2000);

    // await page.click('.continue-to-read')
    // await page.waitForSelector("#su")
    // await page.evaluate(() => {
    //     document.querySelector("#su").style.display = "none"
    // });
    await page.click("#su")
});