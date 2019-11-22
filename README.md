# Thinker-Admin-Css
基于layui。<br>
基于nepAdmin。<br>
---
*该Css框架是配合PHP版本或JAVA版本Thinker-Admin使用*<br>
*其他开发也可以使用*
---
**单独使用时需要注意**
```
layui.table.js
//存在改动
var t=layui.$,if(layui.view._parseRequest){
    t._ajax = function(options){
        t.ajax(layui.view._parseRequest(options));
    }
},
//同时全局搜索ajax，替换
t.ajax ---> t._ajax

//加入了refresh
Class.prototype.config = {
    limit: 10 //每页显示的数量
    ,loading: true //请求数据时，是否显示loading
    ,cellMinWidth: 60 //所有单元格默认最小宽度
    ,defaultToolbar: ['refresh', 'filter', 'exports', 'print'] //工具栏右侧图标
    ,autoSort: true //是否前端自动排序。如果否，则需自主排序（通常为服务端处理好排序）
    ,text: {
        none: '无数据'
    }
};
```
其他全部为layui代码