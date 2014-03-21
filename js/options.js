$(function(){
    function getValue(){
        var f=document.forms['options'];
        var sm = 0;
        for(var i in f['search_method']){
            if (f['search_method'][i].checked){
                sm = f['search_method'][i].value;
                break;
            }
        }
        var sr = f['show_recomand'].checked;
        var vh = f['visit_history'].value;
        return {
            'visitHistory':vh,
            'showRecomand':sr,
            'searchMethod':sm
        };
    }
    function setValue(o){
        var f=document.forms['options'];
        for(var i in f['search_method']){
            if (f['search_method'][i].value==o.searchMethod){
                f['search_method'][i].checked=true;
                break;
            }
        }
        f['show_recomand'].checked = o.showRecomand=="true";
        f['visit_history'].value = o.visitHistory;
    }
    $("#syncData").click(function(e){
        Nav.syncDB();
        var url = "http://nav.8866.org/";
        $.get(url,function(r){
            var l = window.localStorage;
            var s = $(r).find("#tools ul.con").html();
            s&&l.setItem("apps",s);
            s = $(r).find("#indexhtml ul.htop").html();
            s&&l.setItem("indexhtml",s);
        })
        return false;
    });
    $("#save").click(function(e){
        Nav.saveConfig(getValue());
        alert("\u5df2\u4fdd\u5b58\uff01");
        return false;
    });
    $("#default").click(function(e){
        Nav.defaultConfig();
        setValue(Nav.config);
        return false;
    });
    setValue(Nav.config);
    var d = new Date();
    d.setTime(Nav.config.lastDbUpdate);
    
    $(".error").html("\u4e0a\u6b21\u66f4\u65b0\u65f6\u95f4:"+d.getFullYear()+"\u5e74"+(d.getMonth()+1)+"\u6708"+d.getDate()+"\u65e5"+d.getHours()+"\u65f6"+d.getMinutes()+"\u5206");
})