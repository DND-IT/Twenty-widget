/**
 * @method Twenty.Components.slideshow
 * @memberof Twenty.Components
 * @description slideshow
 * @param {string} feedUrl the url of the json feed
 * @param {string} mode {('embed'|'fullscreen')}
 * @param {number} startSlide slide number to start with
 * @param {boolean} enableVoting toggle to enable or disable the voting slide at the end of the slideshow
 * @param {Object} transitionClassNames css classes that are being added to the slides while transition
 */
/* istanbul ignore next */

Twenty.Components.slideshow = createReactClass({
    myNameIs: "slideshow",

    slideWidth: typeof window !== "object" ? 0 : window.innerWidth,

    transitions: [],

    mixins: [Twenty.mixins.pureRender],

    initPosition: function() {
        this.slideWidth = window.innerWidth;
        if(this.state.slides.length > 1) {
            this.goToSlide({
                index: this.state.index,
                shouldTrack: false
            });
        }
    },

    goToPrevSlide: function(transitionClassName) {
        // avoid tracking if loop backwards to first slide transition
        var shouldTrack = this.state.index === 1 ? false : true;
        this.goToSlide({
            index: this.state.index - 1,
            transitionClassName: transitionClassName,
            shouldTrack: shouldTrack
        });
    },

    goToCurrentSlide: function(transitionClassName) {
        this.goToSlide({
            index: this.state.index,
            transitionClassName: transitionClassName,
            shouldTrack: false
        });
    },

    goToNextSlide: function(transitionClassName) {
        // avoid tracking if loop to first slide transition (total length - 2 cloned slides)
        var shouldTrack = this.state.index === this.state.slidesLength - 2 ? false : true;
        this.goToSlide({
            index: this.state.index + 1,
            transitionClassName: transitionClassName,
            shouldTrack: shouldTrack
        });
    },

    goToSlide: function(slideParams) {
        // prevent too fast swiping is causing an invalid slideIndex
        if(slideParams && (slideParams.index < 0 || slideParams.index >= this.state.slides.length)) {
            this.goToCurrentSlide(slideParams);
            return;
        }
        slideParams.translateX = -Math.abs(slideParams.index) * parseInt(this.slideWidth) + "px";
        this.swipe(slideParams);
    },

    onSlideTap: function() {
        var mediaProps,
            data;

        if(this.state.currentSlide.type === "link") {
            const blogObject = {
                rewriteObject: {
                    stateObj: this.state.currentSlide,
                    title: this.state.currentSlide.title,
                    path: this.state.currentSlide.link
                }
            };
            Twenty.app.controller.loadBlogsPage(blogObject, this.state.currentSlide.link);
            return;
        }

        if(this.props.mode === "fullscreen" || this.state.currentSlide.type === "ad" || this.state.currentSlide.type === "voting") {
            return;
        }

        if(this.state.currentSlide.type !== "video") {
            // for Netmetrix
            Twenty.event.dispatch({
                type: "slidefullscreen"
            });
        }

        mediaProps = {
            mediatype: "slideshow",
            mode: "fullscreen",
            pagination: false,
            startSlide: this.state.index
        };
        data = $.extend({}, this.props, mediaProps);
        Twenty.page.load(Twenty.page.pages.mediamodal, data);
    },

    swipe: function(slideParams) {
        if(typeof slideParams.index === "number" && this.state.slides[slideParams.index]) {
            this.setState({
                index: slideParams.index
            }, function() {
                this.move(slideParams.translateX);
                this.addTransitionClassName(slideParams.transitionClassName);
                this.handleTracking(slideParams.shouldTrack);
            });
        }
    },

    move: function(translateX) {
        this.swipeDomNode.style.webkitTransform = `translateX(${translateX})`;
        this.swipeDomNode.style.transform = `translateX(${translateX})`;
    },

    isLoopSlide: function(slideIndex) {
        if(typeof slideIndex !== "undefined" && (slideIndex === 0 || slideIndex === this.state.slides.length - 1)) {
            return true;
        } else {
            return false;
        }
    },

    handleLoop: function(slideIndex) {
        var cloneFirstSlide = this.state.slides.length - 1,
            cloneLastSlide = 0,
            firstSlide = 1,
            lastSlide = this.state.slides.length - 2;
        if(slideIndex === cloneLastSlide) {
            this.goToSlide({
                index: lastSlide,
                shouldTrack: true
            });
        } else if(slideIndex === cloneFirstSlide) {
            this.goToSlide({
                index: firstSlide,
                shouldTrack: true
            });
        }
    },

    handleCloseFullscreen: function() {
        // for GTM
        Twenty.event.dispatch({
            type: "pageview",
            params: {
                event: "diashowClose",
                shouldTrack: false
            }
        });
        Twenty.page.closeModal();
    },

    // for GTM specific tracking
    handleTracking: function(shouldTrack = true) {
        if(shouldTrack) {
            let eventLabel,
                pageNumber,
                slideshowID,
                slideshowTitle;

            if(this.props.mode === "embed") {
                if(this.props.slideshowType === "front") {
                    eventLabel = "embedded_frontpage";
                } else {
                    eventLabel = "embedded";
                }
            } else {
                eventLabel = "fullscreen";
            }
            if(this.props.slideshowType !== "front") {
                pageNumber = this.state.index - 1;
                slideshowID = this.state.id;
                slideshowTitle = this.state.title;
            }

            // for Netmetrix
            Twenty.event.dispatch({
                type: "slideimpression"
            });

            // for GTM
            Twenty.event.dispatch({
                type: "slideshow",
                params: {
                    event: "slideshow",
                    event_action: "swipe",
                    event_label: eventLabel,
                    page: pageNumber,
                    slideshow_id: slideshowID,
                    slideshow_title: slideshowTitle
                }
            });
        }
    },

    handleDefferedImgLoad: function(index) {
        var imgsToUnveil = `.img-${index}, .img-${index - 1}, .img-${index + 1}`;

        // workarround for standalone find a solution here
        // $(imgsToUnveil).unveil();
    },

    setTransitionClassName: function(className) {
        if(className && this.transitions.indexOf(className) === -1) {
            this.transitions.push(className);
        }
    },

    addTransitionClassName: function(className) {
        if(className && typeof className === "string") {
            this.setTransitionClassName(className);
            this.swipeDomNode.classList.add(className);
        } else {
            this.onSwipeTransitionEnd();
        }
    },

    removeTransitionClassName: function() {
        for(let i = 0; i < this.transitions.length; i++) {
            this.swipeDomNode.classList.remove(this.transitions.pop());
        }
    },

    onSwipeTransitionEnd: function() {
        this.removeTransitionClassName();
        if(this.isLoopSlide(this.state.index)) {
            this.handleLoop(this.state.index);
        } else {
            this.setState({
                currentSlide: this.state.slides[this.state.index]
            });
        }
    },

    onWindowResize: function() {
        this.initPosition();
    },

    addEventListeners: function() {
        this.swipeDomNode.addEventListener("webkitTransitionEnd", this.onSwipeTransitionEnd);
        this.swipeDomNode.addEventListener("transitionend", this.onSwipeTransitionEnd);
        window.addEventListener("resize", this.onWindowResize, true);
    },

    removeEventListeners: function() {
        this.swipeDomNode.removeEventListener("webkitTransitionEnd", this.onSwipeTransitionEnd);
        this.swipeDomNode.removeEventListener("transitionend", this.onSwipeTransitionEnd);
        window.removeEventListener("resize", this.onWindowResize, true);
    },

    initSlideshow: function(data) {
        var slides = data.data.slides,
            count = 0,
            uncount = 0,
            slidesTotal,
            firstSlide,
            lastSlide;

        // add slide number to each slide
        slides.forEach(obj => {
            if(obj.type !== "ad" && obj.type !== "voting") {
                count += 1;
                obj.pagenumber = count;
                if(!obj.pagetext && obj.caption) {
                    obj.pagetext = obj.caption;
                }
            } else {
                uncount += 1;
            }
        });

        slidesTotal = slides.length - uncount;

        if(slides.length > 1) {
            // prepare loop slides (clone first & last slide)
            firstSlide = slides[0];
            lastSlide = slides[slides.length - 1];

            if(typeof window === "object") {
                slides.unshift(lastSlide);
                slides.push(firstSlide);
            }
        }

        this.setState({
            id: data.data.id,
            title: data.data.title,
            slides: slides,
            slidesLength: slides.length,
            slidesTotal: slidesTotal
        }, function() {
            this.handleDefferedImgLoad(this.state.index);
            this.initPosition();
        });
    },

    getDefaultProps: function() {
        return {
            mode: "embed",
            startSlide: 1,
            enableVoting: false,
            transitionClassNames: {
                slow: "swipe-transition-slow",
                fast: "swipe-transition-fast"
            },
            showIcon: false,
            forcecloning: false
        };
    },

    getInitialState: function() {
        return {
            slides: [],
            currentSlide: {
                type: "image",
                image: {
                    source: [],
                    caption: ""
                }
            },
            index: this.props.startSlide,
            slideshowType: this.props.slideshowType
        };
    },

    componentWillMount: function() {
        if(typeof window === "undefined") {
            // SSR
            const itemSSRDumpData = [{
                am_id: "",
                credit: "",
                dia_pixel_android: "",
                dia_pixel_bb: "",
                dia_pixel_cablecom: "",
                dia_pixel_ipad: "",
                dia_pixel_iphone: "",
                dia_pixel_samsung: "",
                dia_pixel_win8_phone: "",
                dia_pixel_win8_tablet: "",
                pagetext: "In Australien ist am Donnerstag ein SUV in eine Menschenmenge gerast",
                pagetitle: "",
                title_diashow: "Australien: SUV rast in Menschenmenge",
                url: this.props.items[0].images[0].src_big,
                url_small: this.props.items[0].images[0].src_big
            }];

            const SSRCommunityobject = {
                couchtype: "likesvotes",
                share_updated: 0,
                shares_total: 0,
                thumbs_down: 0,
                thumbs_up: 0,
                type: "dia",
                updated: 1513847157,
                vote_updated: 0
            };

            this.initSlideshow({
                items: itemSSRDumpData,
                id: 42,
                title: "",
                communityobject: SSRCommunityobject,
                published_date: "",
                nav_picture: this.props.items[0].images[0].src_big
            });
        }
        if(this.props.data.slides.length > 1) {
            this.initSlideshow(Twenty.core.extendDeep({}, this.props));
        }

    },

    componentDidMount: function() {
        if(!this.hasEvents) {
            this.addEventListeners();
        }
    },

    componentDidUpdate: function(prevProps, prevState) {
        this.handleDefferedImgLoad(prevState.index);
    },

    componentWillUnmount: function() {
        this.removeEventListeners();
    },

    render: function() {
        var className = ["slideshow"],
            sliderWidth = this.state.slides.length * 100 + "%",
            swipeIndicator = this.state.index === 1 && <span className="swipe-indicator bounce-right icon icon-right-open"></span>,
            count = this.state.currentSlide.type !== "ad" && this.state.currentSlide.pagenumber && this.state.slidesLength && `${this.state.currentSlide.pagenumber}/${this.state.slidesTotal} `,
            spanElement,
            paginationBubbles = [],
            slides = this.state.slides.map((slide, i) => {
                if(slide.type === "voting") {
                    return (
                        <li className="slide voting" key={`slide_${i}`}>
                            { typeof window === "object" ?
                                <img className={`img img-${i}`} src="/webapp/img/loadingIndicator.jpg" data-src={this.props.data.initial.image.sources[0].src} />
                                :
                                <img className={`img img-${i}`} src={slide.image.sources[0].src} />
                            }
                            <div className="voting-wrapper">
                                <h5><Twenty.i18n.str textref="slideshow.voteMessage" /></h5>
                                <Twenty.Components.voting voteType="dia" voteId={this.state.id} data={slide.communityObject} />
                            </div>
                        </li>
                    );
                } else if(slide.type === "ad") {
                    return (
                        <li className="slide ad" key={`slide_${i}`}>
                            <Twenty.Components.ad adUnitName={slide.tatm.adUnitName} adserver_url={slide.tatm.adserver_url} key={`slide_${i}`} />
                        </li>
                    );
                } else {
                    return (
                        <li className="slide img" key={`slide_${i}`}>
                            {swipeIndicator}
                            {typeof window === "object" ?
                                <img className={`img img-${i}`} src={slide.image.sources[0].src} />
                                :
                                <img className={`img img-${i}`} src="/webapp/img/loadingIndicator.jpg" data-src={slide.image.sources[0].src} />
                            }
                        </li>
                    );
                }
            }),
            renderHeader = function() {
                if(this.props.mode === "fullscreen") {
                    return (
                        <header>
                            {this.props.slideshowCustomBackButton ?
                                <span className="slideshow-back-button-container" dangerouslySetInnerHTML={{__html: this.props.slideshowCustomBackButton}}></span>
                                :
                                <span className="btn btn-close icon icon-left-open" onClick={this.handleCloseFullscreen}></span>
                            }
                            <h1 className="title">{this.state.title}</h1>
                        </header>
                    );
                } else {
                    return false;
                }
            }.bind(this);
        if(this.props.showIcon) {
            let spanClasses,
                spanText;
            switch(this.state.currentSlide.type) {
                case "link":
                    className.push("zoom");
                    spanClasses = "blog-text";
                    spanText = "Zoom";
                    break;
                case "slideshow":
                    className.push("slide");
                    spanClasses = "icon icon-camera";
                    break;
                case "video":
                    className.push("video");
                    spanClasses = "icon icon-video";
                    break;
            }
            spanElement = <span className={spanClasses}>{spanText}</span>;
        }

        for(let i = 1; i <= this.state.slidesTotal; i++) {
            let classList = "bubble";
            if(i === this.state.index) {
                classList += " active";
            }
            paginationBubbles.push(<span key={"bubbleitem_" + i} onClick={() => this.goToSlide({index: i, transitionClassName: this.props.transitionClassNames})} className={classList}></span>);
        }

        if(this.props.mode === "fullscreen") {
            className.push("fullscreen");
        }
        if(this.state.currentSlide.type === "ad") {
            className.push("ad");
        }

        return (
            <div className={className.join(" ")} ref={ref => {this.slideshowDomNode = ref;}}>
                {renderHeader()}
                <div className="slides-wrapper">
                    <ul className="slides swipeable" style={{width: sliderWidth}} ref={ref => {this.swipeDomNode = ref;}}>
                        {slides}
                        {slides.length <= 0 &&
                            <li className="slide img" key="loading_slide">
                                <img className={"img img-1"} src="/webapp/img/loadingIndicator.jpg" />
                            </li>
                        }
                    </ul>
                </div>
                <div className="description">
                    <span className="count">{count}</span>
                    {this.props.showIcon && spanElement}
                    {this.state.currentSlide.image && this.state.currentSlide.image.caption &&
                        <span className="caption" dangerouslySetInnerHTML={{__html: this.state.currentSlide.image.caption}}></span>
                    }
                    {this.state.currentSlide.image && typeof this.state.currentSlide.image.credit !== "undefined" &&
                        <span className="credit"><Twenty.i18n.str textref="slideshow.creditTitle" />{this.state.currentSlide.image.credit}</span>
                    }
                </div>
                {this.props.pagination &&
                    <div className="pagination">
                        {paginationBubbles}
                    </div>
                }
                {slides.length > 1 &&
                <Twenty.Components.swipe
                    swipeDomNode={this.swipeDomNode}
                    currentSlide={this.state.index}
                    shouldTrack={this.state.shouldTrack}
                    slideWidth={this.slideWidth}
                    move={this.move}
                    transitionClassNames={this.props.transitionClassNames}
                    goToCurrentSlide={this.goToCurrentSlide}
                    goToPrevSlide={this.goToPrevSlide}
                    goToNextSlide={this.goToNextSlide}
                    onSlideTap={this.onSlideTap} />
                }
            </div>
        );
    }
});
