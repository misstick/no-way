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

/*
 * new ScrollerView()
 * 
 *
 * @param {DOMElement} el
 * @param {object} options
 * @return {ScrollerView} this
 */
class ScrollerView extends BaseView {
    constructor(el, options = {}) {
        super(el, options);

        $(window).on('resize', _.debounce(this.resize.bind(this), 500));

        return this;
    }

    /*
     * .render() dispath content
     *
     * @param {String} html
     * @return {ScrollerView} this
     */
    render(html = '') {
        // Move all content into a container
        if (!this._content) {
            $(this.el).html('<div class="scroller"></div>');
            this._content = $('.scroller', this.el);
        }

        // Update content
        let content = this._content;
        if (_.isString(html)) {
            content.html(html)
            this.resize.call(this);
        }

        // Add Navigation for noTouchScreen
        if (!_.is_touch() && this.isScroll()) {
            if (!this.navView) this.navView = new NavView(this.el);
            this.navView.render();
        }

        return this;
    }

    /*
     * .saveGrid() save rows/columns coords
     * the value is a table of CID Models References
     * each `index` is a line, each `value` is a column
     *
     * {Array}value could contain one or several {String}CID
     * it occurs for `landscape` items
     *
     * @param {Array} grid coords
     * @return {ScrollerView} this
     */
    saveGrid(grid = []) {
        this.grid = grid;

        return this;
    }

    /*
     * .isScroll() get horizontal scroll value
     *
     * @return {Boolean} value
     */
    isScroll() {
        return (this.el.get(0).scrollWidth - this.el.get(0).offsetWidth) > 0;
    }

    /*
     * .getColumns() get how many items 
     * could fullfill containerWidth
     *
     * @return {Number} value
     */
    getColumns(length, max) {
        let column = null;
        for (let counter = 1; counter <= max; counter++) {
            if (length % counter == 0) {
                column = counter;
            }
        }

        // Try to catch the more full lines as possible
        if (column == 1 && length > max) {
            for (let counter = max - 2; counter <= max; counter++) {
                const fullRows = Math.trunc(length / counter);
                const lastRow = length - fullRows * counter;
                if (counter - lastRow == 1) {
                    column = counter;
                }
            }
        }
        return column || max;
    }

    /*
     * .getStyles() get CSS for the container
     * It handle vertical/horizontal screen alignement
     *
     * @return {Number} value
     */
    getStyles(item, screen, len) {
        if (!arguments.length) {
            return {
                width: 'auto',
                paddingTop: '0',
            };
        }

        function getTop() {
            const element = this._content;
            const height = element.height() + element.offset().top;
            const top = Math.ceil((screen.height - height) / 2);
            return (top > 0) ? top : 0;
        }

        function getWidth() {
            const maxVisible = Math.ceil(screen.width * 1.5 / item.width);
            const columns = this.getColumns(len, maxVisible);
            return columns * item.width;
        }

        return {
            width: getWidth.call(this),
            paddingTop: getTop.call(this),
        };
    }

    /*
     * .resize() Apply Grid to items
     * Add CSS Layout (size, alignement, background)
     * Fix some spacial case
     *
     * @return {Number} value
     */
    resize() {
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
        grid.forEach((data) => {
            // Item Real Size
            let itemSize = _.clone(itemReferer);

            data.forEach((cid, index) => {
                const item = $(`[data-cid=${cid}]`, this.el);
                const model = _.find(collection.models, function(_model) {
                    return _model.cid == cid;
                });

                if (!index) {
                    const isTween = itemSize.format != 'landscape' && model.format == 'landscape' && data.length == 1;
                    if (isTween) {
                        /*
                         * When there is only 1 'landscape' picture, 
                         * container is twice larger than a "portrait"
                         */

                        /*
                         * @TODO : check that new width isnt too big compared to initial value
                         * This check should be done into (collection) grid.groupByFormat
                         */
                        Object.assign(itemSize, {
                            "width": itemSize.width * 2
                        });
                        ++itemsLength;
                    }
                    if (data.length == 2) {
                        Object.assign(itemSize, {
                            "height": itemSize.height / 2
                        });
                        --itemsLength;
                    }
                }

                // Background Positionning
                let styles = {
                    backgroundSize: '100% auto',
                    height: itemSize.height,
                    width: itemSize.width,
                };
                const height =  model.imgHeight || model.height;
                const width = model.imgWidth || model.width;
                if (height / width < itemSize.height / itemSize.width) {
                    styles['background-size'] = 'auto 100%';
                }
                item.css(styles);
            });
        });

        // Force Content.width to have horizontal alignment
        const styles = this.getStyles(itemReferer, screenSize, itemsLength);
        this._content.css(styles);

        return this;
    }
};

export default ScrollerView;
