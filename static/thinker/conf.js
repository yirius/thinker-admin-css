;layui.define([], function(exports){
    //找到根目录
    var rootPath = "/" + layui.cache.dir.split(layui.cache.host)[1].replace("layui/", "");

    //参数
    var conf = {
        //版本号
        v: "0.0.1",
        //网站名称
        name: 'THINKER权限系统',
        //网站logo
        logo: './static/logo/logo.svg',
        //是否开启调试模式，开启的话接口异常会抛出异常 URL信息
        debug: layui.cache.debug,
        //事件触发的名称
        eventName: 'thinker-event',
        //本地存储表名
        tableName: 'thinker',
        //登录 token 名称，request 请求的时候会带上此参数到 header
        tokenName: 'Access-Token',
        //登录用户信息
        tokenInfoName: 'Access-Token-Info',
        //layui所在根目录
        rootPath: rootPath,
        //全局自定义响应字段
        response: {
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
        },
        //请求的相关参数
        request: {
            data: {},
            headers: {},
            //0的话token加载header中，1的话附带在携带参数中
            tokenType: 0,
        },
        /**
         * 附加的libs
         */
        extendlibs: {
            "md5": "libs/md5",
            "excel": "libs/excel",
            "qrcode": "libs/qrcode",
            "tinymce": "libs/tinymce",
            "echarts": "libs/echarts",
            "xmSelect": "libs/xmSelect",
            "iconplus": "libs/iconplus",
            "treeplus": "libs/treeplus",
            "clipboard": "libs/clipboard",
            "tableplus": "libs/tableplus",
            "fileSelect": "libs/fileSelect",
            "thinkerTable": "libs/thinkerTable",
            "echartsTheme": "libs/echartsTheme",
        },
        /**
         * 表格配置参数
         */
        table: {
            config: {
                page: true,
                size: 'sm',
                even: true,
                skin: 'line',
                //每页显示的条数
                limit: 10,
                limits: [10, 50, 100, 300, 500, 1000, 3000],
                //是否显示加载条
                loading: true,
                //用于对分页请求的参数：page、limit重新设定名称
                request: {
                    pageName: 'page', //页码的参数名称，默认：page
                    limitName: 'limit' //每页数据量的参数名，默认：limit
                },
            },
            toolbar: {
                icons: {},
                events: {}
            }
        },
        /**
         * 后台参数配置
         */
        admin: {
            open: true,
            //需要引入的css
            style: [],
            //容器ID
            appId: 'thinker-app',
            //容器内容ID
            appBodyId: 'thinker-app-body',
            //sidebar对应ID
            sidebarId: "thinker-app-sidebar",
            //整个框架的地址
            layout: rootPath + 'thinker/views/layout.html',
            //主页网址
            home: rootPath + 'thinker/views/index.html',
            //是否开启tabs
            showTabs: true,
            //需要全屏的界面
            fullpage: {
                "/login": rootPath + 'thinker/views/login.html'
            },
            //顶部栏目
            menu: {
                top: [{
                    title: "切换全屏",
                    icon: "layui-icon-screen-full",
                    event: "fullscreen",
                    class: "layui-hide-xs",
                    notShow: function(){
                        return false;
                    }
                }],
                list: [{
                    title: "个人信息",
                    event: "userinfo",
                    notShow: function(){
                        return false;
                    }
                },{
                    title: "清理缓存",
                    event: "clearcache",
                    notShow: function(){
                        return false;
                    }
                }]
            },
            //对应的一些接口
            apis: {
                menu: "/thinkeradmin/Admin/menus",
                login: "/thinkeradmin/Admin/login",
                captcha: "/thinkeradmin/Admin/captcha",
                sms: "",
                qrcode: "",
            },
            //登录和权限判定的一些参数
            login: {
                //是否检查登录
                check: true,
                //登录页面，当未登录或登录失效时进入
                login: '/login',
                //是否使用验证码
                vercode: true,
                //短信验证码登录
                sms: false,
                //二维码扫码登录
                qrcode: false
            },
            events: {
                userinfo() {
                    layui.admin.navigate("/thinkeradmin/Show/index");
                },
                clearcache() {
                    console.log(222);
                }
            }
        }
    };
    exports("conf", conf);
});