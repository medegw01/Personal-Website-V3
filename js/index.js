function red(){
    $('#red').click(function () {
        $("#console").fadeOut(1000, function () {
            $(this).remove();
            $('#title_bar').detach();
            $('#console_inv').detach();
            $('#about_intro').css("width","100%");
            $('#about_container').css("max-width", "900px");
            $('#about_container .hl').css('width','40%')

        });

    });
}
function orange(){
    $('#orange').click(function () {
        $("#console").slideUp("slow");
    });
}
function green(){
    $('#green').click(function () {
        $("#console").slideDown("slow");
    });
}
$(document).ready(
    function(){
        window.setTimeout(function f() {
            $('.loading').fadeOut('slow');
        }, 1500);

        var clock_time = 0;
        var done = false;
        var lastclicked = "#dell_l";
        var times = [0, 5060, 8140, 18280, 26020, 30540, 35080];
        var fakes = ['#code_intro','#fake_import', '#fake_function','#fake_functionb', '#fake_result', '#fake_resultb', '#fake_resultc'];
        var real = ['#code_intro','#code_import', '#code_function', '#code_functionb', '#code_result', '#code_resultb', '#code_resultc'];
        var path = ['extras/text/code_intro.txt', 'extras/text/code_import.txt', 'extras/text/code_function.txt', 'extras/text/code_function_2.txt', "extras/text/code_result.txt", "extras/text/code_result2.txt", "extras/text/code_result3.txt"];

        if(!($("#toggle-nav").is(":visible"))){
            $(".active").show();

        }
        var lastScrollTop = 0;
        $(window).scroll(function(event){
            var st = $(this).scrollTop();
            if (st > lastScrollTop){
                $('#topbar').slideUp();
            } else {
                $('#topbar').slideDown();
            }
            lastScrollTop = st;
        });
        let dis = "border-left";
        $(window).resize(function() {
            $('.work_options_li').css(dis,"none");
        });

        $("#work_options div").click(function(){
            let other = "";
            if ($('.work_options_li').css('display') == 'block'){
                dis = "border-left";
            } else{
                dis = "border-bottom";
            }

            $(lastclicked).css("color","#8892b0");
            $(lastclicked).css(dis,"none");
            $(lastclicked+'e').css("display", "none");

            let id = $(this).attr("id");
            lastclicked = '#' + id;
            $(lastclicked+'e').fadeIn("slow");
            $(lastclicked).css(dis,"2px solid #64ffda");
            $(lastclicked).css("color","#64ffda");


        });


        function close_nav(){
            $('#toggle-nav').text('\u2630');
            $(".active").slideUp();
            $("#particles-js").css("filter", "blur(0)");
            $('body').css('overflow', 'auto');
        }
        function open_nav(){
            $('#toggle-nav').text('\u2573');
            $(".active").slideDown();
            $("#particles-js").css("filter","blur(5px)");
            $('body').css('overflow', 'hidden');
        }

        $('#show_more').click(function () {
            if (!($('#more').is(":visible"))){
                $('#show_more').text("Less Projects");
                $('#more').slideDown('slow', function () {
                    $('#more').css('display','grid');
                });
            }
            else{
                $('#show_more').text("More Projects");
                $('#more').slideUp();
            }
        });

        $("#toggle-nav").click(function(){
            if ($(".active").is(":visible")){
                close_nav();
            }
            else{
                open_nav();
            }
        });
        $("#refresher").click(function(){
            document.location.reload(true);
        });
        $(".active a").click(function (e) {
            e.preventDefault();
            let tmp = this;
            let timer = 0;
            if($("#toggle-nav").is(":visible")){
                close_nav();
                timer = 500;
            }
            setTimeout(function () {
                //window.location = tmp.href; I wanted something animated
                $("html, body").animate({ scrollTop: $($(tmp).attr("href")).offset().top }, 500);
            }, timer);


        });

        $.fn.isInViewport = function() {
            var elementTop = $(this).offset().top;
            var elementBottom = elementTop + $(this).outerHeight();

            var viewportTop = $(window).scrollTop();
            var viewportBottom = viewportTop + $(window).height();

            return elementBottom > viewportTop && elementTop < viewportBottom;
        };

        function console_scroll(){
            if(!done){
                $('#console').animate({
                    scrollTop: $('#console').offset().top
                },1000);
            }
            else{
                $('#console').stop();
            }
            return false;
        }
        red();
        orange();
        green();

        function print_txt(index){
            $.get(path[index], function(data) {
                var a = 0;
                var five = 0;
                for(let i = 0; i < data.length; i++){
                    a += 20;
                    five +=1;
                    window.setTimeout(function f(ch){
                        if(ch == '\n'){
                            $(fakes[index]).append('<br/>');
                        }
                        else if(i == 197 && fakes[index] == '#code_intro'){
                            $(fakes[index]).append('&#128515;');
                            $(fakes[index]).append('&#128075;');
                        }
                        else if(i == data.length - 1 && fakes[index] != '#code_intro'){
                            $(fakes[index]).remove();
                            $(real[index]).show();
                            console_scroll();
                            console_scroll();
                            if(fakes[index] == '#fake_resultc'){
                                done = true;
                            }

                        }
                        else{
                            $(fakes[index]).append(ch);
                        }

                    }, i*20, data.charAt(i));
                }
            }, 'text');
            return true;

        }

        function print(){
            for(var j = 0; j < 8; j++){
                window.setTimeout(function f(j) {
                    if(!done){
                        print_txt(j);
                    }
                }, times[j], j);
            }
            return true;
        }
        $( "#console" ).one('mouseover', (function() {
            print();
        }));

    });
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("red").addEventListener("click", red);
    document.getElementById("orange").addEventListener("click", orange);
    document.getElementById("green").addEventListener("click", green);
});


