const superagent = require("superagent")
const fs = require("fs")
const cheerio = require("cheerio")
const schedule = require('node-schedule'); //定时器
// superagent.get('https://www.nike.com/cn/launch/').then(res => {
//     let reg = /\<script\>window\.__PRELOADED_STATE__ = (.*?)\<\/script\>/;
//     let txt = res.text.match(reg)[1];
//     let txt2 = eval('(' + txt + ')')
//     console.log(txt2.product)
//         // fs.writeFile('./nike1.js', txt, err => {
//         //     if (err) console.log(err);
//         //     console.log("写入成功");
//         // })
// })

//凯尔特人
let celtic = "https://www.hibbett.com/on/demandware.store/Sites-Hibbett-US-Site/default/Product-Variation?pid=Q0388&dwvar_Q0388_size=0105&dwvar_Q0388_color=8075&Quantity=1&format=ajax&productlistid=undefined"
    //小白扣碎
let orange = "https://www.hibbett.com/on/demandware.store/Sites-Hibbett-US-Site/default/Product-Variation?pid=Q0389&dwvar_Q0389_size=0115&dwvar_Q0389_color=3025&Quantity=1&format=ajax&productlistid=undefined&pickupOption=ship"
var hibbett_headers = {
    "Accept": "text/html, */*; q=0.01",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    'Connection': 'keep-alive',
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
    "Host": "www.hibbett.com",
    "Referer": "https://www.hibbett.com/jordan-1-mid-se-team-orange-crimson-mens-shoe/33966581.html"
};
let getCelticInfo = () => {
    let start_time = new Date().getTime();
    // 凯尔特人
    superagent.get(celtic)
        .set(hibbett_headers)
        .then(res => {
            console.log("凯尔特人获取耗时：" + new Date().getTime() - start_time + "s");
            if (res.statusCode == 200) {
                var $ = cheerio.load(res.text)
                var ele = $('.swatches').eq(1).children('li');
                let sizeArr = []
                for (let i = 0; i < ele.length; i++) {
                    let size = $(ele).eq(i).text().replace('size', "").trim();
                    sizeArr.push(size)
                }
                let index = sizeArr.findIndex((value, index, arr) => {
                    return parseFloat(value) < 10
                })
                if (index > -1) {
                    console.log('发现鞋子！！！');
                }
            }
        });
}

var j = schedule.scheduleJob('0 * * * * *', function() {
    getCelticInfo();
});