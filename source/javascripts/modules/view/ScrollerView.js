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
            this.resize.call(this);
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

    getStyles(item, screen, len) {
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
        const grid = this.grid;
        const collection = this.collection;
        const screenSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        const itemReferer = this.collection.getRefererSize(screenSize);

        // Reset container size
        this._content.css(this.getStyles());

        // Resize Grid Items
        let itemsLength = this.collection.getSize();
        _.each(grid, (data) => {
            // Item Real Size
            let _itemSize = _.clone(itemReferer);

            _.each(data, (cid, index) => {
                const item = $('[data-cid=' + cid + ']', this.el);
                const model = _.find(collection.models, function(_model) {
                    return _model.cid == cid;
                });

                if (!index) {
                    var _isTweenItem = _itemSize.format != "landscape" && model.format == "landscape" && data.length == 1;
                    if (_isTweenItem) {
                        // When there is only 1 "landscape" picture, 
                        // container is twice larger than a "portrait"

                        // @TODO : check that new width isnt too big compared to initial value
                        // This check should be done into (collection)grid.groupByFormat
                        Object.assign(_itemSize, {
                            "width": _itemSize.width * 2
                        });
                        ++itemsLength;
                    }
                    if (data.length == 2) {
                        Object.assign(_itemSize, {
                            "height": _itemSize.height / 2
                        });
                        --itemsLength;
                    }
                }

                // Background Positionning
                let _styles = {
                    "background-size": "100% auto",
                    "height": _itemSize.height,
                    "width": _itemSize.width
                };
                const _height =  model.img_height || model.height;
                const _width = model.img_width || model.width;
                if (_height / _width < _itemSize.height / _itemSize.width) {
                    _styles["background-size"] = "auto 100%";
                }
                item.css(_styles);
            });
        });

        // Force Content.width
        // to have horizontal alignment
        const styles = this.getStyles(itemReferer, screenSize, itemsLength);
        this._content.css(styles);
    }
};

export default ScrollerView;
