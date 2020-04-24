layui.define([
    'jquery', 'laytpl', 'element', 'conf',
    'loadbar', 'http', 'alert', 'tools', 'dropdown'
], function (exports) {
    var $ = layui.$, laytpl = layui.laytpl,
        conf = layui.conf, loadbar = layui.loadbar,
        http = layui.http, alert = layui.alert, tools = layui.tools;

    var $doc = $(document);

    var view = {
        //app挂载Div的id
        appId: $("#" + conf.admin.appId),
        //内容容器渲染id
        appBodyId: null,
        /**
         * 设置doc的标题
         * @param title
         */
        setTitle: function (title) {
            $doc.attr({title: title + ' - ' + conf.name});
        },
        /**
         * 清空内容
         */
        clear: function () {
            this.appBodyId && this.appBodyId.html('')
        },
        /**
         * 弹出界面
         * @param options
         * @returns {*}
         */
        popup: function(options){
            var success = options.success,skin = options.skin;

            delete options.success;
            delete options.skin;

            return layui.layer.open($.extend({
                type: 1,
                title: '温馨提示',
                content: '',
                id: 'LAY-system-view-popup',
                skin: 'layui-layer-admin' + (skin ? ' ' + skin : ''),
                shadeClose: true,
                // closeBtn: false,
                success: function(layero, index){
                    var elemClose = $('<i class="layui-icon" close>&#x1006;</i>');
                    layero.append(elemClose);
                    elemClose.on('click', function(){
                        layui.layer.close(index);
                    });
                    typeof success === 'function' && success.apply(this, arguments);
                }
            }, options))
        },
        /**
         * 抓取html内容
         * @param url
         * @param callback
         */
        fetchHtml: function(url, callback) {
            var that = this;
            url = url || conf.admin.home;

            //拼接版本号
            if(url.indexOf('?') !== -1) {
                var splitTmp = url.split("?");
                url = splitTmp[0] + "?thinker_v=" + layui.cache.version + "&" + splitTmp[1];
            } else {
                url = url + "?thinker_v=" + layui.cache.version;
            }

            //开始加载进度条
            loadbar.start();

            var options = http.parseOptions({
                url: url,
                type: 'get',
                dataType: 'html',
                success: function(res){
                    loadbar.finish();
                    //判断是不是json文件
                    if(res.substr(0, 2) == '{"'){
                        http._requestCall(options, JSON.parse(res), function(){
                            that.fetchHtml(url, callback)
                        })
                    }else{
                        $.isFunction(callback) && callback({
                            html: res,
                            url: url
                        });
                    }
                },
                error: function(res){
                    loadbar.error();
                    alert.error('请求视图文件异常\n文件路径：' + url + '\n状态：' + res.status);
                }
            });

            $.ajax(options);
        },
        /**
         * 填充html
         * @param url
         * @param htmlElem
         * @param modeName
         * @returns {{htmlElem: *, title: *, url: *}}
         */
        fillHtml: function (url, htmlElem, modeName) {
            var fluid = htmlElem.find('.layui-fluid[lay-title]');
            //找到title
            var title = fluid.attr('lay-title') || "";
            title != "" && this.setTitle(title);

            var appRoot = this.appBodyId || this.appId;

            //防止出现js先加载，然后再进行html渲染，所以将js延后渲染
            var scripts = [];
            htmlElem.children().each(function(n, v){
                if(v.tagName === "SCRIPT" && ($(v).attr("type") || "JAVASCRIPT").toUpperCase() == "JAVASCRIPT") {
                    scripts.push(v);
                    v.remove();
                }
            });

            appRoot[modeName || "html"](htmlElem.html());

            if (modeName == 'prepend') {
                this.parseHtml(appRoot.children('[lay-url="' + url + '"]'));
                appRoot.children().eq(0).append(scripts);
            } else {
                this.parseHtml(appRoot);
                appRoot.append(scripts);
            }

            //重新对面包屑进行渲染
            layui.element.render('breadcrumb');

            return {title: title, url: url, htmlElem: htmlElem};
        },
        /**
         * 解析并渲染html
         * @param appRoot
         */
        parseHtml: function(appRoot){
            if (!appRoot) appRoot = this.appBodyId;

            var that = this, router = layui.router();

            //找到所有的模板
            var templates = appRoot.get(0).tagName == 'SCRIPT' ?
                appRoot : appRoot.find('*[template]');

            //渲染模板
            var renderTemplate = function (curTpl, data, callback) {
                laytpl(curTpl.html()).render(data, function (html) {
                    try {
                        html = $(
                            tools.checkHtmlTag(html) ? html : '<span>' + html + '</span>'
                        )
                    } catch (err) {
                        html = $('<span>' + html + '</span>')
                    }

                    //赋值，是否template
                    html.attr('is-template', true);
                    //在当前模板之后，添加html
                    curTpl.after(html);
                    //判断是否方法，然后触发
                    $.isFunction(callback) && callback(html);
                })
            };

            layui.each(templates, function (index, item) {
                item = $(item);
                //获取回调
                var layDone = item.attr('lay-done') || item.attr('lay-then'),
                    //接口 url
                    url = laytpl(item.attr('lay-url')|| '').render(router),
                    type = laytpl(item.attr('lay-type')|| 'POST').render(router),
                    //接口参数
                    data = laytpl(item.attr('lay-data')|| '').render(router),
                    //接口请求的头信息
                    headers = laytpl(item.attr('lay-headers')|| '').render(router);

                //拼装参数
                try {
                    data = new Function('return '+ data + ';')();
                } catch(e) {
                    tools.log(item + "data error: " + e, "error");
                    data = {};
                }

                try {
                    headers = new Function('return '+ headers + ';')();
                } catch(e) {
                    tools.log(item + "headers error: " + e, "error");
                    headers = headers || {};
                }

                //如果存在对外接口，需要拼装一下
                if (url) {
                    //进行AJAX请求
                    http.request({
                        url: url,
                        type: type,
                        data: data,
                        header: headers,
                        done: function (data, msg) {
                            renderTemplate(item, data);
                            try{
                                if (layDone) (new Function(layDone)());
                            }catch (e) {
                                tools.log(item, "error");
                                tools.log("layDone error: " + e, "error");
                            }
                        }
                    })
                } else {
                    renderTemplate(item, {}, tools.ie8 ? function (elem) {
                        if (elem[0] && elem[0].tagName != 'LINK') return;
                        appRoot.hide();
                        elem.load(function () {
                            appRoot.show();
                        })
                    } : null);

                    try{
                        if (layDone) (new Function(layDone)());
                    }catch (e) {
                        tools.log(item, "error");
                        tools.log("layDone error: " + e, "error");
                    }
                }
            })
        },
        /**
         * 渲染指定界面
         * @param url
         * @param callback
         */
        render: function(url, callback) {
            this.fetchHtml(url, (res) => {
                var htmlElem = $('<div>' + res.html + '</div>');
                var params = this.fillHtml(res.url, htmlElem, 'html');
                $.isFunction(callback) && callback(params)
            })
        },
        /**
         * 渲染框架layout
         * @param callback
         * @param url
         */
        renderLayout: function(callback, url) {
            //把app容器值设置为null，即使用根app节点挂载
            this.appBodyId = null;

            this.render(url || conf.admin.layout, (res) => {
                this.appBodyId = $('#' + conf.admin.appBodyId);
                //如果打开tabs
                if (conf.admin.showTabs) {
                    this.appBodyId.addClass('thinker-tabs-body')
                }
                $.isFunction(callback) && callback();
            })
        },
        /**
         * 渲染单独界面
         * @param url
         * @param callback
         */
        renderFullPage: function (url, callback) {
            this.renderLayout(() => {
                this.appBodyId = null;
                $.isFunction(callback) && callback();
            }, url);
        },
        /**
         * 渲染并加载tab文件
         * @param route
         * @param callback
         */
        renderTabs: function (route, callback) {
            this.tab.change(route, callback)
        },
        /**
         * 重新渲染html
         * @param elem
         */
        reRenderHtml: function(elem){
            if (typeof elem == 'string') elem = $('#' + elem);
            var action = elem.get(0).tagName == 'SCRIPT' ? 'next' : 'find';
            elem[action]('[is-template]').remove();
            view.parseHtml(elem);
        },
        /**
         * tab相关操作
         */
        tab: {
            isInit: false,
            data: [],
            tabMenuTplId: 'TPL-app-tabsmenu',
            minLeft: null,
            maxLeft: null,
            wrap: '.thinker-tabs-wrap',
            menu: '.thinker-tabs-menu',
            next: '.thinker-tabs-next',
            prev: '.thinker-tabs-prev',
            close: '.thinker-tabs-down',
            step: 200,
            init: function () {
                var tab = this;

                layui.dropdown.render({
                    elem: tab.close,
                    click: function (name) {
                        if(name == 'all'){
                            tab.delAll();
                        }else if(name == 'other'){
                            tab.delOther()
                        }else if(name == "current"){
                            //删除当前的
                            tab.del(
                                $(tab.menu).find(".thinker-tabs-active").attr("lay-url")
                            );
                        }
                    },
                    options: [{
                        name: 'current',
                        title: '关闭当前选项卡'
                    }, {
                        name: 'other',
                        title: '关闭其他选项卡'
                    }, {
                        name: 'all',
                        title: '关闭所有选项卡'
                    }]
                });

                $doc.on('click', tab.wrap + ' .thinker-tabs-btn', function (e) {
                    var url = $(this).attr('lay-url');
                    if ($(e.target).hasClass('thinker-tabs-close')) {
                        tab.del(url)
                    } else {
                        var type = $(this).attr('data-type');
                        if (type == 'page') {
                            tab.change(tab.has(url));
                        } else if (type == 'prev' || type == 'next') {
                            tab.menuElem = $(tab.menu);
                            var menu = tab.menuElem;
                            tab.minLeft = tab.minLeft || parseInt(menu.css('left'));
                            tab.maxLeft = tab.maxLeft || $(tab.next).offset().left;

                            var left = 0;
                            if (type == 'prev') {
                                left = parseInt(menu.css('left')) + tab.step;
                                if (left >= tab.minLeft) left = tab.minLeft;
                            } else {
                                left = parseInt(menu.css('left')) - tab.step;
                                var last = menu.find('li:last');
                                if (last.offset().left + last.width() < tab.maxLeft) return
                            }
                            menu.css('left', left)
                        }
                    }
                });

                $('.thinker-tabs-hidden').addClass('layui-show');
                this.isInit = true
            },
            has: function (url) {
                var exists = false;
                layui.each(this.data, function (i, data) {
                    if (data.fileurl == url) return (exists = data)
                });
                return exists
            },
            delAll: function (type) {
                var tab = this
                var menuBtnClas = tab.menu + ' .thinker-tabs-btn'
                $(menuBtnClas).each(function () {
                    var url = $(this).attr('lay-url')
                    if (url === conf.views.entry) return true
                    tab.del(url)
                })
            },
            delOther: function () {
                var tab = this
                var menuBtnClas = tab.menu + ' .thinker-tabs-btn'
                $(menuBtnClas + '.thinker-tabs-active')
                    .siblings()
                    .each(function () {
                        var url = $(this).attr('lay-url')
                        tab.del(url)
                    })
            },
            del: function (url, backgroundDel) {
                var tab = this
                if (tab.data.length <= 1 && backgroundDel === undefined) return
                layui.each(tab.data, function (i, data) {
                    if (data.fileurl == url) {
                        tab.data.splice(i, 1)
                        return true
                    }
                })

                var lay = '[lay-url="' + url + '"]'
                var thisBody = $(
                    '#' + conf.admin.appBodyId + ' > .thinker-tabs-item' + lay
                )
                var thisMenu = $(this.menu).find(lay)
                thisMenu.remove();
                thisBody.remove();

                if (backgroundDel === undefined) {
                    if (thisMenu.hasClass('thinker-tabs-active')) {
                        $(this.menu + ' li:last').click()
                    }
                }
            },
            refresh: function (url) {
                url = url || layui.admin.route.fileurl;
                if (this.has(url)) {
                    this.del(url, true)
                    view.renderTabs(url)
                }
            },
            clear: function () {
                this.data = []
                this.isInit = false
                $doc.off('click', this.wrap + ' .thinker-tabs-btn')
            },
            change: function (route, callback) {
                if (typeof route == 'string') {
                    route = layui.router('#' + route)
                    route.fileurl = '/' + route.path.join('/')
                }
                var fileurl = route.fileurl
                var tab = this
                if (tab.isInit == false) tab.init()

                var changeView = function (lay) {
                    $('#' + conf.admin.appBodyId + ' > .thinker-tabs-item' + lay)
                        .show()
                        .siblings()
                        .hide()
                };

                var lay = '[lay-url="' + fileurl + '"]';

                var activeCls = 'thinker-tabs-active'

                var existsTab = tab.has(fileurl)
                if (existsTab) {
                    var menu = $(this.menu)
                    var currentMenu = menu.find(lay)

                    if (existsTab.href !== route.href) {
                        tab.del(existsTab.fileurl, true)
                        tab.change(route)
                        return false
                        //tab.del(route.fileurl)
                    }
                    currentMenu
                        .addClass(activeCls)
                        .siblings()
                        .removeClass(activeCls)

                    changeView(lay)

                    this.minLeft = this.minLeft || parseInt(menu.css('left'))

                    var offsetLeft = currentMenu.offset().left
                    if (offsetLeft - this.minLeft - $(this.next).width() < 0) {
                        $(this.prev).click()
                    } else if (offsetLeft - this.minLeft > menu.width() * 0.5) {
                        $(this.next).click()
                    }
                    $doc.scrollTop(-100)

                    layui.admin.navigate(route.href)
                } else {
                    view.fetchHtml(fileurl, function (res) {
                        var htmlElem = $(
                            "<div><div class='thinker-tabs-item' lay-url='" +
                            fileurl +
                            "'>" +
                            res.html +
                            '</div></div>'
                        );
                        var params = view.fillHtml(fileurl, htmlElem, 'prepend');
                        route.title = params.title;
                        tab.data.push(route);
                        view.reRenderHtml(tab.tabMenuTplId);

                        var currentMenu = $(tab.menu + ' ' + lay);
                        currentMenu.addClass(activeCls);

                        changeView(lay)

                        if ($.isFunction(callback)) callback(params)
                    })
                }

                layui.admin.sidebarFocus(route.href);
            },
            onChange: function () {
            }
        }
    };

    exports("view", view);
});