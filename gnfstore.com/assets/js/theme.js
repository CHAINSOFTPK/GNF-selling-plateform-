$(document).ready(function() {
    // Mobile Menu
    $('.mobile-menu nav').meanmenu({
        meanScreenWidth: "991",
        meanMenuContainer: ".mobile-menu",
        onePage: false,
    });
    //Counter Up
    $('.counter').counterUp({
        time: 1500
    });

    // Progress Bar
    if ($('.progress-line').length) {
        $('.progress-line').appear(function() {
            var el = $(this);
            var percent = el.data('width');
            $(el).css('width', percent + '%');
        }, {
            accY: 0
        });
    }

    /*---------------------
    Nivo Slider active js
    --------------------- */
    $('#mainSlider').nivoSlider({
        directionNav: true,
        animSpeed: 500,
        slices: 18,
        pauseTime: 5000,
        pauseOnHover: false,
        controlNav: true,
        prevText: '<i class="fa fa-angle-left nivo-prev-icon"></i>',
        nextText: '<i class="fa fa-angle-right nivo-next-icon"></i>'
    });
    // Brand Active
    $('.slider-carousel').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 6000,
        smartSpeed: 1500,
        dots: false,
        dotsEach: false,
        nav: true,
        navText: [" <i class='flaticon-long-arrow-pointing-to-left'></i>", "<i class='flaticon-long-arrow-pointing-to-the-right'></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            },
            1000: {
                items: 1
            },
            1199: {
                items: 1
            },
            1920: {
                items: 1
            }
        }
    });

    // Brand Active
    $('.slider-list').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 4000,
        smartSpeed: 1500,
        dots: true,
        dotsEach: true,
        animateOut: 'fadeOut',
        animateIn: 'animate__fadeIn',
        nav: false,
        navText: [" <i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            },
            1000: {
                items: 1
            },
            1199: {
                items: 1
            },
            1920: {
                items: 1
            }
        }
    });
    //about //
    $('.token_list').owlCarousel({
        loop: true,
        autoplay: true,
        smartSpeed: 2500,
        autoplayTimeout: 4000,
        dots: false,
        dotsEach: false,
        nav: false,
        navText: ["<i class='flaticon-left-arrow-3''></i>", "<i class='flaticon-right-arrow-3''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 3
            },
            992: {
                items: 3
            },
            1000: {
                items: 3
            },
            1365: {
                items: 4
            },
            1500: {
                items: 4
            },
            1920: {
                items: 5
            }
        }
    });
    // testi //
    $('.testi_list').owlCarousel({
        loop: true,
        autoplay: true,
        smartSpeed: 2500,
        autoplayTimeout: 4000,
        dots: true,
        dotsEach: true,
        nav: false,
        navText: ["<i class='flaticon-left-arrow-3''></i>", "<i class='flaticon-right-arrow-3''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            },
            1000: {
                items: 2
            },
            1365: {
                items: 3
            },
            1500: {
                items: 3
            },
            1920: {
                items: 3
            }
        }
    });
    // blog section
    $('.blog_list').owlCarousel({
        loop: true,
        autoplay: true,
        smartSpeed: 2500,
        autoplayTimeout: 4000,
        dots: true,
        dotsEach: true,
        nav: false,
        navText: ["<i class='flaticon-left-arrow-3''></i>", "<i class='flaticon-right-arrow-3''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            },
            1000: {
                items: 2
            },
            1365: {
                items: 3
            },
            1500: {
                items: 3
            },
            1920: {
                items: 3
            }
        }
    });

    (function($) {
        $(".accordion > li:eq(0) a").addClass("active").next().slideDown();

        $(".accordion a").click(function(j) {
            var dropDown = $(this).closest("li").find("p");

            $(this).closest(".accordion").find("p").not(dropDown).slideUp();

            if ($(this).hasClass("active")) {
                $(this).removeClass("active");
            } else {
                $(this).closest(".accordion").find("a.active").removeClass("active");
                $(this).addClass("active");
            }

            dropDown.stop(false, true).slideToggle();

            j.preventDefault();
        });
    })(jQuery);

    //resent
    $('.resent_list').owlCarousel({
        loop: true,
        autoplay: false,
        autoplayTimeout: 4000,
        smartSpeed: 1500,
        dots: true,
        dotsEach: true,
        nav: false,
        navText: [" <i class='fas fa-angle-left'></i>", "<i class='fas fa-angle-right'></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            },
            1000: {
                items: 1
            },
            1199: {
                items: 1
            },
            1920: {
                items: 1
            }
        }
    });

    // Venubox
    $('.venobox').venobox({
        numeratio: true,
        infinigall: true
    });


    // to top Jquery
    $(window).scroll(function() {
        if ($(this).scrollTop() > 40) {
            $('#to-top').fadeIn();
        } else {
            $('#to-top').fadeOut();
        }
    });

    // sticky
    var wind = $(window);
    var sticky = $('#sticky-header');
    wind.on('scroll', function() {
        var scroll = wind.scrollTop();
        if (scroll < 100) {
            sticky.removeClass('sticky-nav');
        } else {
            sticky.addClass('sticky-nav');
        }
    });



    //Header Search
    if ($('.search-box-outer').length) {
        $('.search-box-outer').on('click', function() {
            $('body').addClass('search-active');
        });
        $('.close-search').on('click', function() {
            $('body').removeClass('search-active');
        });
    }
    // to wow Jquery
    new WOW().init();

    $(".tab_content").hide();
    $(".tab_content:first").show();

    /* if in tab mode */
    $("ul.tabs li").click(function() {

        $(".tab_content").hide();
        var activeTab = $(this).attr("rel");
        $("#" + activeTab).fadeIn();

        $("ul.tabs li").removeClass("active");
        $(this).addClass("active");

        $(".tab_drawer_heading").removeClass("d_active");
        $(".tab_drawer_heading[rel^='" + activeTab + "']").addClass("d_active");

    });
    /* if in drawer mode */
    $(".tab_drawer_heading").click(function() {

        $(".tab_content").hide();
        var d_activeTab = $(this).attr("rel");
        $("#" + d_activeTab).fadeIn();

        $(".tab_drawer_heading").removeClass("d_active");
        $(this).addClass("d_active");

        $("ul.tabs li").removeClass("active");
        $("ul.tabs li[rel^='" + d_activeTab + "']").addClass("active");
    });


    //======< scrollcue js >======
    $(function() {
        scrollCue.init({
            duration: 1500,
            interval: -0.7,
            percentage: 0.90,
            smartSpeed: 500

        })
    });



});