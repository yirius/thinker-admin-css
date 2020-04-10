;layui.define(["tableplus", "session", "tools", "laydate", "xmSelect", "excel"], function (exports) {
    var $ = layui.$,
        table = layui.tableplus,
        excel = layui.excel,
        MOD_NAME = "thinkerTable",
        HIDE = "layui-hide",
        ELEM_EDIT = 'layui-table-edit',
        ELEM_CELL = 'layui-table-cell';

    var thinkerTable = {
        /**
         * 获取储存名称
         * @param tableConfig
         * @returns {string}
         */
        getTableCacheName(tableConfig) {
            return location.pathname + location.hash + tableConfig.id;
        },
        /**
         * 渲染cols数据信息
         * @param tableConfig
         * @returns {*}
         */
        renderCols(tableConfig) {
            var cols = tableConfig.cols;
            if (tableConfig.thinkerCache) {
                var tableCache = layui.session.get(this.getTableCacheName(tableConfig));
                //存在且不为空
                if (tableCache) {
                    var jsonInfo = JSON.parse(tableCache),
                        tableFieldConfig = jsonInfo[0],
                        tableSortedConfig = jsonInfo[1],
                        tableFieldInfo = [],
                        tableNewAddedCols = [];
                    //变更参数，渲染
                    for (var i in cols) {
                        tableFieldInfo.push({});
                        tableNewAddedCols.push([]);
                        for (var j in cols[i]) {
                            if (tableFieldConfig[i] && tableFieldConfig[i][cols[i][j].field]) {
                                cols[i][j].hide = tableFieldConfig[i][cols[i][j].field][0] == 1;
                                cols[i][j].width = tableFieldConfig[i][cols[i][j].field][1];
                                cols[i][j].fixed = tableFieldConfig[i][cols[i][j].field][2] || false;
                            }
                            tableFieldInfo[i][cols[i][j].field] = cols[i][j];
                            //判断是否存在新加入的列
                            if (tableSortedConfig.length > 0 && tableSortedConfig[i]) {
                                if (tableSortedConfig[i].indexOf(cols[i][j].field) == -1) {
                                    tableNewAddedCols[i].push(cols[i][j].field);
                                }
                            }
                        }
                    }

                    var sortedCols = [], isChangedSorted = false;
                    //判断重新排序
                    if (tableSortedConfig.length > 0) {
                        for (i in tableSortedConfig) {
                            sortedCols.push([]);
                            if (tableSortedConfig[i].length > 0) {
                                isChangedSorted = true;
                                for (j in tableSortedConfig[i]) {
                                    sortedCols[i].push(tableFieldInfo[i][tableSortedConfig[i][j]]);
                                }
                            }
                        }
                    }

                    //判断新加入的参数, 排列在最后
                    for (i in tableNewAddedCols) {
                        if (tableNewAddedCols[i].length > 0) {
                            for (j in tableNewAddedCols[i]) {
                                sortedCols[i].push(tableFieldInfo[i][tableNewAddedCols[i][j]]);
                            }
                        }
                    }

                    if (isChangedSorted) {
                        cols = sortedCols;
                    }
                }
            }

            return cols;
        },
        /**
         * 防抖执行SaveCols
         */
        _debounceSaveCols: layui.tools.debounce(function (tableConfig, tableDict, callback) {
            //判断是否开启缓存
            if (tableDict && tableDict.rule) {
                tableConfig.cols[tableDict.rule.selectorText.split('-')[3]][tableDict.rule.selectorText.split('-')[4]].width = tableDict.rule.style.width.replace('px', '');
            }
            var colsConfig = [], colsSorted = [],
                cols = tableConfig.cols;

            for (var i in cols) {
                i = parseInt(i);
                colsConfig.push({});
                colsSorted.push([]);
                var isChangeOrder = false;
                //只存放排序，是否隐藏，宽度
                for (var j in cols[i]) {
                    j = parseInt(j);
                    colsSorted[i].push(cols[i][j].field);
                    if (cols[i][j].hide || typeof cols[i][j].width == "string" || typeof cols[i][j].fixed != "undefined") {
                        //如果确定隐藏
                        colsConfig[i][cols[i][j].field] = [cols[i][j].hide ? 1 : 0, parseInt(cols[i][j].width), cols[i][j].fixed];
                    }
                }
            }
            layui.session.set(
                this.getTableCacheName(tableConfig),
                JSON.stringify([colsConfig, colsSorted])
            );

            callback && callback();
        }, 300),
        /**
         * 保存cols数据信息
         * @param tableConfig
         * @param tableDict
         * @param callback
         */
        saveCols(tableConfig, tableDict, callback) {
            if (tableConfig.thinkerCache) {
                this._debounceSaveCols(tableConfig, tableDict, callback);
            }
        },
        /**
         * 清空信息
         * @param tableConfig
         * @param callback
         */
        clearSaveCols(tableConfig, callback) {
            layui.session.remove(this.getTableCacheName(tableConfig))
            callback && callback();
        },
        /**
         * 拖动
         * @param tableConfig
         */
        drag: function (tableConfig) {
            if (tableConfig.cols.length > 1) {
                // 如果是复杂表头，则自动禁用拖动效果
                return;
            }
            var _this = this,
                $table = $(tableConfig.elem),
                $tableBox = $table.next().children('.layui-table-box'),
                $tableHead = $.merge($tableBox.children('.layui-table-header').children('table'), $tableBox.children('.layui-table-fixed').children('.layui-table-header').children('table')),
                $fixedBody = $tableBox.children('.layui-table-fixed').children('.layui-table-body').children('table'),
                $noFixedBody = $tableBox.children('.layui-table-body').children('table'),
                $tableBody = $.merge($tableBox.children('.layui-table-body').children('table'), $fixedBody),
                $totalTable = $table.next().children('.layui-table-total').children('table'),
                $fixedTotalTable = $table.next().children('.layui-table-total').children('table.layui-table-total-fixed'),
                $noFixedTotalTable = $table.next().children('.layui-table-total').children('table:eq(0)'),
                tableId = tableConfig.id,
                isSimple = tableConfig.thinkerDrag === true || tableConfig.thinkerDrag.simple !== false, // 是否为简易拖拽, 默认为简易拖拽
                toolbar = tableConfig.thinkerDrag.toolbar || false, // 是否开启工具栏
                //是否正在拖拽，是否以拖拽
                isDraging = false, isStart = false;

            if (!$tableHead.attr('drag')) {
                //只渲染一遍
                $tableHead.attr('drag', true);

                //渲染工具条，可以固定左右
                if (toolbar) {
                    $tableBox.append('<div class="thinker-drag-bar"><div data-type="left">左固定</div><div data-type="none">不固定</div><div data-type="right">右固定</div></div>')
                    var $dragBar = $tableBox.children('.thinker-drag-bar');
                    $dragBar.children('div').on('mouseenter', function () {
                        $(this).addClass('active')
                    }).on('mouseleave', function () {
                        $(this).removeClass('active')
                    });
                }

                //找到头部，加载cursor
                $tableHead.find('th').each(function () {
                    var $this = $(this),
                        field = $this.data('field'),
                        key = $this.data('key');
                    if (!key) {
                        return;
                    }

                    var keyArray = key.split('-'),
                        curColumn = tableConfig.cols[keyArray[1]][keyArray[2]],
                        curKey = keyArray[1] + '-' + keyArray[2],
                        isInFixed = $this.parents('.layui-table-fixed').length > 0;

                    $(this).find('span:first,.laytable-cell-checkbox')
                        .css('cursor', 'move')
                        .on('mousedown', function (e) {
                            if (e.button !== 0) {
                                return;
                            }
                            e.preventDefault();
                            var $cloneHead = $this.clone().css('visibility', 'hidden'),
                                originLeft = $this.position().left,
                                originTop = $this.offset().top,
                                disX = e.clientX - originLeft, // 鼠标距离被移动元素左侧的距离
                                color = $this.parents('tr:eq(0)').css("background-color"),
                                width = $this.width(), moveDistince = 0,
                                $that = $(this),
                                isFixed = curColumn.fixed;
                            isStart = true;
                            //区分click、drag事件

                            // 阻止文本选中
                            $(document).bind("selectstart", function () {
                                return false;
                            });

                            var dragOriginCss = {
                                'position': 'relative',
                                'z-index': 'inherit',
                                'left': 'inherit',
                                'border-left': 'inherit',
                                'width': 'inherit',
                                'background-color': 'inherit'
                            }, dragUsedCss = {
                                'position': 'absolute',
                                'background-color': color,
                                'width': width + 1
                            };
                            // 移动事件
                            $('body').on('mousemove', function (e) {
                                if (isStart && $cloneHead) {
                                    $tableBox.removeClass('no-left-border');
                                    if (!isDraging) {
                                        //开始移动就出现左中右固定条
                                        if (toolbar) {
                                            $dragBar.attr('data-type', isFixed || 'none')
                                            $dragBar.addClass('active')
                                        }

                                        $this.after($cloneHead);
                                        $this.addClass('isDrag').css(dragUsedCss);

                                        if (isSimple) {
                                            //设置蒙板
                                        } else {
                                            (isInFixed ? $fixedBody : $tableBody).find('td[data-key="' + key + '"]').each(function () {
                                                $(this).after($(this).clone().css('visibility', 'hidden').attr('data-clone', ''));
                                                $(this).addClass('isDrag').css({
                                                    'position': 'absolute',
                                                    'background-color': $(this).css('background-color'),
                                                    'width': width + 1
                                                });
                                            })
                                            if ($totalTable.length > 0) {
                                                (isInFixed ? $fixedTotalTable : $totalTable).find('td[data-key="' + key + '"]').each(function () {
                                                    $(this).after($(this).clone().css('visibility', 'hidden').attr('data-clone', ''));
                                                    $(this).addClass('isDrag').css({
                                                        'position': 'absolute',
                                                        'background-color': $(this).parents('tr:eq(0)').css('background-color'),
                                                        'width': width + 1
                                                    });
                                                })
                                            }
                                        }
                                    }
                                    isDraging = true;
                                    var x, y, i, j, tempCols,
                                        left = e.clientX - disX, // 计算当前被移动列左侧位置应该哪里
                                        $leftTh = $cloneHead.prev().prev(),
                                        hasLeftTh = $leftTh.length > 0,
                                        leftKey = hasLeftTh ? $leftTh.data('key').split('-') : [],
                                        $rightTh = $cloneHead.next().hasClass('layui-table-patch') ? [] : $cloneHead.next(),
                                        hasRightTh = $rightTh.length > 0,
                                        rightKey = hasRightTh ? $rightTh.data('key').split('-') : [],
                                        leftMove = hasLeftTh && ($cloneHead.position().left - left > $leftTh.width() / 2.0),
                                        rightMove = hasRightTh && (left - $cloneHead.position().left > $rightTh.width() / 2.0);

                                    //记录移动距离
                                    moveDistince = Math.abs($cloneHead.position().left - left);
                                    // 移动到左右两端、checbox/radio 固定列等停止移动
                                    if ($cloneHead.position().left - left > 0
                                        ? !hasLeftTh || !!isFixed !== !!tableConfig.cols[leftKey[1]][leftKey[2]].fixed
                                        : !hasRightTh || !!isFixed !== !!tableConfig.cols[rightKey[1]][rightKey[2]].fixed) {
                                        $this.css('left', $cloneHead.position().left);
                                        $tableBody.find('td[data-key="' + key + '"][data-clone]').each(function (e) {
                                            $(this).prev().css('left', $cloneHead.position().left);
                                        })
                                        if ($totalTable.length > 0) {
                                            $totalTable.find('td[data-key="' + key + '"][data-clone]').each(function (e) {
                                                $(this).prev().css('left', $cloneHead.position().left);
                                            })
                                        }
                                        $tableBox.addClass('no-left-border');
                                        return;
                                    }
                                    $this.css('left', left);

                                    var hideColumns = $('#thinker-columns' + tableId + '>li[data-value=' + field + ']');

                                    if (leftMove) {
                                        $cloneHead.after($leftTh);

                                        // 更新隐藏列顺序
                                        hideColumns.after(hideColumns.prev())

                                        // 更新配置信息
                                        for (i = 0; i < tableConfig.cols.length; i++) {
                                            for (j = 0; j < tableConfig.cols[i].length; j++) {
                                                if (tableConfig.cols[i][j].key === curKey) {
                                                    x = i;
                                                    y = j;
                                                    break;
                                                }
                                            }
                                            if (typeof x !== 'undefined' && typeof y !== 'undefined') {
                                                break;
                                            }
                                        }

                                        tempCols = tableConfig.cols[x][y - 1];
                                        tableConfig.cols[x][y - 1] = tableConfig.cols[x][y];
                                        tableConfig.cols[x][y] = tempCols;

                                        //判断是否需要记录参数
                                        if (tableConfig.thinkerCache) {
                                            thinkerTable.saveCols(tableConfig, null);
                                        }
                                    } else if (rightMove) {
                                        $cloneHead.prev().before($rightTh);

                                        // 更新隐藏列顺序
                                        hideColumns.after(hideColumns.next())

                                        // 更新配置信息
                                        for (i = 0; i < tableConfig.cols.length; i++) {
                                            for (j = 0; j < tableConfig.cols[i].length; j++) {
                                                if (tableConfig.cols[i][j].key === curKey) {
                                                    x = i;
                                                    y = j;
                                                    break;
                                                }
                                            }
                                            if (typeof x !== 'undefined' && typeof y !== 'undefined') {
                                                break;
                                            }
                                        }
                                        tempCols = tableConfig.cols[x][y + 1];
                                        tableConfig.cols[x][y + 1] = tableConfig.cols[x][y];
                                        tableConfig.cols[x][y] = tempCols;

                                        //判断是否需要记录参数
                                        if (tableConfig.thinkerCache) {
                                            thinkerTable.saveCols(tableConfig, null);
                                        }
                                    }

                                    $tableBody.find('td[data-key="' + key + '"][data-clone]').each(function () {
                                        $(this).prev().css('left', left);

                                        if (leftMove) {
                                            if ($(this).prev().prev().length !== 0) {
                                                $(this).after($(this).prev().prev());
                                            }
                                        } else if (rightMove) {
                                            if ($(this).next().length !== 0) {
                                                $(this).prev().before($(this).next());
                                            }
                                        }
                                    })
                                    if ($totalTable.length > 0) {
                                        $totalTable.find('td[data-key="' + key + '"][data-clone]').each(function () {
                                            $(this).prev().css('left', left);

                                            if (leftMove) {
                                                if ($(this).prev().prev().length !== 0) {
                                                    $(this).after($(this).prev().prev());
                                                }
                                            } else if (rightMove) {
                                                if ($(this).next().length !== 0) {
                                                    $(this).prev().before($(this).next());
                                                }
                                            }
                                        })
                                    }

                                    /* 拖动隐藏列 */
                                    var columnRemoveIcon = $('#thinker-column-remove');
                                    if (e.clientY - originTop < -15) {
                                        if (columnRemoveIcon.length === 0) {
                                            columnRemoveIcon = $('<i id="thinker-column-remove" class="layui-red layui-icon layui-icon-delete"></i>');
                                            $('body').append(columnRemoveIcon)
                                        }
                                        columnRemoveIcon.css({
                                            top: e.clientY - columnRemoveIcon.height() / 2,
                                            left: e.clientX - columnRemoveIcon.width() / 2,
                                            'font-size': (originTop - e.clientY) + 'px'
                                        });
                                        columnRemoveIcon.show();
                                    } else {
                                        columnRemoveIcon.hide();
                                    }
                                }
                            }).on('mouseup', function () {
                                $(document).unbind("selectstart");
                                $('body').off('mousemove').off('mouseup')
                                if (isStart && $cloneHead) {
                                    isStart = false;
                                    if (isDraging) {
                                        if (curColumn.type !== 'checkbox') {
                                            $that.on('click', function (e) {
                                                e.stopPropagation();
                                            });
                                        }

                                        isDraging = false;
                                        $tableBox.removeClass('no-left-border')
                                        $this.removeClass('isDrag').css(dragOriginCss);
                                        $this.next().remove();
                                        var prefKey = $this.prev().data('key');
                                        if (isFixed) {
                                            var $noFixedTh = $tableBox.children('.layui-table-header').children('table').find('th[data-key="' + key + '"]');
                                            if (prefKey) {
                                                $noFixedTh.parent().children('th[data-key="' + prefKey + '"]').after($noFixedTh)
                                            } else {
                                                if (isFixed === 'right') {
                                                    if ($this.siblings().length > 0) {
                                                        $tableBox.children('.layui-table-header').children('table').find('th[data-key="' + $this.next().data('key') + '"]').prev().after($noFixedTh);
                                                    }
                                                } else {
                                                    $noFixedTh.parent().prepend('<th class="layui-hide"></th>');
                                                    $noFixedTh.parent().children('th:first').after($noFixedTh);
                                                    $noFixedTh.parent().children('th:first').remove();
                                                }

                                            }
                                        }
                                        if (isSimple) {
                                            $tableBody.find('td[data-key="' + key + '"]').each(function () {
                                                if (prefKey) {
                                                    $(this).parent().children('td[data-key="' + prefKey + '"]').after($(this))
                                                } else {
                                                    if (isFixed === 'right') {
                                                        if ($this.siblings().length > 0) {
                                                            var $preTd = $(this).parent().children('td[data-key="' + $this.next().data('key') + '"]').prev();
                                                            if ($preTd.length > 0) {
                                                                $preTd.after($(this));
                                                            } else {
                                                                $(this).parent().prepend('<td class="layui-hide"></td>');
                                                                $(this).parent().children('td:first').after($(this));
                                                                $(this).parent().children('td:first').remove();
                                                            }
                                                        }
                                                    } else {
                                                        $(this).parent().prepend('<td class="layui-hide"></td>');
                                                        $(this).parent().children('td:first').after($(this));
                                                        $(this).parent().children('td:first').remove();
                                                    }
                                                }
                                            });
                                            if ($totalTable.length > 0) {
                                                $totalTable.find('td[data-key="' + key + '"]').each(function () {
                                                    if (prefKey) {
                                                        $(this).parent().children('td[data-key="' + prefKey + '"]').after($(this))
                                                    } else {
                                                        if (isFixed === 'right') {
                                                            var $preTd = $(this).parent().children('td[data-key="' + $this.next().data('key') + '"]').prev();
                                                            if ($preTd.length > 0) {
                                                                $preTd.after($(this));
                                                            } else {
                                                                $(this).parent().prepend('<td class="layui-hide"></td>');
                                                                $(this).parent().children('td:first').after($(this));
                                                                $(this).parent().children('td:first').remove();
                                                            }
                                                        } else {
                                                            $(this).parent().prepend('<td class="layui-hide"></td>');
                                                            $(this).parent().children('td:first').after($(this));
                                                            $(this).parent().children('td:first').remove();
                                                        }
                                                    }
                                                });
                                            }
                                        } else if (isInFixed) {
                                            $noFixedBody.find('td[data-key="' + key + '"]').each(function () {
                                                if (prefKey) {
                                                    $(this).parent().children('td[data-key="' + prefKey + '"]').after($(this))
                                                } else {
                                                    if (isFixed === 'right') {
                                                        if ($this.siblings().length > 0) {
                                                            var $preTd = $(this).parent().children('td[data-key="' + $this.next().data('key') + '"]').prev();
                                                            if ($preTd.length > 0) {
                                                                $preTd.after($(this));
                                                            } else {
                                                                $(this).parent().prepend('<td class="layui-hide"></td>');
                                                                $(this).parent().children('td:first').after($(this));
                                                                $(this).parent().children('td:first').remove();
                                                            }
                                                        }
                                                    } else {
                                                        $(this).parent().prepend('<td class="layui-hide"></td>');
                                                        $(this).parent().children('td:first').after($(this));
                                                        $(this).parent().children('td:first').remove();
                                                    }
                                                }
                                            });
                                            $fixedBody.find('td[data-key="' + key + '"][data-clone]').each(function () {
                                                $(this).prev().removeClass('isDrag').css(dragOriginCss);
                                                $(this).remove();
                                            });
                                            if ($totalTable.length > 0) {
                                                $noFixedTotalTable.find('td[data-key="' + key + '"]').each(function () {
                                                    if (prefKey) {
                                                        $(this).parent().children('td[data-key="' + prefKey + '"]').after($(this))
                                                    } else {
                                                        if (isFixed === 'right') {
                                                            var $preTd = $(this).parent().children('td[data-key="' + $this.next().data('key') + '"]').prev();
                                                            if ($preTd.length > 0) {
                                                                $preTd.after($(this));
                                                            } else {
                                                                $(this).parent().prepend('<td class="layui-hide"></td>');
                                                                $(this).parent().children('td:first').after($(this));
                                                                $(this).parent().children('td:first').remove();
                                                            }
                                                        } else {
                                                            $(this).parent().prepend('<td class="layui-hide"></td>');
                                                            $(this).parent().children('td:first').after($(this));
                                                            $(this).parent().children('td:first').remove();
                                                        }
                                                    }
                                                });
                                                $fixedTotalTable.find('td[data-key="' + key + '"][data-clone]').each(function () {
                                                    $(this).prev().removeClass('isDrag').css(dragOriginCss);
                                                    $(this).remove();
                                                });
                                            }
                                        } else {
                                            $tableBody.find('td[data-key="' + key + '"][data-clone]').each(function () {
                                                $(this).prev().removeClass('isDrag').css(dragOriginCss);
                                                $(this).remove();
                                            });
                                            if ($totalTable.length > 0) {
                                                $totalTable.find('td[data-key="' + key + '"][data-clone]').each(function () {
                                                    $(this).prev().removeClass('isDrag').css(dragOriginCss);
                                                    $(this).remove();
                                                });
                                            }
                                        }

                                        $cloneHead = null;

                                        // 处理 toolbar 事件
                                        if (toolbar) {
                                            if ($dragBar.children('.active').length > 0 && $dragBar.children('.active').attr('data-type') !== $dragBar.attr('data-type')) {
                                                var targetFix = $dragBar.children('.active').attr('data-type'),
                                                    i, j, curPos, targetPos;
                                                for (i = 0; i < tableConfig.cols.length; i++) {
                                                    for (j = 0; j < tableConfig.cols[i].length; j++) {
                                                        if (targetFix === 'right' || (targetFix === 'none' && $dragBar.attr('data-type') === 'right')) {
                                                            if (typeof targetPos === 'undefined') {
                                                                if (tableConfig.cols[i][j].fixed === 'right') {
                                                                    targetPos = {x: i, y: j};
                                                                } else if (j === tableConfig.cols[i].length - 1) {
                                                                    targetPos = {x: i, y: j + 1};
                                                                }
                                                            }
                                                        } else {
                                                            if (typeof targetPos === 'undefined' && (!tableConfig.cols[i][j].fixed || tableConfig.cols[i][j].fixed === 'right')) {
                                                                targetPos = {x: i, y: j};
                                                            }
                                                        }
                                                        if (tableConfig.cols[i][j].key === curKey) {
                                                            curPos = {x: i, y: j};
                                                        }
                                                    }
                                                }
                                                curColumn['fixed'] = targetFix === 'none' ? false : targetFix;

                                                if (curPos.y !== targetPos.y) {
                                                    tableConfig.cols[curPos.x].splice(curPos.y, 1);

                                                    if (curPos.y < targetPos.y) {
                                                        targetPos.y -= 1
                                                    }

                                                    tableConfig.cols[targetPos.x].splice(targetPos.y, 0, curColumn)
                                                }

                                                if (tableConfig.thinkerCache) {
                                                    thinkerTable.saveCols(tableConfig, null, function () {
                                                        table.reload(tableId)
                                                    });
                                                }
                                            }
                                            $dragBar.removeClass('active')
                                        }

                                    } else {
                                        $that.unbind('click');
                                    }

                                    var columnRemoveIcon = $('#thinker-column-remove');

                                    if (columnRemoveIcon.is(':visible')) {
                                        $tableHead.find('thead>tr>th[data-key=' + key + ']').addClass(HIDE);
                                        $tableBody.find('tbody>tr>td[data-key="' + key + '"]').addClass(HIDE);
                                        $totalTable.find('tbody>tr>td[data-key="' + key + '"]').addClass(HIDE);
                                        // 同步配置
                                        curColumn['hide'] = true
                                        if (tableConfig.thinkerCache) {
                                            thinkerTable.saveCols(tableConfig, null);
                                        }
                                        // 更新下拉隐藏
                                        $('#thinker-columns' + tableId).find('li[data-value="' + field + '"]>input').prop('checked', false);
                                    }

                                    columnRemoveIcon.hide();
                                }
                            })
                        });
                });
            }
        },
        /**
         * 输入框事件
         */
        _tableInput: {},
        getTableInput(tableConfig, field) {
            if (!this._tableInput[this.getTableCacheName(tableConfig)]) {
                this._tableInput[this.getTableCacheName(tableConfig)] = {};
            }

            if (!this._tableInput[this.getTableCacheName(tableConfig)][field]) {
                this._tableInput[this.getTableCacheName(tableConfig)][field] = $('<div class="layui-input layui-table-edit" style="cursor: pointer;"></div>');
            }

            return this._tableInput[this.getTableCacheName(tableConfig)][field];
        },
        /**
         * 渲染类别
         */
        renderTypes: {
            datetime: function (tableIns, tdThis) {
                var input = thinkerTable.getTableInput(tableIns.config, tdThis.data("field"));
                //没渲染过事件
                if (!input[0].dataset.rendered) {
                    //渲染完成
                    input[0].dataset.rendered = 1;
                    var renderConfig = {};
                    if (tableIns.config.thinkerEdit && tableIns.config.thinkerEdit[tdThis.data("field")]) {
                        renderConfig = tableIns.config.thinkerEdit[tdThis.data("field")];
                        if (renderConfig.done) {
                            renderConfig._done = renderConfig.done;
                            delete renderConfig.done;
                        }
                    }
                    //laydate参数
                    layui.laydate.render($.extend({
                        elem: input[0],
                        trigger: 'click',
                        done: function (value, date, endDate) {
                            var elem = $(this.elem[0]);
                            elem.val(value).trigger("change").trigger("blur");
                            this._done && this._done(value, date, endDate);
                        },
                        closed: function () {
                            $(this.elem[0]).trigger("blur")
                        }
                    }, renderConfig));
                }

                //只要不存在，都当text处理
                var elemCell = tdThis.children(ELEM_CELL);
                input[0].innerText = tdThis.data('content') || elemCell.text();
                tdThis.find('.' + ELEM_EDIT)[0] || tdThis.append(input);
                tdThis.find("." + ELEM_EDIT).css("line-height", tdThis.parent().height() + "px").click();
            },
            /**
             * 渲染选择
             * @param tableIns
             * @param tdThis
             */
            select: function (tableIns, tdThis) {
                var input = thinkerTable.getTableInput(tableIns.config, tdThis.data("field"));

                //只要不存在，都当text处理
                var elemCell = tdThis.children(ELEM_CELL);
                input[0].innerText = tdThis.data('content') || elemCell.text();
                tdThis.find('.' + ELEM_EDIT)[0] || tdThis.append(input);
                tdThis.find("." + ELEM_EDIT).css("line-height", tdThis.parent().height() + "px").click();

                //没渲染过事件
                if (!input[0].dataset.rendered) {
                    input[0].dataset.rendered = 1;
                    //监听事件
                    input[0].addEventListener("click", function (e) {
                        var $celledit = $(e.target),
                            offset = $celledit.parent().offset(),
                            height = $celledit.height(),
                            value = e.target.innerText.trim();

                        //找到渲染参数
                        var renderConfig = {
                            tpl: '<dd data-value="{{v.value}}" class="{{v.selected?\'layui-this\':\'\'}}">{{v.text}}</dd>'
                        };
                        if (tableIns.config.thinkerEdit && tableIns.config.thinkerEdit[tdThis.data("field")]) {
                            renderConfig = $.extend(renderConfig, tableIns.config.thinkerEdit[tdThis.data("field")]);
                        }

                        var content = layui.laytpl(
                            "<div class='layui-form-select layui-form-selected'>" +
                            "<dl class=\"layui-anim layui-anim-upbit\" style=\"height: 100%\">" +
                            "<dd data-value='' class=\"layui-select-tips " + (value == "" ? "layui-this" : '') + "\">请选择</dd>" +
                            "{{# layui.each(d.items, function(n,v){" +
                            "if(v.value==d.value){v.selected=true;}else{v.selected=false;} }}" +
                            renderConfig.tpl +
                            "{{# }); }}" +
                            "</dl>" +
                            "</div>"
                        ).render({
                            value: value,
                            items: renderConfig.items || []
                        });

                        layer.open({
                            elem: input[0],
                            type: 1,
                            closeBtn: 0,
                            area: ["200px", "200px"],
                            title: false,
                            offset: [offset.top + height + 5, offset.left],
                            content: content,
                            shade: [0.15, '#000'],
                            shadeClose: true,
                            anim: 5,
                            scrollbar: false,
                            skin: "layui-no-scrollbar",
                            success: function (layero, index) {
                                layero.on("click", "dd", function () {
                                    $(input[0]).val($(this).data("value")).trigger("change").trigger("blur");
                                    layui.layer.close(index);
                                })
                            },
                            end: function () {
                                $(input[0]).trigger("blur");
                            }
                        });
                    });
                    $(input[0]).click();
                }
            }
        },
        /**
         * 数据完成之后的渲染
         * @param tableIns
         * @param tdThis
         * @param commonMember
         * @returns {boolean}
         */
        render(tableIns, tdThis, commonMember) {
            if (this.renderTypes[tdThis.data('edit')]) {
                this.renderTypes[tdThis.data('edit')].call(
                    this, tableIns, tdThis, commonMember
                );
                return true;
            }
        },
        /**
         * 导出excel
         * @param tableConfig
         */
        exportXlsx: function (tableConfig) {
            var loading = layer.msg('文件下载中', {
                icon: 16
                , time: -1
                , anim: -1
                , fixed: false
            });

            var cols = layui.tools.deepClone(tableConfig.cols),
                style = tableConfig.elem.next().find('style')[0],
                sheet = style.sheet || style.styleSheet || {},
                rules = sheet.cssRules || sheet.rules;

            layui.each(rules, function (i, item) {
                if (item.style.width) {
                    var keys = item.selectorText.split('-');
                    cols[keys[3]][keys[4]]['width'] = parseInt(item.style.width)
                }
            });

            var data = JSON.parse(JSON.stringify(tableConfig.data || layui.tableplus.cache[tableConfig.id])),
                showField = [],
                tableHeader = {},
                widths = [],
                filename = (tableConfig.title || tableConfig.id) + ".xlsx";

            layui.each(cols, function(index, cols1){
                layui.each(cols1, function(index1, cols2) {
                    if(!cols2.hide) {
                        tableHeader[cols2.field] = cols2.title;
                        showField.push(cols2.field);
                        widths.push(parseInt(cols2.width));
                    }
                });
            });

            excel.exportExcel({
                sheet1: [tableHeader].concat(excel.filterExportData(data, showField))
            }, filename, "xlsx", {
                extend: {
                    '!cols': excel.makeColConfig(widths, 80)
                }
            });

            layer.close(loading);
        }
    };

    exports(MOD_NAME, thinkerTable);
});