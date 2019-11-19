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
```
其他全部为layui代码