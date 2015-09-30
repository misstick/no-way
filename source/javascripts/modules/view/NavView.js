import BaseView from './BaseView';

const pathContent = '[data-view="scroll_nav "]';
const template = '<nav data-view="scroll_nav"><button data-action="back"><button data-action="next"></nav>';

_.mixin({
    is_touch() {
        /* Modernizr 2.6.2 (Custom Build) | MIT & BSD
        * Build: http://modernizr.com/download/#-touch-shiv-cssclasses-teststyles-prefixes-load
        */
        return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
    },
    create_affix(el) {
        const coords = el.offset();
        if (!coords.top) el.addClass('affix');
        else el.affix({ offset: coords});
    },
});

//    /*
//     * .isScroll() get horizontal scroll value
//     *
//     * @return {Boolean} value
//     */
//    isScroll() {
//        return (this.el.scrollWidth - this.el.offsetWidth) > 0;
//    }

/*
 * new NavView()
 * handle horizontal scroll
 * for noTouchScreen
 *
 * @param {DOMElement} el
 * @param {object} options
 * @return {NavView} this
 */
class NavView extends BaseView {
    constructor(el, options = {}) {
        super(el, options);

        if (!$(pathContent, this.el).get(0)) {
            // Add Navigation Template
            this.el.append(template);
            _.create_affix($('nav', this.el));
        }

        // Handle Click Event
        $(`${pathContent} button`, this.el).on('click', this.goto.bind(this));
        
        // Handle Scroll Event
        $(this.el).on('scroll', _.debounce(this.render.bind(this), 500));

        return this;
    }

//    /*
//     * .render() Nav should be visible 
//     * only for noTouchScreen
//     *
//     * @test Navigation bar should exist
//     * on nonetouch resolutions
//     *
//     * @return {NavView} this
//     */
//    render() {
//        // Show / Hide buttons
//        const data = this.getData(this.el.get(0));
//        $('[data-action=next]')[(data.scrollLeft === data.right) ? 'addClass' : 'removeClass']('disabled');
//        $('[data-action=back]')[(data.scrollLeft === data.left) ? 'addClass' : 'removeClass']('disabled');
//
//        return this;
//    }

    /*
     * .getData() get data from {DOMElement} container
     * 
     * @param {DOMElement} container element
     * @param {DOMElement} img that belongs to previousElement
     * @return {object} data
     */
    getData(el) {
        return {
            left: 0, 
            right: el.scrollWidth - el.offsetWidth,
            scrollLeft: el.scrollLeft,
        }
    }

    /*
     * .goto() go next/back on horizontal axes
     * 
     * @param {Event} event object
     * @return {NavView} this
     */
    goto(event) {
        const target = event.currentTarget;
        const action = $(target).data('action');
        const step = this.el.width() / 2;
        const value = (action === 'next') ? this.el.get(0).scrollLeft + step : this.el.get(0).scrollLeft - step;

        // Animation
        this.el.animate({ scrollLeft: value}, { complete: display_buttons});

        return this;
    }
};

export default NavView;
