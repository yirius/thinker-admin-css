;layui.define(['jquery'], function(exports){
    var $ = layui.$,
        $win = $(window),
        $doc = $(document),
        $body = $('body');

    //判断是否IE8
    var isIE8 = navigator.appName == 'Microsoft Internet Explorer' &&
        navigator.appVersion.split(';')[1].replace(/[ ]/g, '') == 'MSIE8.0';

    var tools = {
        ie8: isIE8,
        /**
         * 函数防抖，只在最后一次开始执行
         * @param func
         * @param wait
         * @returns {Function}
         */
        debounce: function(func, wait) {
            var timeout = null;
            return function() {
                var args = arguments;
                var context = this;
                if(timeout !== null) clearTimeout(timeout);
                timeout = setTimeout(function(){
                    func.apply(context, args);
                }, wait);
            }
        },
        /**
         * 函数节流，一定时间只执行一次
         * @param func
         * @param delay
         * @returns {Function}
         */
        throttle: function(func, delay) {
            var prev = Date.now();
            return function() {
                var context = this;
                var args = arguments;
                var now = Date.now();
                if (now - prev >= delay) {
                    func.apply(context, args);
                    prev = Date.now();
                }
            }
        },
        // 深度克隆-不丢失方法
        deepClone: function (obj) {
            var newObj = Array.isArray(obj) ? [] : {}
            if (obj && typeof obj === "object") {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        newObj[key] = (obj && typeof obj[key] === 'object') ? this.deepClone(obj[key]) : obj[key];
                    }
                }
            }
            return newObj
        },
        /**
         * 对function也进行格式化
         * @param obj
         * @returns {string}
         */
        deepStringify: function (obj) {
            var JSON_SERIALIZE_FIX = {
                PREFIX : "[[JSON_FUN_PREFIX_",
                SUFFIX : "_JSON_FUN_SUFFIX]]"
            };
            return JSON.stringify(obj,function(key, value){
                if(typeof value === 'function'){
                    return JSON_SERIALIZE_FIX.PREFIX+value.toString()+JSON_SERIALIZE_FIX.SUFFIX;
                }
                return value;
            });
        },
        /**
         * 反格式化function
         * @param str
         * @returns {any | {}}
         */
        deepParse: function (str) {
            var JSON_SERIALIZE_FIX = {
                PREFIX: "[[JSON_FUN_PREFIX_",
                SUFFIX: "_JSON_FUN_SUFFIX]]"
            };
            return JSON.parse(str, function (key, value) {
                if (typeof value === 'string' &&
                    value.indexOf(JSON_SERIALIZE_FIX.SUFFIX) > 0 && value.indexOf(JSON_SERIALIZE_FIX.PREFIX) === 0) {
                    return eval("(" + value.replace(JSON_SERIALIZE_FIX.PREFIX, "").replace(JSON_SERIALIZE_FIX.SUFFIX, "") + ")");
                }
                return value;
            }) || {};
        },
        /**
         * 获取屏幕尺寸
         * @returns {number}
         */
        getScreenType: function(){
            var width = $win.width();
            if(width > 1440){
                return 4; //超大屏幕
            } else if(width > 1200){
                return 3; //大屏幕
            } else if(width > 992){
                return 2; //中屏幕
            } else if(width > 768){
                return 1; //小屏幕
            } else {
                return 0; //超小屏幕
            }
        },
        /**
         * 输出log
         * @param msg
         * @param type
         */
        log: function(msg, type){
            console[type || "log"](msg);
        },
        /**
         * 字符串是否含有html标签的检测
         * @param htmlStr
         */
        checkHtmlTag: function(htmlStr){
            var reg = /<[^>]+>/g
            return reg.test(htmlStr);
        },
        /**
         * 倒计时
         * @param callback
         * @param seconds
         */
        countdown: function(callback, seconds) {
            var useSecond = parseInt(seconds), useInterval = setInterval(function(){
                if(useSecond <= 0) {
                    callback && callback(0, useInterval);
                    clearInterval(useInterval);
                } else {
                    --useSecond;
                    callback && callback(useSecond, useInterval);
                }
            }, 1000);
        },
        /**
         * 生成二维码
         * @param elem
         * @param params
         * @returns {layui.qrcode}
         */
        qrcode: function(elem, params) {
            if (elem instanceof $) elem = elem.get(0);
            if (!layui.qrcode) console.error('请先引入 qrcode 模块！');

            var width = $(elem).width(), height = $(elem).height();

            var defaultParams = {
                text: '',
                width: width>height?height:width,
                height: width>height?height:width,
                colorDark: '#000000',
                colorLight: '#ffffff'
            };

            if (typeof params != 'object') params = { text: params };
            params = $.extend(defaultParams, params);

            if (this.ie8) {
                params.width += 20;
                params.height += 20;
            }

            var qrcode = new layui.qrcode(elem, params);

            if (this.ie8) {
                $(elem)
                    .find('table')
                    .css('margin', 0)
            }

            return qrcode
        },
        /**
         * 生成随机
         * @param minNum
         * @param maxNum
         * @returns {number}
         */
        rand: function(minNum, maxNum) {
            switch (arguments.length) {
                case 1:
                    return parseInt(Math.random() * minNum + 1, 10);
                    break;
                case 2:
                    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
                    break;
                default:
                    return 0;
                    break;
            }
        }
    };

    exports("tools", tools);
});