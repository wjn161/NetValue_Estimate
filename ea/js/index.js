define("utils", function () {
    var Utils = function () {
        this.format = function () {
            if (arguments.length == 0)
                return null;
            var str = arguments[0];
            for (var i = 1; i < arguments.length; i++) {
                var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
                str = str.replace(re, arguments[i]);
            }
            return str;
        };
        this.keys = ["fund123", "eastmoney", "ifund", "sina"];
    };
    return new Utils();
});

define("dataAccess", function (require) {
    var view = require("view");
    var utils = require("utils");
    var maxLenth = 20; //只能添加20个
    var DataAccess = function () {
        var cookieConfig = {
            domain: ".fund123.cn",
            expires: 30,
            path: "/"
        };
        var cookieKey = "estimateCode";
        var tokenCookie = "estimate_token";
        this.exist = function (fundcode) {
            var cookie = $.cookie(cookieKey);
            if (!cookie) return false;
            return cookie.indexOf(fundcode) > -1;
        };
        this.set = function (fundcode) {
            var cookie = $.cookie(cookieKey);
            if (!cookie) {
                $.cookie(cookieKey, fundcode, cookieConfig);
            } else {
                var codes = cookie.split(",");
                if ($.inArray(fundcode, codes) > -1) {
                    return false;
                }
                if (codes.length == maxLenth) {
                    codes.pop();
                }
                codes.unshift(fundcode);
                $.cookie(cookieKey, codes.join(","), cookieConfig);
            }
        };
        this.clearAll = function () {
            $.cookie(cookieKey, "", cookieConfig);
        };
        this.getAll = function () {
            var cookie = $.cookie(cookieKey);
            if (!cookie) return null;
            return cookie.split(",");
        };
        this.removeToken = function () {
            $.cookie(tokenCookie, "", cookieConfig);
        };
        this.saveToken = function (name, token, secret) {
            $.cookie(tokenCookie, name + "|" + token + "|" + secret, cookieConfig);
        };

        this.getToken = function () {
            var cookie = $.cookie(tokenCookie);
            if (cookie) return cookie.split("|");
            return [];
        };
        this.loadfundsFromShumi = function (callback) {
            var url = "http://webapi.fund123.cn/fundfavorite.getfundfavorites?callback=?&t=" + new Date().getTime();
            $.getJSON(url, function (res) {
                if (res && res.length) {
                    var local = $.cookie(cookieKey);
                    var codes = [];
                    if (local) {
                        codes = local.split(",");
                    }
                    $(res).each(function (index, item) {
                        if ($.inArray(item.Code, codes) < 0) {
                            if (codes.length < 20) {
                                codes.unshift(item.Code);
                            } else {
                                codes.unshift(item.Code);
                                codes.pop();
                            }
                        }
                    });
                    view.clearAll();
                    callback(codes);
                    $.cookie(cookieKey, codes.join(","), cookieConfig);
                }
            });
        };
    };
    return new DataAccess();
});

define("view", function (require) {
    var utils = require("utils");
    var View = function () {
        this.createRow = function (fundcode, fundname, isAddToTail) {
            var $table = $("#table-estimate");
            $table.find("tbody .emptyrow").remove();
            if ($table.find("tbody tr").length == 20) {
                $table.find("tbody tr:last").remove();
            }
            var tds = [];
            tds.push("<td>" + fundname + "(" + fundcode + ")</td>"); //基金
            for (var j = 0; j < utils.keys.length; j++) {
                tds.push("<td data-key='" + utils.keys[j] + "'>--</td>");
            }
            var tr = "<tr fundcode='" + fundcode + "'>" + tds.join("") + "</tr>";
            if (isAddToTail) {
                $(tr).appendTo("#table-estimate tbody");
            } else {
                $(tr).prependTo("#table-estimate tbody");
            }
        };
        this.createAssets = function (fundcode, fundname, marketvalue, isAddToTail) {
            var $table = $("#table-assets");
            $table.find("tbody .emptyrow").remove();
            if ($table.find("tbody tr").length == 20) {
                $table.find("tbody tr:last").remove();
            }
            var tds = [];
            tds.push("<td>" + fundname + "(" + fundcode + ")</td>"); //基金
            tds.push("<td>" + marketvalue + "</td>"); //基金
            for (var j = 0; j < utils.keys.length; j++) {
                tds.push("<td data-key='" + utils.keys[j] + "'>--</td>");
            }
            var tr = "<tr fundcode='" + fundcode + "'>" + tds.join("") + "</tr>";
            if (isAddToTail) {
                $(tr).appendTo("#table-assets tbody");
            } else {
                $(tr).prependTo("#table-assets tbody");
            }
        };

        this.updateAssetsCell = function (data) {
            function getMarketValue() {
                var strMarket = $("#table-assets").find("tbody tr[fundcode='" + data.fundCode + "']").find("td:eq(1)").text();
                var marketValue = 0.0;
                if (strMarket) {
                    marketValue = Number(strMarket);
                }
                if (!data.percent) {
                    return "--";
                }
                var per = Number(data.percent.replace('%', "")) / 100;
                return [marketValue,(marketValue * per).toFixed(2),(marketValue*(1+per)).toFixed(2)];
            }
            if (data) {
                var td;
                if (data.value && data.percent) {
                    if (Number(data.percent.replace("%", "")) > 0) {
                        td = "<td data-key='" + data.key + "'><span style='color: red'>" + getMarketValue(data.percent)[1] + "</span></td>";
                    } else if (Number(data.percent.replace("%", "")) < 0) {
                        td = "<td data-key='" + data.key + "'><span style='color: green'>" + getMarketValue(data.percent)[1] + "</span></td>";
                    } else {
                        td = "<td data-key='" + data.key + "'><span>" + getMarketValue(data.percent)[1] + "</span></td>";
                    }
                } else {
                    td = "<td data-key='" + data.key + "'><span>--</span></td>";
                }
                var oldtd = $("#table-assets").find("tbody tr[fundcode='" + data.fundCode + "']").find("td[data-key='" + data.key + "']");
                oldtd.replaceWith(td);
            }
        };
        this.clearAll = function () {
            var $table = $("#table-estimate");
            $table.find("tbody").html("<tr><td class='emptyrow' colspan='6' class='align-left'>您还没有添加基金!</td></tr>");
        };
        this.updateCell = function (data) {
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
                var oldtd = $("#table-estimate").find("tbody tr[fundcode='" + data.fundCode + "']").find("td[data-key='" + data.key + "']");
                oldtd.replaceWith(td);
            }
        };
    };
    return new View();
});

define("controller", function (require) {
    var view = require("view"),
        utils = require("utils"),
        db = require("dataAccess"),
        authUrl = "http://192.168.123.89:5000/api/call_method?server=https%3A%2F%2Ftrade.fund123.cn%2Fopenapi&method=trade_account.authorize&params={0}&callback=?",
        assetsUrl = "http://192.168.123.89:5000/api/call_method?server=https%3A%2F%2Ftrade.fund123.cn%2Fopenapi&method=trade_foundation.getrealfundgather&params=%7B%7D&oauth_token={0}&oauth_token_secret={1}&callback=?",
        estimateUrls = {
            eastmoney: "http://fund.eastmoney.com/data/funddataforgznew.aspx?t=basewap&fc={0}&cb=?",
            fund123: "http://hqqd.fund123.cn/HQ_EV_{0}.js",
            ifund: "http://gz.fund.10jqka.com.cn/?module=api&controller=index&action=real&datatype=jsonp&codes={0}&callback=?",
            sina: "http://hq.sinajs.cn/?t=" + new Date().getTime() + "&list=fu_{0}"
        };
    var Controller = function () {
        var request = function (key, datatype, fundcode, cached, callback) {
            var url = utils.format(estimateUrls[key], fundcode);
            $.ajax({
                url: url,
                dataType: datatype,
                type: "GET",
                cache: cached
            }).done(callback);
        };

        this.estimateParser = {
            eastmoney: function (fundcode, fundname, update) {
                request("eastmoney", "jsonp", fundcode, false, function (res) {
                    if (res) {
                        var estimate = {};
                        estimate.key = "eastmoney";
                        estimate.fundCode = fundcode;
                        estimate.fundName = fundname;
                        estimate.value = res.gsz;
                        estimate.percent = res.gszzl + "%";
                        estimate.time = res.gztime;
                        update(estimate);
                    }
                });
            },
            fund123: function (fundcode, fundname, update) {
                request("fund123", "script", fundcode, false, function () {
                    var data = window["HQ_EV_" + fundcode];
                    if (data.length) {
                        var estimate = {};
                        estimate.key = "fund123";
                        estimate.fundCode = fundcode;
                        estimate.fundName = fundname;
                        estimate.value = data[5];
                        estimate.percent = data[6];
                        estimate.time = data[2];
                        update(estimate);
                    }
                });
            },
            ifund: function (fundcode, fundname, update) {
                request("ifund", "jsonp", fundcode, false, function (res) {
                    if (res && res.data) {
                        var estimate = {};
                        var obj = res.data[fundcode];
                        if (obj) {
                            estimate.key = "ifund";
                            estimate.fundCode = fundcode;
                            estimate.fundName = fundname;
                            estimate.value = Number(obj.value).toFixed(4);
                            estimate.percent = (((Number(obj.value) - Number(obj.pre)) / Number(obj.pre)) * 100).toFixed(2) + "%";
                            update(estimate);
                        }
                    }
                });
            },
            sina: function (fundcode, fundname, update) {
                request("sina", "script", fundcode, true, function () {
                    var str = window["hq_str_fu_" + fundcode];
                    if (str) {
                        var data = str.split(",");
                        if (data.length) {
                            var estimate = {};
                            estimate.key = "sina";
                            estimate.fundCode = fundcode;
                            estimate.fundName = fundname;
                            estimate.value = data[2];
                            estimate.percent = Number(data[6]).toFixed(2) + "%";
                            estimate.time = data[7] + " " + data[1];
                            update(estimate);
                        }
                    }
                });
            }
        };
        this.getEstimateTime = function (id) {
            request("eastmoney", "jsonp", "000001", false, function (res) {
                $(id).text(res.gztime);
            });
        };
        this.clearAll = function () {
            view.clearAll();
        };
        this.loadAssets = function (token, secret, callback) {
            $.getJSON(utils.format(assetsUrl, token, secret), function (res) {
                if (res) {
                    var list = JSON.parse(res);
                    callback(list);
                }
            });
        };
        this.login = function (user, pwd, callback) {
            var that = this;
            if (!user || !pwd) {
                return false;
            }
            var paramTmpl = '{"username":"{0}","password":"{1}","loginMode":0}';
            var param = encodeURIComponent(utils.format(paramTmpl, user, pwd));
            $.getJSON(utils.format(authUrl, param), function (res) {
                if (res) {
                    var obj = JSON.parse(res);
                    db.saveToken(obj.RealName, obj.Token, obj.TokenSecret);
                    that.loadAssets(obj.Token, obj.TokenSecret, function (data) {
                        if (data) {
                            callback(data);
                        }
                    });
                }
            });
        };
        this.getEstimateList = function (array) {
            if (!array.length) {
                return false;
            }
            var that = this;
            var data = [];
            for (var i = 0; i < array.length; i++) {
                var code = array[i];
                $(window.fundArray).each(function (index, item) {
                    if (item[1] == code) {
                        data.push({ code: code, name: item[0] });
                    }
                });
            }
            if (data.length) {
                $(data).each(function (k, v) {
                    that.getEstimate(v.code, v.name, true);
                });
            }
        };
        this.getEstimate = function (fundcode, fundname, isAddToTail) {
            view.createRow(fundcode, fundname, isAddToTail);
            for (var i = 0; i < utils.keys.length; i++) {
                var key = utils.keys[i];
                var parser = this.estimateParser[key];
                if (parser) {
                    parser(fundcode, fundname, view.updateCell);
                }
            }
        };
        this.buildAssets = function (list) {
            var that = this;
            if (list && list.length) {
                $(list).each(function (j, item) {
                    var fundname = item.FundSimpleName;
                    var fundcode = item.FundCode;
                    var marketvalue = item.TodayHoldCityValue;
                    if (item.FundType == 0) {
                        view.createAssets(fundcode, fundname, marketvalue);
                        for (var i = 0; i < utils.keys.length; i++) {
                            var key = utils.keys[i];
                            var parser = that.estimateParser[key];
                            if (parser) {
                                parser(fundcode, fundname, view.updateAssetsCell);
                            }
                        }
                    }
                });
            }
        };
    };
    return new Controller();
});

define("main", function (require) {
    require('cookie/1.0.0/cookie');
    require('fundpicker/1.0.0/fundpicker');
    var utils = require('utils');
    var dialog = require('dialog/6.0.4/dialog');
    var db = require("dataAccess");
    var controller = require("controller");

    function Index() {
    }

    Index.prototype = {
        constructor: Index,
        loadEstimateTime: function () {
            controller.getEstimateTime("#estimateTime");
        },
        loadTable: function () {
            var codes = db.getAll();

            if (!codes || !codes.length) {
                $("#table-estimate").find("tbody tr:first td").html("您还没有添加基金!");
            } else {
                controller.getEstimateList(codes);
            }
        },

        updateTable: function (fundcode, fundname) {
            if (db.exist(fundcode)) {
                dialog.alert("基金:" + fundcode + "已经存在!", "warn", null, function () {
                });
                return false;
            }
            db.set(fundcode);
            if (fundcode && fundname) {
                controller.getEstimate(fundcode, fundname);
            }
        },
        autoLoadAssets: function () {
            var token = db.getToken();
            if (token && token.length) {
                var button = '<div class="form-group"><span><strong>{0}</strong>，您好，您已经成功登录。</span></div><button type="button"  id="btnLogout" class="btn btn-danger" style="margin-left:20px;">退出登录</button>';
                $("#assetsForm").html(utils.format(button, token[0]));
                controller.loadAssets(token[1], token[2], function (data) {
                    if (data) {
                        controller.buildAssets(data);
                        var codes = $.map(data,function(item) {
                            return item.FundType==0&&item.FundCode;
                        });
                        controller.getEstimateList(codes);
                    }
                });
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
            $("#txtPassword").on("keyup", function (e) {
                if (e.keyCode && e.keyCode == 13) {
                    $("#btnLoadAssets").trigger("click");
                    return false;
                }
            });
            $("#btnDeleteAll").on("click", function () {
                dialog.confirm("本地数据将被删除，确定执行吗?", function () {
                    controller.clearAll();
                    db.clearAll();
                }, function () {
                    return true;
                });
            });
            $("#btnLogout").on('click', function () {
                db.removeToken();
                db.clearAll();
                controller.clearAll();
                location.reload(true);
            });
            $("#btnLoadAssets").on('click', function () {
                var username = $.trim($("#txtUserName").val());
                var password = $.trim($("#txtPassword").val());
                if (!username) {
                    dialog.alert("请先输入用户名!", "warn", null, function () {
                        $("#txtUserName").focus();
                    });
                    return false;
                }
                if (!password) {
                    dialog.alert("请先输入密码!", "warn", null, function () {
                        $("#txtPassword").focus();
                    });
                    return false;
                }
                var logining = dialog({
                    width: 300,
                    height: 50,
                    content: "正在努力登录中..."
                });
                logining.showModal();
                controller.login(username, password, function (data) {
                    if (data) {
                        that.autoLoadAssets();
                        logining.close().remove();
                    }
                });
            });

            $("#btnLoadFromShumi").on('click', function () {
                var domain = window.location.host;
                if (domain.indexOf("fund123.cn") < 0) {
                    dialog.alert("您当前域名无法获取用户信息，无法使用该功能!", "error", null, function () {
                    });
                    return false;
                }
                var accountServices = {
                    users: {
                        online: function () {
                            var suValue = $.cookie('su');
                            if (suValue) {
                                var middleArray = suValue.split('&');
                                return {
                                    name: middleArray[0],
                                    id: middleArray[0]
                                };
                            }
                            return null;
                        }
                    }
                };
                if (accountServices.users && accountServices.users.online()) {
                    dialog.confirm("本地数据将被覆盖，确定加载吗?", function () {
                        var $table = $("#table-estimate");
                        $table.find("tbody tr:first td").html("正在加载数据...");
                        db.loadfundsFromShumi(function (codes) {
                            if (!codes || !codes.length) {
                                $table.find("tbody tr:first td").html("您还没有添加基金!");
                            } else {
                                controller.getEstimateList(codes);
                            }
                        });
                    }, function () {
                        return true;
                    });
                } else {
                    dialog.alert("您还没有登录数米网，请先登录", "warn", null, function () {
                        window.location.href = "https://account.fund123.cn/login/login/login.aspx?returnUrl=" +
                            encodeURIComponent(window.location.href);
                    });
                }
            });
        },
        init: function () {
            this.autoLoadAssets();
            this.controlPanel();
            this.loadEstimateTime();
            setInterval(function () {
                 window.location.reload(true);
            }, 60 * 1000);
        }
    };
    return new Index();
});