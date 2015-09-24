let view_counter = 0;

class BaseView {
    constructor(el, options = {}) {
        this.el = el;

        if (options.collection) {
            this.collection = options.collection;
        }

        this.cid = options.cid || 'V' + (++view_counter);
    }

    on(name, func) {
        $(window).on(this.cid + '::' + name, func);
    }

    off(name, func) {
        $(window).off(this.cid + '::' + name, func);
    }

    trigger(name, data = {}) {
        $(window).trigger(this.cid + '::' + name, data);
    }

    destroy() {}
};

export default BaseView;
