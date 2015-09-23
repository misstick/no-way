import BaseView from './BaseView';
import NavView from './NavView';

_.mixin({
    is_touch() {
        /* Modernizr 2.6.2 (Custom Build) | MIT & BSD
        * Build: http://modernizr.com/download/#-touch-shiv-cssclasses-teststyles-prefixes-load
        */
        return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
    }
});

class ScrollerView extends BaseView {
    constructor(el, options = {}) {
        super(el, options);

        $(window).on("resize", _.debounce(this.resize.bind(this), 500));
    }

    render(html = '') {
        if (!this._content) {
            $(this.el).html("<div class=scroller></div>");
            this._content = $(".scroller", this.el);
        }

        let content = this._content;
        if (_.isString(html)) {
            // Append new HTML
            content.html(html)

            // Display columns && rows
            this.resize();
        }

        if (!_.is_touch() && this.scroll_value()) {
            if (!this.navView) this.navView = new NavView(this.el);
            this.navView.render();
        }
    }

    saveGrid(grid = {}) {
        this.grid = grid;
    }

    scroll_value() {
        return (this.el.get(0).scrollWidth - this.el.get(0).offsetWidth) > 0;
    }

    // Get full lines
    columns(len, max) {
        var column = null;
        for (var counter=1; counter <= max; counter++) {
            if (len % counter == 0) {
                column = counter;
            }
        }

        // Try to catch the more full lines as possible
        if (column == 1 && len > max) {
            for (var counter=max - 2; counter <= max; counter++) {
                var _full_rows = Math.trunc(len / counter);
                var _last_row_items = len - _full_rows * counter;
                if (counter - _last_row_items == 1) {
                    column = counter;
                }
            }
        }
        return column || column_max;
    }

    top(item, screen) {
        const _content = this._content;
        const _value = _content.height() + _content.offset().top;
        const value = Math.ceil((screen.height - _value) / 2);
        return (value > 0) ? value : 0;
    }

    width(item, screen, len) {
        const columns_max_visible = Math.ceil(screen.width * 1.5 / item.width);
        const columns = this.columns(len, columns_max_visible);

        // var rows_min = Math.ceil(screen.height / item.height);
        // var rows = Math.ceil(len / columns);

        return columns * item.width;
    }

    styles(item, screen, len) {
        if (!arguments.length) {
            return {
                "width": "auto",
                "padding-top": "0",
            };
        }
        return {
            "width": this.width(item, screen, len),
            "padding-top": this.top(item, screen, len),
        };
    }

    resize() {
        // Grid is a table with CID references
        // of models of collection
        const content = this._content;
        const grid = this.grid;
        const collection = this.collection;

        // Remove Previous resize
        const _default_styles = this.styles();
        content.css(_default_styles);

        var screen_size = {
            "width": window.innerWidth,
            "height": window.innerHeight
        };
        var item_ref_size = collection.getRefererSize(screen_size);
        var items_len = this.collection.getSize();

        // Resize Grid Items
        _.each(grid, (data) => {
            // Item Real Size
            const _item_size = _.clone(item_ref_size);

            _.each(data, (cid, index) => {
                const item = $('[data-cid=' + cid + ']', this.el);
                const model = _.find(collection.models, function(_model) {
                    return _model.cid == cid;
                });

                if (!index) {
                    var _is_twice_item = _item_size.format != "landscape" && model.format == "landscape" && data.length == 1;
                    if (_is_twice_item) {
                        // When there is only 1 "landscape" picture, 
                        // container is twice larger than a "portrait"

                        // @TODO : check that new width isnt too big compared to initial value
                        // This check should be done into (collection)grid.sortByFormat
                        _.extend(_item_size, {
                            "width": _item_size.width * 2
                        });
                        ++items_len;
                    }
                    if (data.length == 2) {
                        _.extend(_item_size, {
                            "height": _item_size.height / 2
                        });
                        --items_len;
                    }
                }

                // Background Positionning
                const _styles = {
                    "background-size": "100% auto",
                    "height": _item_size.height,
                    "width": _item_size.width
                };
                const _height =  model.img_height || model.height;
                const _width = model.img_width || model.width;
                if (_height / _width < _item_size.height / _item_size.width) {
                    _styles["background-size"] = "auto 100%";
                }
                item.css(_styles);
            });
        });

        // Force Content.width
        // to have horizontal alignment
        const _styles = this.styles(item_ref_size, screen_size, items_len);
        content.css(_styles);
    }
};

export default ScrollerView;
