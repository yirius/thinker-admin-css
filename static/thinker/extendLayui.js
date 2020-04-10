;layui.define(["jquery"], function(exports){
    /**
     * 给$添加loading参数
     */
    layui.$.prototype.loading = function() {
        //如果选择了loading的对象
        if (this.length > 0) {
            if (this[0].tagName.toUpperCase() == "BUTTON") {
                var curBtn = layui.$(this[0]);
                //判断button是否存在icon
                var iconI = curBtn.find(".layui-icon");
                if(iconI.length == 0) {
                    iconI = curBtn.find(".fa");
                }
                var isShowLoading = curBtn.data("isShowLoading");
                if (isShowLoading) {
                    curBtn.data("isShowLoading", !isShowLoading);
                    curBtn.removeAttr("disabled").removeClass("thinker-loading-btn");
                    //如果存在图标，判断当前图标格式
                    if (iconI.length > 0) {
                        if (iconI.data("class")) {
                            iconI.attr("class", iconI.data("class"));
                        } else {
                            iconI.remove();
                        }
                    }
                } else {
                    curBtn.data("isShowLoading", true);
                    curBtn.attr("disabled", "disabled").addClass("thinker-loading-btn");
                    //如果存在图标，按照存在图标走
                    if (iconI.length > 0) {
                        iconI.data("class", iconI.attr("class"));
                        iconI.attr("class", "layui-icon layui-icon-loading-1 layui-anim layui-anim-rotate layui-anim-loop");
                    } else {
                        curBtn.prepend("<span class=\"layui-icon layui-icon-loading-1 layui-anim layui-anim-rotate layui-anim-loop\"></span>")
                    }
                }
            } else {
                //找到可以挂载的上级DIV
                function findDiv($this) {
                    if ($this.length > 0) {
                        if ($this[0].tagName.toUpperCase() == "DIV") {
                            return layui.$($this[0]);
                        } else {
                            return findDiv(layui.$($this).parent());
                        }
                    }

                    return null;
                }

                var curDiv = findDiv(this);

                var isShowLoading = curDiv.data("isShowLoading");
                if (isShowLoading) {
                    curDiv.data("isShowLoading", !isShowLoading);
                    //已经展示了，去掉
                    curDiv.find(".thinker-loading-mask").fadeOut(300, function () {
                        curDiv.find(".thinker-loading-mask").remove();
                    });
                } else {
                    //如果不存在定位，需要给他指定一个
                    if (!curDiv.css("position") || curDiv.css("position") == "static") {
                        curDiv.css("position", "relative");
                    }
                    curDiv.data("isShowLoading", true);
                    curDiv.append("<div class='thinker-loading-mask' style='display: none'><div class='thinker-loading'></div></div>");
                    //已经展示了，去掉
                    curDiv.find(".thinker-loading-mask").fadeIn(300);
                    //阻止点击取消展示
                    curDiv.find(".thinker-loading-mask").click(function(e){
                        e.preventDefault();
                        return false;
                    });
                }
            }
        }
    };

    exports("extendLayui", {});
});