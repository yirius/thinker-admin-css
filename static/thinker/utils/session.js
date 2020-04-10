;layui.define(["conf"], function (exports) {
    var conf = layui.conf, MOD_NAME = "session", MOD = {
        /**
         * 是否存在缓存key
         * @param name
         * @returns {boolean}
         */
        has: function (name) {
            var tableData = layui.data(conf.tableName);
            return (name in tableData);
        },
        /**
         * 读取缓存，不存在返回null
         * @param name
         * @returns {null|*}
         */
        get: function (name) {
            if (!this.has(name)) {
                return null;
            } else {
                return layui.data(conf.tableName)[name];
            }
        },
        /**
         * 设置缓存
         * @param name
         * @param value
         */
        set: function (name, value) {
            layui.data(conf.tableName, {
                key: name,
                value: value
            });
        },
        /**
         * 删除key缓存
         * @param name
         */
        remove: function (name) {
            layui.data(conf.tableName, {
                key: name,
                remove: true
            });
        },
        /**
         * 清空当前缓存
         */
        clear: function () {
            layui.data(conf.tableName, null);
        },
        /**
         * 获取到token参数
         * @returns {*|string}
         */
        token: function () {
            return this.get(conf.tokenName) || '';
        },
        /**
         * 用户信息
         */
        userinfo: function() {
            return this.get(conf.tokenInfoName);
        },
        /**
         * 用户信息登录进session
         * @param data
         */
        login: function (data) {
            if(data[conf.tokenName]) {
                this.set(conf.tokenName, data[conf.tokenName]);
                delete data[conf.tokenName];
                this.set(conf.tokenInfoName, data);
            } else {
                console.error("error login data, no tokenName");
            }
        },
        /**
         * 清空登录信息
         */
        logout: function () {
            //清空本地记录的 token
            this.remove(conf.tokenName);
            this.remove(conf.tokenInfoName);
            //跳转到登入页
            location.hash = conf.admin.login.login;
        }
    };

    exports(MOD_NAME, MOD);
});