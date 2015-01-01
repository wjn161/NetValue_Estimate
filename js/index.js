define("datasource", function () {
    function format() {
        if (arguments.length == 0)
            return null;
        var str = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
            str = str.replace(re, arguments[i]);
        }
        return str;
    }

    var estimateModel = function () {
        this.fundCode = "";
        this.fundName = "";
        this.estimateTime = "";
        this.estimateValue = "";
        this.estimatePercent = "";
    };
    var datasource = function () {
        this.keys=["eastmoney","fund123","hexun","ifund","sina"];
        this.netValueUrls = {
            eastmoney: "",
            fund123: "",
            hexun: "",
            ifund: "",
            sina: ""
        };
        this.estimateUrls = {
            eastmoney: "",
            fund123: "http://hqqd.fund123.cn/HQ_EV_{0}.js",
            hexun: "",
            ifund: "",
            sina: ""
        };
        this.estimateParser = {
            eastmoney: function () {

            },
            fund123: function (fundcode) {
                var url = format(estimateUrls["fund123"], fundcode);
                $.getScript(url, function () {
                    var data = window["HQ_EV_" + fundcode];
                    if (data.length) {
                        var model = new estimateModel();
                        model.fundCode = data[0];
                        model.fundName = data[1];
                        model.estimateTime = data[2];
                        model.estimateValue = data[5];
                        model.estimatePercent = data[6];
                        return model;
                    }
                    return null;
                });
            },
            hexun: function () {

            },
            ifund: function () {

            },
            sina: function () {

            }
        };
        this.netValueParser = {
            eastmoney: function () {

            },
            fund123: function () {

            },
            hexun: function () {

            },
            ifund: function () {

            },
            sina: function () {

            }
        };
        this.getNetValue = function (fundcode, fundname) {

        };
        this.getEstimate = function (fundcode, fundname) {

            var results=[];

        };
    };
    return new datasource();
});
define("viewEngine", function () {
    var loading = "";
    var viewEngine = function () {

        this.update = function (data, table) {

        };
        this.updateAll = function () {

        };
    };
    return new viewEngine();
});
define("main", function (require) {
    require('cookie/1.0.0/cookie');
    require('fundpicker/1.0.0/fundpicker');
    var dialog = require('dialog/6.0.4/dialog');

    function Index() {

    }

    Index.prototype = {
        constructor: Index,
        updateTable: function (fundcode, fundname) {
            var $tbNetValue = $("#table-netvalue");
            var $tbEstimate = $("#table-estimate");
            var ve = require("viewEngine");
            var ds = require("datasource");
            if (fundcode && fundname) {
                var netvalue = ds.getNetValue(fundcode, fundname);
                var estimate = ds.getEstimate(fundcode, fundname);
                ve.update(netvalue, $tbNetValue);
                ve.update(estimate, $tbEstimate);
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
                        that.updateTable(code, fundname);
                    }
                },
                clickBtnId: "null"
            });
            $("#btnAdd").on('click', function () {
                var code = $fund.attr("fundcode");
                var name = $fund.attr("fundname");
                if (code && name) {
                    that.updateTable(code, name);
                }
                else {
                    dialog.alert("请先选择一只基金!", "warn", null, function () {
                        $fund.focus();
                    });
                }
            });
            $("#btnRefresh").on("click", function () {
                that.updateTable();
            });
        },
        init: function () {
            this.controlPanel();
            var that = this;
            setInterval(function () {
                that.updateTable();
            }, 30 * 1000);
        }
    };
    return new Index();
});