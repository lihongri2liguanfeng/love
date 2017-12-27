sceneAnim = (function($) {
    var tpl = `
        <div class="scene-card">
            <div class="occ-photo"><img class="photo" src="<%= photo %>"></div>
        </div>
    `;

    var dirMap = ['left', 'right', 'bottom', 'top'];


    function SceneAnim(target, options) {
        var el = this.el = target instanceof $ ? target : $(target);

        if (!el.length) {
            throw 'Please set target container...';
            return;
        }

        if (el.data('sceneAnim')) {
            throw 'This target is instanced a sceneAnim screen';
            return;
        }
        this.timer = 1000;
        this.showtime = false;
        this.card = null;
        this.tpl = _.template(tpl);
        this.msgQueue = [];
        this.flag = false;
        this.init();

    }

    $.extend(SceneAnim.prototype, {
        init: function() {
            var _this = this;
            $(window).on('resize', function() {
                _this.winWidth = $(window).width();
                _this.winHeight = $(window).height();
            }).trigger('resize');

            this.loadImg(139);
            $(".likeCount").text(this.setRandom(200, 1000));
            this.heartHandler();

        },
        loadImg: function(num) {
            var _this = this;
            for (var i = 0; i < num; i++) {
                this.push({
                    photo: `./img/${_this.setRandom(1,num)}.jpg`, // 图片路径
                    timeout: _this.timer, // 每一张图片停留的时间 ms
                });
            }

        },
        push: function(options) {
            var options = $.extend({
                photoOpt: {},
                // bgColor: this.getRandamColor(),
            }, options);
            // 空闲时间预加载图片
            var img = new Image();
            img.onload = function(e) {
                options.photoOpt.width = this.width;
                options.photoOpt.height = this.height;
            }
            img.src = options.photo;

            this.msgQueue.push(options);

            // 如果没有计时器在运行，直接开始
            // console.log('timer:', this.timer);
            if (!this.showtime) {
                this.next();
            }
        },
        // 下一个
        next: function() {
            // 当前卡片存在移除
            var _this = this;

            // 存在当前卡片
            if (this.card) {
                this.leave(function() {
                    // 下一个卡片
                    if (_this.msgQueue.length) {
                        _this.enter();
                    }
                });
            } else if (this.msgQueue.length) {
                this.enter();
            }
        },
        leave: function(callback) {
            this.leaveAnim(callback);
        },
        enter: function() {
            this.showtime = true;
            this.opt = this.msgQueue.shift();
            this.card = $(this.tpl(this.opt));
            this.el.data('card', this.card);
            this.photo = this.card.find('.photo');
            this.info = this.card.find('.occ-info');

            // 执行入场动画
            this.el.append(this.card);

            var img = new Image();
            var _this = this;
            img.onload = function() {
                _this.opt.photoOpt.width = this.width / 1.5;
                _this.opt.photoOpt.height = this.height / 1.5;
                _this.initCard();
            };
            img.onerror = function() {
                _this.opt.photoOpt.width = 0;
                _this.opt.photoOpt.height = 0;
                _this.initCard();
            };
            img.src = this.opt.photo
        },
        getPhotSize: function() {
            var opt = this.opt.photoOpt;
            var dir = (opt.width + 60) / (opt.height + this.info.outerHeight(true) + 60) > this.winWidth / this.winHeight;
            var width;
            var height;
            var maxWidth = this.winWidth - 60;
            var maxHeight = (this.winHeight - this.info.outerHeight(true) - 60);


            if (dir) {
                width = opt.width > maxWidth ? maxWidth : opt.width;
                height = (opt.height / opt.width) * width;
            } else {
                height = opt.height > maxHeight ? maxHeight : opt.height;
                width = (opt.width / opt.height) * height;
            }

            return {
                width: width,
                height: height
            }
        },
        initCard: function() {
            var size = this.getPhotSize();
            this.photo.css(size);
            this.card.css({
                width: size.width < 320 ? 320 : (size.width > this.winWidth ? this.winWidth : size.width + 30 - 30),
            })

            this.card.css({
                left: (this.winWidth - this.card.width()) / 2,
                top: (this.winHeight - this.card.height()) / 2
            });

            this.enterAnim();
        },
        startTimeout: function() {
            var _this = this;

            function timeout() {
                _this.opt.timeout -= 1000;
                if (_this.opt.timeout > 0) {
                    _this.setViewTimeout(_this.opt.timeout);
                    _this.timer = setTimeout(timeout, 1000);
                } else {
                    clearTimeout(_this.timer);
                    _this.next();
                }
            }
            this.timer = setTimeout(timeout, 1000);
        },
        getEnterDir: function() {
            var dir = this.opt.direction;
            var dirs = [
                [{ x: this.winWidth }, { x: 0 }],
                [{ x: -this.winWidth }, { x: 0 }],
                [{ y: this.winHeight }, { y: 0 }],
                [{ y: -this.winHeight }, { y: 0 }]
            ];

            if (dir && dir[0] && dirMap.indexOf(dir[0]) > -1) {
                return dirs[dirMap.indexOf(dir[0])];
            }

            return dirs[Math.floor(Math.random() * 4)];
        },
        getLeaveDir: function(dir) {
            var dir = this.opt.direction;
            var dirs = [
                [{ x: 0 }, { x: this.winWidth }],
                [{ x: 0 }, { x: -this.winWidth }],
                [{ y: 0 }, { y: this.winHeight }],
                [{ y: 0 }, { y: -this.winHeight }]
            ];

            if (dir && dir[1] && dirMap.indexOf(dir[1]) > -1) {
                return dirs[dirMap.indexOf(dir[1])];
            }

            return dirs[Math.floor(Math.random() * 4)];
        },
        enterAnim: function() {
            // this.getRandamColor();
            var _this = this;
            var dir = this.getEnterDir();

            TweenLite.fromTo(this.card,
                this.opt.enterTime || 1,
                $.extend({
                    scale: 0,
                    opacity: 0,
                    rotationX: _this.setRandom(0, 360),
                    rotationY: _this.setRandom(0, 360),
                    rotationZ: _this.setRandom(0, 360),
                }, dir[0]),
                $.extend({
                    ease: Expo.easeOut,
                    scale: 1,
                    opacity: 1,
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    onComplete: function() {
                        _this.startTimeout();
                    }
                }, dir[1])
            );
        },
        leaveAnim: function(callback) {
            // this.getRandamColor();
            var _this = this;
            var dir = this.getLeaveDir();

            TweenLite.fromTo(this.card,
                this.opt.leaveTime || 1,
                $.extend({
                    scale: 1,
                    opacity: 1,
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                }, dir[0]),
                $.extend({
                    ease: Expo.easeIn,
                    scale: 0,
                    opacity: 0,
                    rotationX: _this.setRandom(0, 360),
                    rotationY: _this.setRandom(0, 360),
                    rotationZ: _this.setRandom(0, 360),
                    onComplete: function() {
                        _this.card.remove();
                        _this.showtime = false;
                        callback.call(_this);
                    }
                }, dir[1])
            );
        },
        setViewTimeout: function(time) {
            this.card.find('.occ-time span').text(parseInt(time / 1000));
        },
        setRandom: function(s, e) {
            return Math.floor(Math.random() * (e - s) + 1)
        },
        heartHandler: function() {
        	var _this = this;
            $('body').on("click", '.heart', function() {
                if (!_this.flag) {
                    $(".likeCount").text(parseInt($(".likeCount").text()) + 1);
                    $(this).addClass("heartAnimation");
                    _this.flag = true;
                } else {
                    $(".likeCount").text(parseInt($(".likeCount").text()) - 1);
                    $(this).removeClass("heartAnimation");
                    $(this).css("background-position", "left");
                    _this.flag = false;
                }
            });
        },
        getRandamColor: function() {
            return '#' + Math.floor(Math.random() * 16777215).toString(16);
        }
    });

    return SceneAnim;
})(jQuery);
