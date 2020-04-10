;layui.define(['jquery', 'layer', 'laypage', 'http'], function(exports){
    var $ = layui.jquery,
        layer = layui.layer,
        laypage = layui.laypage,
        http = layui.http,
        MOD_NAME = "fileSelect";

    var fileSelect = {
        v: "0.0.1",
        config: {
            //触发的事件
            trigger: "click",
            //路径名称和文件名称
            pathName: "path",
            fileName: "name",
            //可现实的文件数量
            count: 0,
            data: null,
            /**
             * 对应的数据参数url等
             */
            url: null,
            options: {},
            /**
             * 可选择参数，比如上传或选择图片
             */
            uploadUrl: null,
            uploadFileName: "file",
            uploadData: {},
            uploadDone: null,
            //是否可以选择文件
            canSelect: true,
            selectDone: null,
            /**
             * 图片对应后缀
             */
            imageSuffix: ["JPG", "JPEG", "PNG", "BMP", "GIF", "SVG"],
            /**
             * 后缀对应类型
             */
            suffixTypes: {
                AI: {color: "bg-orange", class: "text-xxl", text: "Ai"},
                APK: {color: "bg-green", class: "fa fa-android"},
                BT: {color: "bg-cyan", class: "text-xxl", text: "Bt"},
                CAD: {color: "bg-green", class: "text-xl", text: "Cad"},
                DOC: {color: "bg-blue", class: "text-xxl", text: "W"},
                DOCX: {color: "bg-blue", class: "text-xxl", text: "W"},
                PPT: {color: "bg-orange", class: "text-xxl", text: "P"},
                PPTX: {color: "bg-orange", class: "text-xxl", text: "P"},
                XLS: {color: "bg-green", class: "text-xxl", text: "E"},
                XLSX: {color: "bg-green", class: "text-xxl", text: "E"},
                EXE: {color: "bg-blue", class: "text-xxl", text: "Exe"},
                FLA: {color: "bg-red", class: "text-xxl", text: "Fla"},
                TXT: {color: "bg-geekblue", class: "text-xxl", text: "T"},
            },
        },
        //设置全局项
        set: function(options){
            var that = this;
            that.config = $.extend({}, that.config, options);
            return that;
        },
        //事件监听
        on: function(events, callback){
            return layui.onevent.call(this, MOD_NAME, events, callback);
        }
    };

    //this操作实例
    var thisFileSelect = function(){
        var that = this,
            options = that.config,
            id = options.id || options.index;

        if (id) {
            thisFileSelect.that[id] = that; //记录当前实例对象
            thisFileSelect.config[id] = options; //记录当前实例配置项
        }

        //用户可操作的方法参数
        return {
            config: options,
            reload: function(options) {
                that.reload.call(that, options);
            }
        }
    }, getThisFileSelectConfig = function(id){
        var config = thisFileSelect.config[id];
        if(!config) console.error('The ID option was not found in the FileSelect instance');
        return config || null;
    };

    //暴露的Class实例化方法
    var Class = function(options){
        var that = this;
        that.index = ++fileSelect.index;
        that.config = $.extend({}, that.config, fileSelect.config, options);

        that.config.data = [{
            path: "static/logo/logo.png",
            name: "logo.png"
        }];

        for(var i in that.config.suffixTypes) {
            that.config.data.push({
                path: "/logo/logo." + i.toUpperCase(),
                name: "logo." + i.toUpperCase()
            });
        }

        if(!that.config.elem) {
            throw "elem was not found in the FileSelect option";
        } else {
            that.addEvent();
        }
    };

    /**
     * 绑定点击事件
     */
    Class.prototype.addEvent = function() {
        var that = this;

        if(that.config.elem.jquery) {
            that.config.$elem = that.config.elem;
        } else {
            that.config.$elem = $(that.config.elem);
        }

        that.config.$elem.on(that.config.trigger || "click", function(e){
            that.render();
        });
    };

    /**
     * 重载其中的内容
     */
    Class.prototype.reload = function(){
        var that = this,
            options = that.config;

        var $layer = thisFileSelect.$layer[options.id];
        if($layer) {
            if(!options.data || options.data.length == 0) {
                //ajax获取
            }

            var rows = $layer.find(".layui-row");
            rows.html('');

            layui.each(options.data, function(n, v){
                if(
                    ((that.laypage.curr - 1) * that.laypage.limit <= n)
                    && (n < that.laypage.curr * that.laypage.limit)
                ) {
                    var suffix = "", appendHtml = "";
                    try{
                        var splited = v[that.config.pathName].split(".");
                        suffix = splited[splited.length-1].toUpperCase();
                    } catch (e) {
                        console.error(e);
                    }
                    if(that.config.imageSuffix.indexOf(suffix) >= 0) {
                        appendHtml = '<img src="'+v[that.config.pathName]+'" lay-photo="" class="avatar xl"/>';
                    } else {
                        if(that.config.suffixTypes[suffix]) {
                            var suffixType = that.config.suffixTypes[suffix], iconHtml = '<span>'+suffix+'</span>';
                            //如果存在后缀名称
                            if(suffixType.text) {
                                iconHtml = '<span class="'+suffixType.class+'">'+suffixType.text+'</span>';
                            } else if(suffixType.class) {
                                iconHtml = '<span class="'+suffixType.class+'"></span>';
                            }
                            appendHtml = '<div class="file-ico text-xl '+(suffixType.color || '')+'">'+iconHtml+'</div>';
                        } else {
                            //未识别出来的后缀，直接显示
                            appendHtml = '<div class="file-ico text-xl"><span>'+suffix+'</span></div>';
                        }
                    }
                    rows.append('<div class="fileSelectItem layui-col-xs4 layui-col-sm3 layui-col-lg2 padding-xs" style="cursor: pointer" data-path="'+v[that.config.pathName]+'">' +
                        '<div class="layui-row text-center">' +
                        '<div class="layui-col-xs12"><div class="avatar xl bg-white">'+appendHtml+'</div></div>' +
                        '<div class="layui-col-xs12 padding-lr-xs text-cut">'+v[that.config.fileName].toLowerCase()+'</div>' +
                        '</div>' +
                        (thisFileSelect.selected[options.id].indexOf(v[that.config.pathName]) >= 0? "<span class='fa fa-check-circle text-green' style='position: absolute;right: 30%;bottom: 25%;z-index: 999'></span>" : '') +
                        '</div>');
                }
            });
        }
    };

    /**
     * 渲染弹出
     */
    Class.prototype.render = function() {
        var that = this,
            options = that.config;

        options.id = options.id || options.$elem.attr('id') || that.index;

        if(!thisFileSelect.selected[options.id]) {
            thisFileSelect.selected[options.id] = [];
        }

        var $layer = thisFileSelect.$layer[options.id];
        if(!$layer) {
            var headerBtns = [];
            if(options.canSelect) {
                //可以上传图片
                headerBtns.push("<button class='fileSelect-selectbtn layui-btn bg-red layui-btn-sm fr margin-top-xs margin-lr-sm' disabled>确认选择</button><button class='fileSelect-clearbtn layui-btn bg-orange layui-btn-sm fr margin-top-xs' disabled>清空选择</button>");
                headerBtns.push("<div class='fl'>当前共计选择:<span>0</span></div>");
            }
            if(options.uploadUrl) {
                //可以上传图片
                headerBtns.push("<input type='file' style='display: none'/><button class='fileSelect-uploadbtn layui-btn layui-btn-sm fr margin-top-xs'>上传图片</button>");
            }
            $layer = $('<div class="layui-card heightAll widthAll">' +
                '<div class="layui-card-header">'+headerBtns.join("")+'</div>' +
                '<div class="layui-card-body layui-row" style="height: calc(100% - 100px)">' +
                '</div>' +
                '<div class="solid-top"><div class="layui-page padding-lr-sm" id="layui_page_'+options.id+'"></div></div></div>' +
                '</div>');

            that.laypage = {
                elem: $layer.find(".layui-page")[0],
                count: 0,
                curr: 1,
                limit: 12,
                limits: [12, 24, 48, 128, 256],
                layout: ['prev', 'page', 'next', 'skip', 'count', 'limit'],
                prev: '<i class="layui-icon">&#xe603;</i>',
                next: '<i class="layui-icon">&#xe602;</i>',
                jump: function(obj, first){
                    that.reload();
                }
            };

            if(options.data && options.data.length > 0) {
                that.laypage.count = options.data.length;
            } else {
                if(options.url) {
                    $.ajax($.extend({
                        url: options.url,
                        async: false,
                        success: function(res){
                            options.data = res;
                            that.laypage.count = options.data.length;
                        }
                    }, options.options || {}))
                }
            }

            thisFileSelect.$layer[options.id] = $layer;
        }

        layer.open({
            type: 1,
            area: ["60%", "60%"],
            title: "图片选择",
            resize: false,
            shade: false,
            scrollbar: false,
            skin: "layui-no-scrollbar",
            success: function (layero, index) {
                layero.find(".layui-layer-content").append($layer);
                options.layerindex = index;

                //判断laypage渲染，只绑定一次
                if(!$layer[0].dataset.rendered) {
                    $layer[0].dataset.rendered = 1;
                    //执行一个laypage实例
                    laypage.render(that.laypage);

                    //监听选择事件
                    if(options.canSelect) {
                        var selectbtn = $layer.find(".fileSelect-selectbtn"),
                            clearbtn = $layer.find(".fileSelect-clearbtn");
                        selectbtn.on("click", function(e){
                            options.selectDone && options.selectDone.call(that, thisFileSelect.selected[options.id]);
                            layui.event.call(that, MOD_NAME, 'selected('+ options.id +')',thisFileSelect.selected[options.id]);
                        });
                        clearbtn.on("click", function(e) {
                            thisFileSelect.selected[options.id] = [];
                            that.reload();
                        });
                        //点击item
                        $layer.on("click", ".fileSelectItem", function(e){
                            var index = thisFileSelect.selected[options.id].indexOf($(this).data("path"));
                            if(index >= 0) {
                                thisFileSelect.selected[options.id].splice(index, 1);
                                $(this).find(">span").remove();
                            } else {
                                thisFileSelect.selected[options.id].push($(this).data("path"));
                                $(this).append("<span class='fa fa-check-circle round text-green' style='position: absolute;right: 30%;bottom: 25%;z-index: 999'></span>");
                            }
                            if(thisFileSelect.selected[options.id].length == 0) {
                                selectbtn.attr("disabled", "disabled");
                                clearbtn.attr("disabled", "disabled");
                            } else {
                                selectbtn.removeAttr("disabled");
                                clearbtn.removeAttr("disabled");
                            }
                            $layer.find(".fl>span").text(thisFileSelect.selected[options.id].length);
                        });
                    }

                    //监听上传事件
                    if(options.uploadUrl) {
                        $layer.on("dragover", function(e) {
                            e.preventDefault();
                        });
                        //监听拖动上传
                        $layer[0].ondrop = function(e) {
                            e.preventDefault();
                            that.uploadFile(e.dataTransfer.files);
                        };

                        //点击上传按钮
                        $layer.find(".fileSelect-uploadbtn").on("click", function(){
                            $layer.find("input[type=file]").click();
                        });
                        $layer.find("input[type=file]")[0].addEventListener("change", function(e) {
                            e.preventDefault();
                            if($(this).val() !== "") {
                                that.uploadFile(this.files);
                                $(this).val("");
                            }
                        });
                    }
                }
            },
        });
    };

    /**
     * 使用FormData上传文件
     * @param files
     */
    Class.prototype.uploadFile = function(files){
        var that = this, options = that.config;

        var formData = new FormData();
        if(files.length == 1) {
            formData.append(options.uploadFileName, files[0])
        } else {
            for(var j in files) {
                formData.append(options.uploadFileName + i, files[i])
            }
        }

        for(var i in options.uploadData) {
            formData.append(i, options.uploadData[i]);
        }

        http.post(options.uploadUrl, formData, function(data, msg){
            var concatData = [], index = 0;
            for(var i in data) {
                concatData.push({});
                concatData[index][options.pathName] = data[i];
                var spilted = data[i].replace(/\\/g, "/").split("/");
                concatData[index][options.fileName] = spilted[spilted.length-1];
                index++;
            }
            if(typeof options.uploadDone == "function") {
                var result = options.uploadDone.call(that, concatData);
                if(result) {
                    concatData = result;
                }
            }
            that.config.data = concatData.concat(that.config.data);
            that.reload();
        })
    };

    //记录所有实例
    thisFileSelect.that = {}; //记录所有实例对象
    thisFileSelect.config = {}; //记录所有实例配置项
    thisFileSelect.$layer = {}; //记录所有实例弹出界面
    thisFileSelect.selected = {}; //记录所有实例弹出界面


    //对外的渲染接口
    fileSelect.render = function(options){
        var instance = new Class(options);
        return thisFileSelect.call(instance);
    };

    exports(MOD_NAME, fileSelect);
});