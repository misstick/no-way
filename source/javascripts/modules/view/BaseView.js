let view_counter = 0;

class BaseView {
    constructor(el, options = {}) {
        this.el = el;

        if (options.collection) {
            this.collection = options.collection;
        }

        this.cid = options.cid || `V${++view_counter}`;

        // Listen to each property/method changes
        Object.observe(this, (changes) => {
            changes.forEach((change) => {
                this.trigger(`change:${change.name}`, change);
            });
        });

        return this;
    }

    on(name, func) {
        $(window).on(`${this.cid}::${name}`, func);

        return this;
    }

    off(name, func) {
        $(window).off(`${this.cid}::${name}`, func);

        return this;
    }

    trigger(name, data = {}) {
        $(window).trigger(`${this.cid}::${name}`, data);

        return this;
    }

    destroy() {
        return this;
    }
};

export default BaseView;
