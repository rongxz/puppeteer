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
    //格式化当前时间
var formatDateTime = function(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    minute = minute < 10 ? ('0' + minute) : minute;
    var second = date.getSeconds();
    second = second < 10 ? ('0' + second) : second;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second + " ";
};
// 随机生成一个两数之间随机数
function RandomNumBoth(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.floor(Rand * Range);
    return num;
};
module.exports = {
    preparePageForTests,
    formatDateTime
}