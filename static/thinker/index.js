;layui.extend({
    //使用的utils
    http: "utils/http",
    tools: "utils/tools",
    alert: "utils/alert",
    session: "utils/session",
    loadbar: "utils/loadbar",
    dropdown: "utils/dropdown",
    //加载admin入口
    admin: 'admin/admin'
}).define(["conf", "extendLayui", "admin"], function (exports) {
    var conf = layui.conf, admin = layui.admin;

    //解决 IE8 不支持console
    window.console = window.console || (function () {
        var c = {};
        c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile
            = c.clear = c.exception = c.trace = c.assert = function () {
        };
        return c;
    })();

    if (conf) {
        //如果存在conf，再继续运算
        conf.extendlibs && layui.extend(conf.extendlibs);

        //如果存在admin参数
        if (conf.admin) {
            conf.admin.open && admin.init();
        }
    }

    exports("index", {});
});