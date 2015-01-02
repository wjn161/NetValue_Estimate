define("viewEngine", function () {
    var viewEngine = function () {
        this.update = function (table, data) {
            if (data) {
                var td;
                if (data.value && data.percent) {
                    if (Number(data.percent.replace("%", "")) > 0) {
                        td = "<td data-key='" + data.key + "'><span style='color: red'>" + data.value + "(" + data.percent + ")</span></td>";
                    } else if (Number(data.percent.replace("%", "")) < 0) {
                        td = "<td data-key='" + data.key + "'><span style='color: green'>" + data.value + "(" + data.percent + ")</span></td>";
                    } else {
                        td = "<td data-key='" + data.key + "'><span>" + data.value + "(" + data.percent + ")</span></td>";
                    }
                } else {
                    td = "<td data-key='" + data.key + "'><span>--</span></td>";
                }

                var oldtd = $(table).find("tbody tr[fundcode='" + data.fundCode + "']").find("td[data-key='" + data.key + "']");
                oldtd.replaceWith(td);
            }
        };
        this.updateAll = function () {

        };
        this.buildAll = function () {

        }
    };
    return new viewEngine();
});
define("datasource", function (require) {
    var ve = require("viewEngine");
    var format = function () {
            if (arguments.length == 0)
                return null;
            var str = arguments[0];
            for (var i = 1; i < arguments.length; i++) {
                var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
                str = str.replace(re, arguments[i]);
            }
            return str;
        }, keys = ["fund123", "eastmoney", "ifund", "sina"],
        netValueUrls = {
            eastmoney: "",
            fund123: "",
            ifund: "",
            sina: ""
        }
        , estimateUrls = {
            eastmoney: "http://fund.eastmoney.com/data/funddataforgznew.aspx?t=basewap&fc={0}&cb=?",
            fund123: "http://hqqd.fund123.cn/HQ_EV_{0}.js",
            ifund: "",
            sina: "http://hq.sinajs.cn/?t=" + new Date().getTime() + "&list=fu_{0}"
        };
    var datasource = function () {

        this.estimateParser = {
            eastmoney: function (fundcode, fundname, update) {
                var url = format(estimateUrls["eastmoney"], fundcode);
                $.ajax({
                    url: url,
                    dataType: "jsonp",
                    type: "GET",
                    cache: false,
                    success: function (e) {
                        if (e) {
                            var estimate = {};
                            estimate.key = "eastmoney";
                            estimate.fundCode = fundcode;
                            estimate.fundName = fundname;
                            estimate.value = e.gsz;
                            estimate.percent = e.gszzl + "%";
                            estimate.time = e.gztime;
                            update($("#table-estimate"), estimate);
                        }
                    }
                });
            },
            fund123: function (fundcode, fundname, update) {
                var url = format(estimateUrls["fund123"], fundcode);
                $.ajax({
                    url: url,
                    dataType: "script",
                    type: "GET",
                    cache: false,
                    success: function () {
                        var data = window["HQ_EV_" + fundcode];
                        if (data.length) {
                            var estimate = {};
                            estimate.key = "fund123";
                            estimate.fundCode = fundcode;
                            estimate.fundName = fundname;
                            estimate.value = data[5];
                            estimate.percent = data[6];
                            estimate.time = data[2];
                            update($("#table-estimate"), estimate);
                        }
                    }

                });
            },
            ifund: function () {

            },
            sina: function (fundcode, fundname, update) {
                var url = format(estimateUrls["sina"], fundcode);
                $.ajax({
                    url: url,
                    dataType: "script",
                    type: "GET",
                    cache: true,
                    success: function () {
                        var str = window["hq_str_fu_" + fundcode];
                        var data = str.split(",");
                        if (data.length) {
                            var estimate = {};
                            estimate.key = "sina";
                            estimate.fundCode = fundcode;
                            estimate.fundName = fundname;
                            estimate.value = data[2];
                            estimate.percent = Number(data[6]).toFixed(2) + "%";
                            estimate.time = data[7] + " " + data[1];
                            update($("#table-estimate"), estimate);
                        }
                    }
                });
            }
        };
        this.netValueParser = {
            eastmoney: function () {

            },
            fund123: function () {

            },
            ifund: function () {

            },
            sina: function () {

            }
        };
        this.getNetValue = function (fundcode, fundname) {

        };
        this.getEstimateList=function(array){
            var data=[];
           $(window.fundArray).each(function(k,v){
               if($.inArray(v[1],array)>-1){
                   var obj={
                   };
                   obj.code=v[1];
                   obj.name=v[0];
                   data.push(obj);
               }
           });
            var that=this;
            if(data.length){
                $(data).each(function(k,v){
                    that.getEstimate(v.code, v.name);
                });
            }
        };
        this.getEstimate = function (fundcode, fundname) {
            $("#table-estimate tbody .emptyrow").remove();
            if( $("#table-estimate tbody tr").length==20){
                $("#table-estimate tbody tr:last").remove();
            }
            var tds = [];
            tds.push("<td>" + fundname + "(" + fundcode + ")</td>"); //基金
            for (var j = 0; j < keys.length; j++) {
                tds.push("<td data-key='" + keys[j] + "'>--</td>");
            }
            tds.push("<td><span><a href='javascript;'>删除</a></span></td>");
            var tr = "<tr fundcode='" + fundcode + "'>" + tds.join("") + "</tr>";
            $(tr).prependTo("#table-estimate tbody");
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var parser = this.estimateParser[key];
                if (parser) {
                    parser(fundcode, fundname, ve.update);
                }
            }
        };
    };
    return new datasource();
});

define("localdata", function () {
    var maxLenth = 20; //只能添加20个
    var localdata = function () {
        var cookieKey = "estimateCode";
        this.exist = function (fundcode) {
            var cookie = $.cookie(cookieKey);
            if (!cookie) return false;
            return cookie.indexOf(fundcode) > -1;
        };
        this.set = function (fundcode) {
            var cookie = $.cookie(cookieKey);
            if (!cookie) {
                $.cookie(cookieKey, fundcode);
            } else {
                var codes = cookie.split(",");
                if ($.inArray(fundcode, codes) > -1) {
                    return false;
                }
                if (codes.length == maxLenth) {
                    codes.pop();
                }
                codes.unshift(fundcode);
                $.cookie(cookieKey, codes.join(","));
            }
        };
        this.getAll = function () {
            var cookie = $.cookie(cookieKey);
            if (!cookie) return null;
            return cookie.split(",");
        }
    };
    return new localdata();
});
define("main", function (require) {
    require('cookie/1.0.0/cookie');
    require('fundpicker/1.0.0/fundpicker');
    var dialog = require('dialog/6.0.4/dialog');

    function Index() {

    }

    Index.prototype = {
        constructor: Index,
        loadTable: function () {
            var local = require("localdata");
            var ds = require("datasource");
            var codes = local.getAll();
            ds.getEstimateList(codes);
        },
        updateTable: function (fundcode, fundname) {
            var local = require("localdata");
            if (local.exist(fundcode)) {
                dialog.alert("基金:" + fundcode + "已经存在!", "warn", null, function () {
                });
                return false;
            }
            local.set(fundcode);
            //var $tbNetValue = $("#table-netvalue");

            var ds = require("datasource");
            if (fundcode && fundname) {
                // var netvalue = ds.getNetValue(fundcode, fundname);
                ds.getEstimate(fundcode, fundname);
                //ve.update(netvalue, $tbNetValue);
            } else {
                ve.updateAll();
            }
        },
        controlPanel: function () {
            var $fund = $('#txtFundCode');
            var that = this;
            $fund.fundpicker(window.fundArray, {
                duration: 0, //下拉列表是动画0直接显示没有动画
                divId: "container-fundpicker",
                divHeight: "300px",//容器div的高度
                //下拉列表属性
                tableId: "container-table",    //列表的ID
                tableClass: "fundDataSelector_table",   //列表的样式
                tableMouseover: "current-row",  //列表中鼠标经过的样式
                tableHeader: "代码|名称",//列表中的标题
                tableHeaderIndex: "1|0",//标题对应列的位置，对应数组中的位置
                tableWidth: "30%|70%",//列表中列的宽度
                tableIndex: "1|0|2",//搜索哪几列，对应数组中的位置如 "代码|名称|拼音|别名"
                tableFundIndex: "1|0",//搜索返回显示的 fundcode|fundname 在数组中的位置 （这个两个不能少）
                nullValue: "",//搜索框显示文字
                initFundCod: "",//传入fundcode 列:100066 没有就填空
                onSlideUp: function (code) {
                    if (code) {
                        var fundname = $.trim($fund.val());
                        $fund.attr("fundcode", code).attr("fundname", fundname);
                    }
                },
                clickBtnId: "null"
            });
            $("#btnAdd").on('click', function () {
                var code = $fund.attr("fundcode");
                var name = $fund.attr("fundname");
                if (code && name) {
                    that.updateTable(code, name);
                    $fund.removeAttr("fundcode");
                    $fund.removeAttr("fundname");
                    $fund.val("");
                }
                else {
                    dialog.alert("请先选择一只基金!", "warn", null, function () {
                        $fund.focus();
                    });
                }
            });
            $("#btnRefresh").on("click", function () {
                window.location.reload(true);
            });
        },
        init: function () {
            this.controlPanel();
            this.loadTable();
           setInterval(function () {
               window.location.reload(true);
            }, 30* 1000);
        }
    };
    return new Index();
});