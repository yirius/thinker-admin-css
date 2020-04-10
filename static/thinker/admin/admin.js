layui.extend({
    view: 'admin/view'
}).define(['jquery', 'conf', 'view', 'element', 'session'], function (exports) {
    var $ = layui.$,
        conf = layui.conf,
        view = layui.view,
        element = layui.element;

    var $win = $(window), $doc = $(document),
        shrinkClassName = 'thinker-shrink-app';

    var admin = {
        //当前路由
        route: layui.router(),
        //初始化
        init: function() {
            //存在样式文件，加载
            if(conf.admin.style) {
                layui.each(conf.admin.style, function (index, url) {
                    layui.link(url + '?v=' + conf.v)
                });
            }

            //初始化layout
            this.renderPage(this.route)
        },
        /**
         * 初始化界面view
         * @param route
         */
        renderPage: function(route){
            //如果是默认界面或者不存在，就打开首页
            if (!this.route.href || this.route.href == '/') {
                route = this.route = layui.router('#' + conf.admin.home);
            }
            //赋值打开的界面地址
            route.fileurl = '/' + route.path.join('/');

            //判断登录页面
            if (conf.admin.login.check == true) {
                if (layui.session.token()) {
                    if (route.fileurl == conf.admin.login.login) {
                        this.navigate('/');
                        return;
                    }
                } else {
                    if (route.fileurl != conf.admin.login.login) {
                        layui.session.logout();
                        return;
                    }
                }
            }

            if (!conf.admin.fullpage[route.fileurl]) {
                //判断全屏界面的缩写是否存在
                if (view.appBodyId == null) {
                    //加载layout文件
                    view.renderLayout(function () {
                        //重新渲染导航
                        element.render('nav');
                        //加载内部界面
                        admin._renderPage(route);
                    })
                } else {
                    admin._renderPage(route);
                }
            } else {
                //加载单页面
                view.renderFullPage(conf.admin.fullpage[route.fileurl], function () {
                    if (conf.admin.showTabs) view.tab.clear();
                })
            }
        },
        /**
         * 根据路由，渲染界面HTML
         * @param route
         */
        _renderPage: function(route){
            if (conf.admin.showTabs) {
                view.renderTabs(route)
            } else {
                view.render(route.fileurl)
            }
        },
        /**
         * 切换tab的时候焦点变更
         * @param url
         */
        sidebarFocus: function (url) {
            //传递了就按传递的走，否则去当前界面的
            url = url || this.route.href;
            //找到当前界面对应按钮
            var elem = $('#' + conf.admin.sidebarId)
                .find('[lay-href="' + url + '"]')
                .eq(0);
            //如果存在，就全部赋值
            if (elem.length > 0) {
                elem.parents('.layui-nav-item').addClass('layui-nav-itemed')
                elem.click()
            }
        },
        /**
         * 设置伸缩
         * @param open
         */
        flexible: function (open) {
            if (open == true) {
                view.appId.removeClass(shrinkClassName)
            } else {
                view.appId.addClass(shrinkClassName)
            }
        },
        /**
         * 时间监听定义
         * @param name
         * @param callback
         * @returns {*}
         */
        on: function (name, callback) {
            return layui.onevent(conf.eventName, 'system(' + name + ')', callback)
        },
        fire: function (name, params) {
            layui.event(conf.eventName, 'system(' + name + ')', params)
        },
        /**
         * 跳转路径
         * @param url
         */
        navigate: function (url) {
            if (url == conf.admin.home) url = '/';
            window.location.hash = url;
        },
    };


    //所有可以触发的事件
    var events = $.extend({
        /**
         * 放展缩小
         */
        flexible: function(){
            var status = view.appId.hasClass(shrinkClassName);
            admin.flexible(status);
            layui.session.set('flexible', status);
        },
        /**
         * 刷新当前的tab
         */
        refresh: function(){
            var url = admin.route.href;
            if (conf.admin.showTabs == true) {
                view.tab.refresh(url);
            } else {
                view.render(url)
            }
        },
        /**
         * 退出登录
         */
        logout: function(){
            layui.session.logout()
        },
        /**
         * 全屏幕
         * @param e
         */
        fullscreen: function(e){
            var normalCls = 'layui-icon-screen-full';
            var activeCls = 'layui-icon-screen-restore';
            var ico = e.find('.layui-icon');

            if (ico.hasClass(normalCls)) {
                var e = document.body;
                e.webkitRequestFullScreen
                    ? e.webkitRequestFullScreen()
                    : e.mozRequestFullScreen
                    ? e.mozRequestFullScreen()
                    : e.requestFullScreen && e.requestFullscreen();
                ico.removeClass(normalCls).addClass(activeCls);
            } else {
                var e = document;
                e.webkitCancelFullScreen
                    ? e.webkitCancelFullScreen()
                    : e.mozCancelFullScreen
                    ? e.mozCancelFullScreen()
                    : e.cancelFullScreen
                        ? e.cancelFullScreen()
                        : e.exitFullscreen && e.exitFullscreen();
                ico.removeClass(activeCls).addClass(normalCls)
            }
        }
    }, conf.admin.events || {});

    //当小于这个尺寸的时候会进行手机端的适配
    var isMobileAdapter = false;
    //适应手机端
    function mobileAdapter() {
        admin.flexible(false);
        var device = layui.device();
        if (device.weixin || device.android || device.ios) {
            //点击空白处关闭侧边栏
            $doc.on('click', '#' + conf.admin.appBodyId, function () {
                if (
                    layui.tools.getScreenType() < 2 &&
                    !view.appId.hasClass(shrinkClassName)
                ) {
                    admin.flexible(false)
                }
            })
        }
        isMobileAdapter = true;
    }

    //监听窗口放大缩小，以及hash变化
    $win.on('resize', function (e) {
        //当界面大小变化的时候
        if (layui.tools.getScreenType() < 2) {
            if (isMobileAdapter == true) return;
            mobileAdapter()
        } else {
            isMobileAdapter = false
        }
    }).on('hashchange', function (e) {
        //移动端跳转链接先把导航关闭
        if (layui.tools.getScreenType() < 2) {
            admin.flexible(false);
        }
        admin.route = layui.router();
        //跳转的时候关闭所有弹出窗口
        layui.layer.closeAll();
        //初始化界面
        admin.renderPage(admin.route)
    });

    //放大缩小按钮
    var shrinkSidebarBtn = '.' + shrinkClassName + ' #'+conf.admin.sidebarId+' .layui-nav-item a';

    $doc.on('keydown', function (e) {
        //在屏幕中敲击回车键，需要判断是否存在form
        var ev = document.all ? window.event : e;
        if (ev.keyCode == 13) {
            var form = $(':focus').parents('.layui-form');
            form.find('[lay-submit]').click();
        }
    }).on('click', '*[lay-href]', function (e) {
        //界面上点击了含有href标签的
        var href = $(this).attr('lay-href');
        var target = $(this).attr('target');
        //判断是否空标签
        if (href == '') return;
        //可以进行下一步
        function next() {
            target == '__blank' ? window.open(href) : admin.navigate(href);
        }

        if ($.isFunction(self.routeLeaveFunc)) {
            self.routeLeaveFunc(self.route, href, next)
        } else {
            next()
        }

        return false;
    }).on('click', '*[lay-photos]', function (e) {
        //点击照片进行预览的
        var _this = this, data = [], startIndex = 0, id = "photos"+(new Date()).getTime();
        $('[lay-photos="'+$(this).attr('lay-photos')+'"]').each(function(n,v){
            if(_this == v){
                startIndex = n;
            }
            var that = $(v);
            data.push({
                alt: that.attr("alt"),
                pid: that.attr("id") || id + "n",
                src: that.attr("src") || that.attr("href"),
                thumb: that.attr("src") || that.attr("href"),
            });
        });
        layui.layer.photos({
            photos: {
                title: "相册预览",
                id: id,
                start: startIndex,
                data: data
            }
        })
    }).on('click', '*[lay-popup]', function (e) {
        //点击了界面上的弹出
        var params = $(this).attr('lay-popup')
        // self.popup(
        //     params.indexOf('{') === 0
        //         ? new Function('return ' + $(this).attr('lay-popup'))()
        //         : {url: params}
        // );
        return false
    }).on('mouseenter', '*[lay-tips]', function (e) {
        //点击了小tips
        var title = $(this).attr('lay-tips')
        var dire = $(this).attr('lay-dire') || 3;
        if (title) {
            layui.layer.tips(title, $(this), {
                tips: [dire, '#263147']
            })
        }
    }).on('mouseleave', '[lay-tips]', function (e) {
        layui.layer.closeAll('tips');
    }).on('click', '*[' + conf.eventName + ']', function (e) {
        //触发了自定义点击事件
        var $this = $(this), eventName = $this.attr(conf.eventName);
        //首先判断定义的事件中是否存在，存在就去激活
        events[eventName] && events[eventName]($this);
        //触发所有的事件
        admin.fire(eventName, $this);
    }).on('click', shrinkSidebarBtn, function (e) {
        //点击了侧边栏放大缩小按钮
        if (isMobileAdapter == true) return;
        var chileLength = $(this)
            .parent()
            .find('.layui-nav-child').length;
        if (chileLength > 0) {
            admin.flexible(true);
            layui.layer.closeAll('tips')
        }
    }).on('mouseenter', shrinkSidebarBtn, function (e) {
        //进入按钮
        var title = $(this).attr('title')
        if (title) {
            layui.layer.tips(title, $(this).find('.layui-icon'), {
                tips: [2, '#263147']
            })
        }
    }).on('mouseleave', shrinkSidebarBtn, function (e) {
        layui.layer.closeAll('tips')
    });

    //判断界面大小
    if (layui.tools.getScreenType() < 2) {
        mobileAdapter()
    } else {
        var flexibleOpen = layui.session.get('flexible');
        admin.flexible(flexibleOpen === null ? true : flexibleOpen)
    }

    exports("admin", admin);
});