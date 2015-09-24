import BaseView from './BaseView';

const pathContent = '[data-view="scroll_nav "]';
const template = '<nav data-view="scroll_nav"><button data-action="back"><button data-action="next"></nav>';

_.mixin({
    create_affix(el) {
        const coords = el.offset();
        if (!coords.top) el.addClass('affix');
        else el.affix({ offset: coords});
    }
});

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
    }

    // @TEST : Navigation bar should exist
    // on nonetouch resolutions
    render() {
        // Show / Hide buttons
        const data = this.getData(this.el.get(0));
        $('[data-action=next]')[(data.scrollLeft === data.right) ? 'addClass' : 'removeClass']('disabled');
        $('[data-action=back]')[(data.scrollLeft === data.left) ? 'addClass' : 'removeClass']('disabled');
    }

    getData(el) {
        return {
            left: 0, 
            right: el.scrollWidth - el.offsetWidth,
            scrollLeft: el.scrollLeft,
        }
    }

    goto(event) {
        const target = event.currentTarget;
        const action = $(target).data('action');
        const step = this.el.width() / 2;
        const value = (action === 'next') ? this.el.get(0).scrollLeft + step : this.el.get(0).scrollLeft - step;

        // Animation
        this.el.animate({ scrollLeft: value}, { complete: display_buttons});
    }
};

export default NavView;
