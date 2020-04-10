;layui.define(["jquery", "layer", "tools"], function (exports) {
    var $ = layui.jquery, layer = layui.layer, tools = layui.tools;
    //内置颜色，不可直接更改
    var color = {
        info: "#1890ff",
        success: "#52c41a",
        warn: "#fa8c16",
        error: "#f5222d"
    };

    /**
     * 创建并附加css
     */
    function createColorCss() {
        var $alertColorCss = $("#thinker-alert-color-css"), htmls = [];
        for(var i in color) {
            htmls.push(".thinker-layer-"+i+"-modal .layui-layer-btn0{" +
                "border-color: "+color[i]+";" +
                "background-color: "+color[i]+";" +
                "}");
        }
        if($alertColorCss.length == 0) {
            $("head").append("<style id='thinker-alert-color-css'>"+htmls.join('')+"</style>");
        } else {
            $alertColorCss.html(htmls.join(''));
        }
    }

    createColorCss();

    //主题方法
    var alert = {
        /**
         * 设置颜色
         * @param name
         * @param rgb
         * @returns {alert}
         */
        setColor: function(name, rgb){
            if(typeof name == "object") {
                color = $.extend(color, name);
            } else {
                color[name] = rgb;
            }

            createColorCss();
            return this;
        },
        /**
         * 信息提示方法
         * @param msg
         * @param params
         */
        info: function (msg, params) {
            params = params || {};
            params.titleIcoColor = params.titleIcoColor || color.info;
            params.titleIco = params.titleIco || 'layui-icon layui-icon-notice';
            params.title = [
                '<span class="avatar sm round" style="background-color: '+params.titleIcoColor+';margin-top: -5px"><i class="'+params.titleIco+' text-xs"></i></span><span class="margin-left-xs">' + (params.title || '温馨提示') + '</span>',
                'background:#fff;border:none;font-weight:bold;font-size:18px;color:#08132b;padding-top:10px;height:46px;line-height:46px;padding-bottom:0;'
            ];
            params = $.extend({
                btn: ['我知道了'],
                skin: 'thinker-layer-' + (params.alerttype || "info") + "-modal",
                area: [tools.getScreenType() < 1 ? '90%' : '50%'],
                closeBtn: 0,
                shadeClose: true
            }, params);
            layer.alert(msg, params);
        },
        /**
         * 信息成功的方法
         * @param msg
         * @param params
         */
        success: function (msg, params) {
            params = params || {};
            params.titleIco = 'layui-icon layui-icon-ok';
            params.titleIcoColor = color.success;
            params.alerttype = "success";
            params.title = "成功提示";
            this.info(msg, params)
        },
        /**
         * 警告信息方法
         * @param msg
         * @param params
         */
        warn: function (msg, params) {
            params = params || {};
            params.titleIco = 'fa fa-warning';
            params.titleIcoColor = color.warn;
            params.alerttype = "warn";
            params.title = "警告提示";
            this.info(msg, params)
        },
        /**
         * 错误信息方法
         * @param msg
         * @param params
         */
        error: function (msg, params) {
            params = params || {};
            params.titleIco = 'layui-icon layui-icon-close';
            params.titleIcoColor = color.error;
            params.alerttype = "error";
            params.title = "错误提示";
            this.info(msg, params)
        }
    };

    exports("alert", alert);
});