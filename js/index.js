
var Nav;

$(function(){
    $("#version").text(chrome.app.getDetails().version);
    $("#search_words").mouseover(function(){
        $(this).focus();
    }).focus();

    var mainsite = "http://nav.8866.org/";
    var favorites="favorites";
    var visitHistory = "visitHistory";
    var showRecomand = "showRecomand";
    var searchMethod = "searchMethod";
    var lastDbUpdate = "lastDbUpdate";
    var search_str = "";
    function shStrLen(sString)
    {
        var sStr,iCount,i,strTemp ;
        iCount = 0 ;
        sStr = sString.split("");
        for (i = 0 ; i < sStr.length ; i ++)
        {
            strTemp = escape(sStr[i]);
            if (strTemp.indexOf("%u",0) == -1)
            {
                iCount += 1 ;
            }else{
                iCount += 2 ;
            }
        }
        return iCount ;
    }

    var reg = /[0-9]+|((ch|zh|sh)|[bcdfghjklmnpqrstwxyz'])(v|uo|un|ui|ue|uang|uan|uai|ua|u|ou|ong|o|iu|iong|ing|in|ie|iao|iang|ian|ia|i|eng|en|ei|e|ao|ang|an|ai|a)?/gi;

    function splitPinYin(str){
        var enArr = str.match(reg);
        var o = escape(str).match(/%u[0-9a-f]{4}/gi);
        var zhArr = (o&&o.length)?unescape(o).split(","):null;
        return {
            "en":enArr,
            "zh":zhArr
        };
    }
    function search(){
        if (shStrLen(search_str)>=2){
            $(".panel-sel").hide(400);
            Nav.search("#search_result");
            $("#search_result").slideDown(400);
        }else {
            $("#search_result").slideUp(200);
            $(".panel-sel").show();
        }
    }
    function userGuide(){

    }
    $("#search_words").bind({
        "keydown":function(e){
            if (e.keyCode==13)
                if(shStrLen(search_str)<2)
                    alert("\u8bf7\u81f3\u5c11\u8f93\u5165\u4e24\u4e2a");
                else search();
        },
        "keyup":function(e){
            search_str = $(this).val();
            if (Nav.config.searchMethod == 2)
                search();
            else if (shStrLen(search_str)<2){
                $("#search_result").slideUp(200);
                $(".panel-sel").show();
            }
        },
        "blur":function(e){
            var _this=this;
            setTimeout(function(){
                $(_this).val("");
                $("#search_result").slideUp(200);
                $(".panel-sel").show();
            },150);
        },
        "webkitspeechchange":function(e){
            search_str = $(this).val();
            search();
        }
    });
    var dragOptions = {
        revert:"invalid",
        helper: "clone",
        appendTo:"body",
        scroll:false,
        zIndex:999999999
    };

    Nav = Nav || function(){
        return [];
    };
    Nav.config = {};
    Nav.db = window.openDatabase("iStudy", "1.0", "iStudy\u7f51\u5740\u5bfc\u822a\u6570\u636e\u5e93", 1024*1024);
    Nav.syncDB = function(){
        var sync_url = mainsite + "plugin/syncDB.php";
        var sql_site = "CREATE TABLE IF NOT EXISTS sites(id int NOT NULL PRIMARY KEY,cid int NOT NULL DEFAULT 0,name varchar(255) NOT NULL DEFAULT '',url varchar(255) NOT NULL,desc text,pinyin varchar(255))";
        var sql_cate = "CREATE TABLE IF NOT EXISTS category(cid int NOT NULL PRIMARY KEY,pid int NOT NULL DEFAULT 0, name varchar(255) NOT NULL DEFAULT '',desc text)";
        $.ajax({
            url:sync_url,
            dataType:"json",
            type:"GET",
            data:'action=site',
            timeout:2000,
            async:false,
            cache:false,
            success:function(o,m,r){
                try{
                    if (o.status === "success"){
                        $("#syncProg").attr({
                            "max":o.count,
                            "value":0
                        }).css("display","inline");
                        $(".error").html("\u6b63\u5728\u66f4\u65b0\u7f51\u5740...");
                        Nav.execute(sql_site,[],function(){
                            var sql = "REPLACE INTO sites (`id`,`cid`,`name`,`url`,`desc`,`pinyin`) values(?,?,?,?,?,?)";
                            Nav.execute(sql,o.data,function(p){
                                $("#syncProg").attr("value",p);
                                if (p == o.count){
                                    var c = Nav.config.count||o.count;
                                    if (c<o.count)chrome.browserAction.setBadgeText({
                                        text:"new"
                                    });
                                        else chrome.browserAction.setBadgeText({text:""});
                                    Nav.config.count = o.count;
                                    $(".error").html("Success!!");
                                    $.ajax({
                                        url:sync_url,
                                        dataType:"json",
                                        type:"GET",
                                        data:'action=cate',
                                        timeout:2000,
                                        //async:false,
                                        cache:false,
                                        success:function(o,m,r){
                                            try{
                                                if (o.status === "success"){
                                                    $("#syncProg").attr({
                                                        "max":o.count,
                                                        "value":0
                                                    }).css("display","inline");
                                                    $(".error").html("\u6b63\u5728\u66f4\u65b0\u5206\u7c7b...");
                                                    Nav.execute(sql_cate,[],function(){
                                                        var sql = "REPLACE INTO category (`cid`,`pid`,`name`,`desc`) values(?,?,?,?)";
                                                        Nav.execute(sql,o.data,function(p){
                                                            $("#syncProg").attr("value",p);
                                                            if (p == o.count){
                                                                Nav.config.lastDbUpdate = (new Date()).getTime();
                                                                Nav.saveConfig();
                                                                $(".error").html("Success!!");
                                                            }
                                                        },function(msg){
                                                            $(".error").html(msg);
                                                        });
                                                    },function(msg){
                                                        alert("\u6570\u636e\u5e93\u521b\u5efa\u5931\u8d25\u2026\u2026"+msg);
                                                    });
                                                } else {
                                                    $(".error").html(o.status);
                                                }
                                            } catch(e){
                                                $(".error").html(e);
                                            }
                                        },
                                        error:function(o,b,c){
                                            $(".error").html(b+"\uff0c\u66f4\u65b0\u5931\u8d25...\u8bf7\u68c0\u67e5\u60a8\u7684\u7f51\u7edc\u8fde\u63a5\uff01\u5982\u679c\u8fd8\u51fa\u73b0\u95ee\u9898\uff0c\u8bf7\u4e0e<a href='mailto:rickytan@zju.edu.cn'>\u7ba1\u7406\u5458</a>\u53d6\u5f97\u8054\u7cfb\u3002");

                                        }
                                    });
                                }
                            },function(msg){
                                $(".error").html(msg);
                            });
                        },function(msg){
                            alert("\u6570\u636e\u5e93\u521b\u5efa\u5931\u8d25\u2026\u2026"+msg);
                        });
                    } else {
                        $(".error").html(o.status);
                    }
                } catch(e){
                    $(".error").html(e);
                }
            },
            error:function(o,b,c){
                $(".error").html(b+"\uff0c\u66f4\u65b0\u5931\u8d25...\u8bf7\u68c0\u67e5\u60a8\u7684\u7f51\u7edc\u8fde\u63a5\uff01\u5982\u679c\u8fd8\u51fa\u73b0\u95ee\u9898\uff0c\u8bf7\u4e0e<a href='mailto:rickytan@zju.edu.cn'>\u7ba1\u7406\u5458</a>\u53d6\u5f97\u8054\u7cfb\u3002");
            }
        });

    };
    Nav.search = function(container){
        var sql = "SELECT MAX(name) name,url,MAX(desc) desc FROM sites WHERE ";
        var o = splitPinYin(search_str);
        if (o.en){
            sql += "pinyin like \"%"+o.en.join("%")+"%\"";
        }
        if (o.zh){
            if(o.en) sql += " and ";
            sql += "name like \"%"+o.zh.join("%")+"%\"";
        }
        sql += " GROUP BY url LIMIT 0,45";
        Nav.query(sql, [], function(results){
            $(container).empty();
            if (results.rows.length==0) $(container).append("<li>\u65e0\u7ed3\u679c\uff0c\u8bf7\u6362\u4e2a\u5173\u952e\u8bcd\u54e6...</li>");
            for(var i=0;i<results.rows.length;++i){
                var o = results.rows.item(i);
                var a = "<a href=\""+o.url+"\" target=\"_blank\" title=\""+o.desc+"\">"+o.name+"</a>";
                $(container).append("<li>"+a+"</li");
            }
        }, function(msg){
            $(container).html("\u67e5\u8be2\u9519\u8bef!error:"+msg);
        });
    }
    Nav.getCate = function(id,container){
        var sql = "SELECT cid,name FROM category WHERE pid=? LIMIT 0,12";
        Nav.query(sql,[id],function(results){
            $(container).empty();
            for(var i=0;i<results.rows.length;++i){
                var li = document.createElement("li");
                var o = results.rows.item(i);
                $(li).addClass("l2-list").attr("id", o.cid).text(o.name).appendTo(container).click(function(){
                    $("ul.l2 li").removeClass("l2-list-sel");
                    $(this).addClass("l2-list-sel");
                    var id = $(this).attr("id");
                    indexhtml = $("#indexhtml").html();
                    Nav.getSite(id,"#indexhtml");
                });
            }
        }, function(msg){
            $(container).html("<span style='color:red'>\u67e5\u8be2\u5931\u8d25！error:"+msg+"</span>");
        });
    }
    Nav.getSite = function(id,container){
        var sql = "SELECT name,url,desc FROM sites WHERE cid=? LIMIT 0,50";
        Nav.query(sql,[id],function(results){
            $(container).empty();
            for(var i=0;i<results.rows.length;++i){
                var o = results.rows.item(i);
                var a = "<a href=\""+o.url+"\" target=\"_blank\" title=\""+o.desc+"\">"+o.name+"</a>";
                $(container).append("<li>"+a+"</li");
            }
            $("a").draggable(dragOptions);
        },function(msg){
            $(container).html("<span style='color:red'>\u67e5\u8be2\u5931\u8d25\uff01error:"+msg+"</span>");
        });
    }
    Nav.recordHist = function(a){
        var visit = window.localStorage.getItem("visitlist");
        visit = visit?visit.split(","):[];
        var t = escape(a.innerHTML)+"+"+a.href;
        while(visit.length>=parseInt(Nav.config.visitHistory))
            visit.shift();
        if (visit.indexOf(t)<0) visit.push(t);
        window.localStorage.setItem("visitlist",visit);
    }
    Nav.loadIndexHtml = function(container){
        var ih = window.localStorage.getItem("indexhtml");
        if (ih === null||ih.trim()===""||ih.trim()==="null"){
            var url = mainsite;
            $(container).html("\u6b63\u5728\u52a0\u8f7d...");
            $.get(url,function(r){
                var s = $(r).find("#indexhtml ul.htop").html();
                window.localStorage.setItem("indexhtml",s);
                $(container).html(s);
            }).onerror=function(){
                $(container).html("<span style='color:red'>\u52a0\u8f7d\u5931\u8d25!</span>");
            }
        } else {
            $(container).html(ih);
        }
        $("a").draggable(dragOptions);
    }
    Nav.loadApps = function(container){
        var app = window.localStorage.getItem("apps");
        if (app === null||app.trim()===""||app.trim()==="null"){
            var url = mainsite;
            $(container).html("\u6b63\u5728\u52a0\u8f7d...");
            $.get(url,function(r){
                var s = $(r).find("#tools ul.con").html();
                window.localStorage.setItem("apps",s);
                $(container).html(s);
            }).onerror=function(){
                $(container).html("<span style='color:red'>\u52a0\u8f7d\u5931\u8d25!</span>");
            }
        } else
            $(container).html(app);
        $("a").draggable(dragOptions);
    }
    Nav.loadRecent = function(container){
        var sql = "SELECT url,MAX(name) name,MAX(desc) desc FROM sites GROUP BY url ORDER BY id DESC LIMIT 0,15";
        Nav.query(sql,[],function(results){
            $(container).empty();
            for(var i=0;i<results.rows.length;++i){
                var o = results.rows.item(i);
                var a = "<a href=\""+o.url+"\" target=\"_blank\" title=\""+o.desc+"\">"+o.name+"</a>";
                $(container).append("<li>"+a+"</li");
            }
            $("a").draggable(dragOptions);
        },function(msg){
            $(container).html("<span style='color:red'>\u67e5\u8be2\u5931\u8d25\uff01error:"+msg+"</span>");
        });
    }
    Nav.loadRecomand = function(container){
        var url = mainsite+"plugin/reco.json?id="+Math.floor((new Date).getTime() / 60000);
        $.getJSON(url,function(a){
            a = a||[["\u5b66\u4e60\u7f51","http://istudy.zuss.zju.edu.cn/"]];
            a.forEach(function(v,i){
                var t="<a href=\""+v[1]+"\">"+v[0]+"</a>";
                $(container).append(t);
            });
        })
    }
    Nav.loadHistory = function(container){
        var visit = window.localStorage.getItem("visitlist");
        visit = visit?visit.split(","):[];
        $(container).empty();
        visit.forEach(function(value,index){
            var t=value.split("+");
            var a = "<a href=\""+t[1]+"\" target=\"_blank\">"+unescape(t[0])+"</a>";
            $(container).append("<li>"+a+"</li>");
        });
        $("a").draggable(dragOptions);
    }
    Nav.clearHistory = function(){
        window.localStorage.setItem("visitlist","");
    }
    Nav.loadConfig = function(){
        var l=window.localStorage;
        Nav.config.visitHistory = l.getItem(visitHistory)||25;
        Nav.config.showRecomand = l.getItem(showRecomand)||"true";
        Nav.config.searchMethod = l.getItem(searchMethod)||2;
        Nav.config.lastDbUpdate = l.getItem(lastDbUpdate)||0;
        Nav.config.count = l.getItem('count')||0;
    }
    Nav.saveConfig = function(options){
        var o = options || Nav.config;
        var l=window.localStorage;
        for(var k in o){
            if (o.hasOwnProperty(k))
                l.setItem(k,o[k]);
        }
    }
    Nav.loadFavorite = function(container){
        var fav = window.localStorage.getItem(favorites);
        fav = fav?fav.split(','):[];
        $(container).empty();
        fav.forEach(function(value,index){
            var t=value.split("+");
            var a = "<a href=\""+t[1]+"\" class=\"fav\" target=\"_blank\">"+unescape(t[0])+"</a>";
            $(container).append("<li>"+a+"</li>");
        });
    }
    Nav.clearFavorite = function(){
        window.localStorage.setItem(favorites,"");
    }
    Nav.removeFavorite = function(a){
        var fav = window.localStorage.getItem(favorites);
        fav = fav?fav.split(","):[];
        var t = escape(a.innerText)+"+"+a.href;
        fav.splice(fav.indexOf(t), 1);
        window.localStorage.setItem(favorites,fav);
    }
    Nav.addFavorite = function(a){
        var fav = window.localStorage.getItem(favorites);
        fav = fav?fav.split(","):[];
        var t = escape(a.innerText)+"+"+a.href;
        while(fav.length>=30)
            fav.shift();
        if (fav.indexOf(t)<0) fav.push(t);
        window.localStorage.setItem(favorites,fav);
    }
    Nav.defaultConfig = function(){
        var l=window.localStorage;
        l.removeItem(visitHistory);
        l.removeItem(showRecomand);
        l.removeItem(searchMethod);
        Nav.loadConfig();
    }
    Nav.query = function(sql,data,callbackSuccess,callbackFailure){
        Nav.db.readTransaction(function(tx){
            tx.executeSql(sql,data,function(tx,r){
                callbackSuccess&&callbackSuccess(r)
            },function(tx,e){
                callbackFailure&&callbackFailure(e.message)
            });
        });
    }
    Nav.execute = function(sql,data,callS,callF){
        Nav.db.transaction(function(tx){
            var i = 0, p = 0;
            do{
                tx.executeSql(sql,data[i],function(tx,r){
                    callS&&callS(++p);
                },function(tx,e){
                    callF&&callF(e.message);
                });
            }while(++i<data.length);
        });
    }
    Nav.loadConfig();

    function s(){
        if (parseInt(window.localStorage.getItem(lastDbUpdate)) + 1000 * 3600 * 24 * 3 < new Date()) {
        Nav.syncDB();
    }
        window.setTimeout(s, 1000*3600*24*7);
    }
    s();

$("#tabNav").find("li").each(function(a,b){$(b).click(function(){$("#tabNav li").removeClass("current");$(this).addClass("current");$("div.panel").removeClass("panel-sel").hide();$($("div.panel")[a]).addClass("panel-sel").show();switch(a){case 0:Nav.loadFavorite("#favorite");break;case 1:Nav.loadIndexHtml("#indexhtml");break;case 2:Nav.loadApps("#apps");break;case 3:Nav.loadHistory("#history");break;case 4:Nav.loadRecent("#recent")}return false})});$("ul.l1 li").click(function(){$("ul.l1 li").removeClass("l1-list-sel");
$(this).addClass("l1-list-sel");var a=$(this).attr("id");Nav.getCate(a,$("ul.l2"))});$("#favorite_tab").droppable({accept:"a",activeClass:"actived",hoverClass:"hover",addClasses:false,tolerance:"pointer",drop:function(a,b){Nav.addFavorite(b.draggable[0]);Nav.loadFavorite("#favorite");$(this).fadeOut(1E3/6).fadeIn(1E3/6).fadeOut(1E3/6).fadeIn(1E3/6)}});$("#favorite").sortable({appendTo:"body",items:"li",placeholder:"placeholder",connectWith:"#trash",cursor:"move",start:function(){$("#trash").slideDown("fast")},
stop:function(){Nav.clearFavorite();$(this).find("li").each(function(a,b){Nav.addFavorite(b.children[0])});$("#trash").slideUp("slow")}});$("#trash").droppable({accept:"li",tolerance:"pointer",hoverClass:"hover",drop:function(a,b){var c=b.draggable[0].children[0];b.draggable.remove();Nav.removeFavorite(c)}});$("#clsHist").button({icons:{primary:"ui-icon-trash"},label:"\u6e05\u7a7a"}).click(function(){Nav.clearHistory();$("#history").children("li").hide("slow",function(){$(this).remove()})});$("#addFav").button({icons:{primary:"ui-icon-plus"},
label:"\u589e\u52a0"}).click(function(){$("#inputDialog").dialog({modal:true,resizable:false,show:"slide",hide:"fade",open:function(){$(this).find("input").css({borderColor:"gray"}).val("").last().val("http://")},buttons:{"\u786e\u5b9a":function(){var a=$(this).find("input[name=title]").val(),b=$(this).find("input[name=link]").val();if(a.trim()!="")if(/[a-zA-z]+:\/\/[^\s]*/.test(b)){var c=document.createElement("a");c.href=b;c.innerHTML=a;Nav.addFavorite(c);Nav.loadFavorite("#favorite");$(this).dialog("close")}else $(this).find("input[name=link]").css({borderColor:"red"});
else $(this).find("input[name=title]").css({borderColor:"red"})}}})});document.onclick=function(a){a=a||window.event;a=a.target?a.target:a.srcElement;if(!(a.tagName!="A"||a.href.trim()==""||a.href.trim()=="#"))return Nav.recordHist(a),true};setTimeout(function(){Nav.loadIndexHtml("#indexhtml")},400);Nav.config.showRecomand==="true"&&Nav.loadRecomand($("#recomand").show(300));
})
