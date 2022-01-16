// ==UserScript==
// @name         瀑布流
// @version      1.0.0

// @require      https://cdn.jsdelivr.net/npm/jquery@2.2.4/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/lovefield@2.1.12/dist/lovefield.min.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@9


// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_getResourceURL
// @grant        GM_registerMenuCommand
// @grant        GM_info


// ==/UserScript==
(function () {
    'use strict';

    // 瀑布流状态：1：开启、0：关闭
    let waterfallScrollStatus = GM_getValue('scroll_status', 1);

    /**
     * 公用类
     * @Class
     */
    var Common = {


        /**
         * 判断日期是否最近X个月份的日期
         * @param {String} DateStr 日期
         * @param {Number} MonthNum 月数(X)
         * @returns {boolean}
         */
        isLastXMonth: function (DateStr, MonthNum) {
            let now = new Date(); //当前日期
            let compDate = new Date(DateStr);
            let m2 = now.getFullYear() * 12 + now.getMonth();
            let m1 = compDate.getFullYear() * 12 + compDate.getMonth();
            if ((m2 - m1) < MonthNum) {
                return true;
            }
            return false;
        },
    };


    /**
     * 对Date的扩展，将 Date 转化为指定格式的String
     * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，/';
     * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
     * 例子：(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423f
     * (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
     * @param fmt 日期格式
     * @returns {void | string} 格式化后的日期字符串
     */
    Date.prototype.Format = function (fmt) { //author: meizz
        var o = {
            "M+": this.getMonth() + 1,                    //月份
            "d+": this.getDate(),                         //日
            "h+": this.getHours(),                        //小时
            "m+": this.getMinutes(),                      //分
            "s+": this.getSeconds(),                      //秒
            "q+": Math.floor((this.getMonth() + 3) / 3),  //季度
            "S": this.getMilliseconds()                   //毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };

    // 瀑布流脚本使用类
    class Lock {
        constructor(d = false) {
            this.locked = d;
        }
        lock() {
            this.locked = true;
        }
        unlock() {
            this.locked = false;
        }
    }

    // 第三方脚本调用
    var thirdparty = {

        // 瀑布流脚本
        waterfallScrollInit: function () {
            var w = new thirdparty.waterfall({});
            var $pages = $('.row .row > div');
            if ($pages.length) {
                $pages[0].parentElement.parentElement.id = "waterfall_h";
                w = new thirdparty.waterfall({
                    next: 'div.pagingnav a:last-of-type',
                    item: '.row .row>div',
                    cont: '.row .row',
                    pagi: '#paging',
                });
            }

            w.setSecondCallback(function (cont, elems) {
                cont.append(elems);
            });

            w.setThirdCallback(function (elems) {
                // hobby mod script
                function filerMonth(indexCd_id, dateString) {
                    //过滤最新X月份的影片
                    if ($(indexCd_id).context.URL.indexOf("bestrated.php?delete") > 0) {
                        if ($(indexCd_id).context.URL.indexOf("bestrated.php?deleteOneMonthAway") > 0 && !Common.isLastXMonth(dateString, 1)) {
                            $(indexCd_id).remove();
                        }
                        else if ($(indexCd_id).context.URL.indexOf("bestrated.php?deleteTwoMonthAway") > 0 && !Common.isLastXMonth(dateString, 2)) {
                            $(indexCd_id).remove();
                        }
                    }
                }
                function filerScore(indexCd_id, score) {
                    //过滤X评分以下的影片  //if(vid == 'javlikq7qu')debugger;
                    if ($(indexCd_id).context.URL.indexOf("?delete") > 0) {
                        if ($(indexCd_id).context.URL.indexOf("delete7down") > 0 && score <= 7.01) {
                            $(indexCd_id).remove();
                        }
                        else if ($(indexCd_id).context.URL.indexOf("delete8down") > 0 && score <= 8.01) {
                            $(indexCd_id).remove();
                        }
                        else if ($(indexCd_id).context.URL.indexOf("delete9down") > 0 && score <= 9.01) {
                            $(indexCd_id).remove();
                        }
                    }
                }
                function setbgcolor(indexCd_id, dateString) {
                    // 如果是最近两个月份的影片标上背景色
                    if ($(indexCd_id).context.URL.indexOf("bestrated") > 0 && Common.isLastXMonth(dateString, 2)) {
                        $('div[class="hobby_add"]', $(indexCd_id)).css("background-color", "#ffffc9");
                    }
                }

                function extCode(indexCd_id, actor, dateString, pingfengString) {
                    $(indexCd_id).find(".id").append(` &nbsp;${actor}`);
                    let t = $(indexCd_id).find(".title").get(0);//todo v3.5.0
                    $(t).text().indexOf("【VR】") >= 0 ? $(t).css("background-color", "black").css("color", "white"):null;
                    $(indexCd_id).children("a").append(`<div class='hobby_add'style='color: red;font-size: 14px;'>
                        ${dateString}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${pingfengString}</div>`);
                    $(indexCd_id).children("a").attr("release_date", dateString);
                    let s = 0;
                    let r = Math.random() / 100;
                    if (pingfengString.replace(/[\\(\\)]/g, "") != '') {
                        s = r + parseFloat(pingfengString.replace(/[\\(\\)]/g, ""));
                    } else {
                        s = 0 + r;
                    }
                    if (s >= 10) {
                        s = 0.01;
                    }
                    $(indexCd_id).children("a").attr("score", s);
                    setbgcolor(indexCd_id, dateString);
                    filerMonth(indexCd_id, dateString);
                    filerScore(indexCd_id, s);
                }
            });

            w.setFourthCallback(function (elems) {
                if(((/(JavBus|AVMOO|AVSOX)/g).test(document.title) || $("footer:contains('JavBus')").length) && elems) {
                    if(location.pathname.search('/searchstar|/actresses|/&mdl=favor&sort=4') < 0){//排除actresses页面
                        // 处理列表文字内容排版
                        for (let i = 0; i < elems.length; i++) {
                            //$(elems[i]).css("height","385px");
                            if($(elems[i]).find("div.avatar-box").length > 0) continue;
                            let spanEle = $(elems[i]).find("div.photo-info span")[0];
                            let t1 = $(spanEle).html().substr($(spanEle).html().indexOf("<br>") + 4);
                            let t2 = $(spanEle).html().substr(0,$(spanEle).html().indexOf("<br>"));
                            $(spanEle).html(t1 + "<br>" + t2);
                        }
                    }
                }
            });

            if((/(JavBus|AVMOO|AVSOX)/g).test(document.title) || $("footer:contains('JavBus')").length) {

                GM_addStyle(`
                    #waterfall_h {height: initial !important;width: initial !important;flex-direction: row;flex-wrap: wrap;margin: 5px 15px !important;}
                    #waterfall_h .item {position: relative !important;top: initial !important;left: initial !important;float: left;}
                    #waterfall_h .movie-box img {position: absolute; top: -200px; bottom: -200px; left: -200px; right: -200px; margin: auto;}
                    #waterfall_h .movie-box .photo-frame {position: relative;} #waterfall_h .avatar-box .photo-info p {margin: 0 0 2px;}
                    #waterfall_h .avatar-box .photo-info {line-height: 15px; padding: 6px;height: 220px;}
                    #waterfall_h .avatar-box .photo-frame {margin: 10px;text-align: center;}
                    #waterfall_h .avatar-box.text-center {height: 195px;}//actresses页面
                `);

//                if($('#waterfall').length == 0 && location.pathname.search(/search/) > 0
//                    && location.pathname.search(/uncensored/) < 1){
//                    window.location.href = $('li[role="presentation"]:eq(1) a').attr("href");
//                }
//
//                if(location.pathname.includes('/uncensored') || (/(AVSOX)/g).test(document.title)){
//                    GM_addStyle(`#waterfall_h .movie-box {width: 354px;} #waterfall_h .movie-box .photo-info {height: 105px;}`);
//                }
//                else {
//                    GM_addStyle(`#waterfall_h .movie-box {width: 167px;} #waterfall_h .movie-box .photo-info {height: 145px;}`);
//                }
            }
        },
        // 瀑布流脚本
        waterfall: (function () {
            function waterfall(selectorcfg = {}) {
                this.lock = new Lock();
                this.baseURI = this.getBaseURI();
                this.selector = {
                    next: 'div.pagingnav a:last-of-type',
                    item: '',
                    cont: '#waterfall', //container
                    pagi: '#paging',
                };
                Object.assign(this.selector, selectorcfg);
                this.pagegen = this.fetchSync(location.href);
                this.anchor = $(this.selector.pagi)[0];
                this._count = 0;
                this._1func = function (cont, elems) {
//                    cont.empty().append(elems);
//                    console.warn(cont)
                    let old_elems = cont[0].children;
                    let old_keys = [];
                    for(const elem of old_elems){
                        const viewkey = elem.querySelector("a").href.split("viewkey=")[1].split("&")[0];
                        old_keys.push(viewkey);
                    }
                    let new_elems = []
                    for(const elem of elems) {
                        const viewkey = elem.querySelector("a").href.split("viewkey=")[1].split("&")[0];
                        if(old_keys.indexOf(viewkey)==-1){
                            new_elems.push(elem)
                        }
                    }
                    cont.append(new_elems);
                };
                this._2func = function (cont, elems) {
                    cont.append(elems);
                };
                this._3func = function (elems) {
                };
                if ($(this.selector.item).length) {
                    // 开启关闭瀑布流判断
                    if(waterfallScrollStatus > 0) {
                        document.addEventListener('scroll', this.scroll.bind(this));
                        document.addEventListener('wheel', this.wheel.bind(this));
                    }
                    this.appendElems(this._2func);
                }
            }

            waterfall.prototype.getBaseURI = function () {
                let _ = location;
                return `${_.protocol}//${_.hostname}${(_.port && `:${_.port}`)}`;
            };
            waterfall.prototype.getNextURL = function (href) {
                let a = document.createElement('a');
                a.href = href;
                return `${this.baseURI}${a.pathname}${a.search}`;
            };
            // 瀑布流脚本
            waterfall.prototype.fetchURL = function (url) {
                console.log(`fetchUrl = ${url}`);
                const fetchwithcookie = fetch(url, {credentials: 'same-origin'});
                return fetchwithcookie.then(response => response.text())
                    .then(html => new DOMParser().parseFromString(html, 'text/html'))
                    .then(doc => {
                        let $doc = $(doc);
                        let href = $doc.find(this.selector.next).attr('href');
                        let nextURL = href ? this.getNextURL(href) : undefined;
                        let elems = $doc.find(this.selector.item);

                        let old_elems = $.find(this.selector.item);
                        let old_keys = []
                        for(const elem of old_elems){
                            const viewkey = elem.querySelector("a").href.split("viewkey=")[1].split("&")[0];
                            old_keys.push(viewkey)
                        }

                        let new_elems = []
                        for(const elem of elems) {
                            const viewkey = elem.querySelector("a").href.split("viewkey=")[1].split("&")[0];
                            if(old_keys.indexOf(viewkey)==-1){
                                new_elems.push(elem)
                            }
                        }

                        for(const elem of new_elems){
                            const links = elem.getElementsByTagName('a');
                            for(const link of links) {
                                link.target = "_blank";
                            }
                        }
                        elems = new_elems

                        return {
                            nextURL,
                            elems
                        };
                    });
            };
            // 瀑布流脚本
            waterfall.prototype.fetchSync = function* (urli) {
                let url = urli;
                do {
                    yield new Promise((resolve, reject) => {
                        if (this.lock.locked) {
                            reject();
                        }
                        else {
                            this.lock.lock();
                            resolve();
                        }
                    }).then(() => {
                        return this.fetchURL(url).then(info => {
                            url = info.nextURL;
                            return info.elems;
                        });
                    }).then(elems => {
                        this.lock.unlock();
                        return elems;
                    }).catch((err) => {
                            // Locked!
                        }
                    )
                    ;
                } while (url);
            };
            // 瀑布流脚本
            waterfall.prototype.appendElems = function () {
                let nextpage = this.pagegen.next();
                if (!nextpage.done) {
                    nextpage.value.then(elems => {
                        const cb = (this._count === 0) ? this._1func : this._2func;
                        cb($(this.selector.cont), elems);
                        this._count += 1;
                        // hobby mod script
                        this._3func(elems);
                        this._4func(elems);
                    })
                    ;
                }
                return nextpage.done;
            };
            // 瀑布流脚本
            waterfall.prototype.end = function () {
                document.removeEventListener('scroll', this.scroll.bind(this));
                document.removeEventListener('wheel', this.wheel.bind(this));
                let $end = $(`<h1>The End</h1>`);
                $(this.anchor).replaceWith($end);
            };
            waterfall.prototype.reachBottom = function (elem, limit) {
                return (elem.getBoundingClientRect().top - $(window).height()) < limit;
            };
            waterfall.prototype.scroll = function () {
                if (this.reachBottom(this.anchor, 500) && this.appendElems(this._2func)) {
                    this.end();
                }
            };
            waterfall.prototype.wheel = function () {
                if (this.reachBottom(this.anchor, 1000) && this.appendElems(this._2func)) {
                    this.end();
                }
            };
            waterfall.prototype.setFirstCallback = function (f) {
                this._1func = f;
            };
            waterfall.prototype.setSecondCallback = function (f) {
                this._2func = f;
            };
            waterfall.prototype.setThirdCallback = function (f) {
                this._3func = f;
            };
            waterfall.prototype.setFourthCallback = function (f) {
                this._4func = f;
            };
            return waterfall;
        })(),
    };
    thirdparty.waterfallScrollInit();
})();
