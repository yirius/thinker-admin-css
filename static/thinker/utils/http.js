;layui.define(["jquery", "session", "alert"], function (exports) {
    var $ = layui.jquery, alert = layui.alert, conf = layui.conf || {}, responseConfig = conf.response || {
        //数据状态的字段名称
        statusName: 'code',
        statusCode: {
            //数据状态一切正常的状态码
            ok: 1,
            //通过接口返回的登录过期状态码
            logout: 1001,
            //一段时间内操作过，重新注册jwt
            expired: 1002
        },
        msgName: 'msg', //状态信息的字段名称
        dataName: 'data', //数据详情的字段名称
        countName: 'count' //数据条数的字段名称，用于 table
    }, statusCode = responseConfig.statusCode;

    var http = {
        parseOptions(options) {
            options = options || {};
            //给data以及headers赋值
            options.data = options.data || {};
            options.headers = options.headers || {};

            //将data转化为object，不能出现字符串
            try{
                if(typeof options.data === 'string'){
                    options.data = JSON.parse(options.data);
                }
            }catch (e) {
                //如果开启调试，就输出错误
                if(conf.debug){console.error(e);}
                //将数据制成空
                options.data = {};
            }

            //如果tokenName不为空
            if(conf){
                //合并一下conf.request内容
                options.data = $.extend(options.data, conf.request.data);
                options.headers = $.extend(options.headers, conf.request.headers);

                if(conf.tokenName) {
                    //加载在headers中或data中
                    var tokenType = conf.request.tokenType == 0 ? 'headers' : 'data';
                    //判断是否已经存在了这个值，存在了就就不覆盖
                    if(typeof options[tokenType][conf.tokenName] == "undefined"){
                        options[tokenType][conf.tokenName] = layui.session.token();
                    }
                }
            }

            return options;
        },
        /**
         * ajax返回数据处理
         * @param options
         * @param res
         * @param callback
         * @private
         */
        _requestCall: function(options, res, callback) {
            var resStatusCode = res[responseConfig.statusName],
                resData = res[responseConfig.dataName],
                resMsg = res[responseConfig.msgName];
            //登录状态失效，清除本地 access_token，并强制跳转到登入页
            if(resStatusCode == statusCode.logout){
                layui.session.logout();
            }else if(resStatusCode == statusCode.expired){
                //重新记录token，然后重新发送记录
                layui.session.login(resData);
                //重新发送当次的数据, 需要删除token对应字段
                if(conf.tokenName){
                    //如果存在token，且有对应字段，就删除
                    var tokenType = conf.request.tokenType == 0 ? 'headers' : 'data';
                    //判断是否已经存在了这个值，存在了就就不覆盖
                    if(typeof options[tokenType][conf.tokenName] != "undefined"){
                        delete options[tokenType][conf.tokenName];
                    }
                }
                //判断回调并运行
                $.isFunction(callback) && callback();
            }else if(resStatusCode == statusCode.ok) {
                //只有 response 的 code 一切正常才执行 done
                typeof options.done === 'function' && options.done(resData, resMsg);
            }else {
                //判断是否存在错误的执行
                var notShowError = false;
                if(typeof options.complete === 'function'){
                    notShowError = options.complete(1, res) || false;
                }
                //如果不存在或者需要提示文字
                if(!notShowError){
                    //其它异常, 直接提示
                    alert.error(
                        '<cite>Error：</cite> ' + (res[conf.response.msgName] || '返回状态码异常')
                    );
                }
            }
        },
        /**
         * 默认请求方法
         * @param options
         * @returns {*|jQuery|{getAllResponseHeaders, abort, setRequestHeader, readyState, getResponseHeader, overrideMimeType, statusCode}}
         */
        request: function(options){
            var that = this;
            //处理一下参数
            options = this.parseOptions(options);
            //如果存在success，需要覆盖
            if(options['success']) {
                options.done = options['success'];
                delete options['success'];
            }
            //如果存在error，需要覆盖
            if(options['error']) {
                options.errdone = options['error'];
                delete options['error'];
            }

            if (Object.prototype.toString.call(options.data) == '[object FormData]') {
                // 当前data是formData
                options.processData = false;
                options.contentType = false;
            }

            $.ajax($.extend({
                type: 'get',
                dataType: 'json',
                success: function(res){
                    that._requestCall(options, res, function(){
                        http.request(options);
                    });
                },
                error: function(e, code){
                    alert.error(
                        '请求异常，服务器貌似出现一些问题<br><cite>错误信息：</cite>'+ code
                    );

                    typeof options.complete === 'function' && options.complete(0, code);
                }
            }, options));
        },
        /**
         * 其他请求的基础方法
         * @param type
         * @param url
         * @param data
         * @param sucCall
         * @param errCall
         * @param throwCall
         * @private
         */
        _request: function(type, url, data, sucCall, errCall, throwCall){
            this.request({
                type: type,
                url: url,
                data: data,
                done: function(data, msg){
                    typeof sucCall === 'function' && sucCall(data, msg);
                },
                complete: function(status, res){
                    if(status === 1){
                        if(typeof errCall === 'function'){
                            return errCall(res.code, res.msg, res.data, res);
                        }
                    }else{
                        if(typeof throwCall === 'function' && res != "success"){
                            return throwCall(status, res);
                        }
                    }
                }
            });
        },
        //POST请求便捷化
        get: function(url, data, sucCall, errCall, throwCall){
            this._request('GET', url, data, sucCall, errCall, throwCall);
        },
        //POST请求便捷化
        post: function(url, data, sucCall, errCall, throwCall){
            this._request('POST', url, data, sucCall, errCall, throwCall);
        },
        //put请求便捷化
        put: function(url, data, sucCall, errCall, throwCall){
            this._request('PUT', url, data, sucCall, errCall, throwCall);
        },
        //delete请求便捷化
        delete: function(url, data, sucCall, errCall, throwCall){
            this._request('DELETE', url, data, sucCall, errCall, throwCall);
        }
    };

    exports("http", http);
});