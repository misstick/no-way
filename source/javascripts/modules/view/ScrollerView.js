import BaseView from './BaseView';
import NavView from './NavView';

// TODO : renommer

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

        ['_grid', '_screen'].forEach((name) => {
            this.on(`change:${name}`, (event, changes) => {
                this.update.call(this);
            });
        });

        $(window).on('resize', _.debounce(this.setScreenSize.bind(this), 500));

        return this;
    }

    /*
     * .getColumns() get how many items 
     * could fullfill containerWidth
     *
     * @return {Number} value
     */
    getColumns(max) {
        const length = (this.getGrid() || []).length;
        let column = null;

        for (let counter = 1; counter <= max; counter++) {
            if (length % counter == 0) {
                column = counter;
            }
        }

        // Try to catch the more fulllines as possible
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
     * .getOffset() get CSS for the container
     * It handle vertical/horizontal screen alignement
     *
     * @return {Number} value
     */
    getOffset(item) {
        if (!arguments.length) {
            return {
                width: 'auto',
                paddingTop: '0',
            };
        }

        const screen = this.getScreenSize();

        function getTop() {
            const height = $(this.el).height() + $(this.el).offset().top;
            const top = Math.ceil((screen.height - height) / 2);
            return (top > 0) ? top : 0;
        }

        function getWidth() {
            const maxVisible = Math.ceil(screen.width * 1.5 / item.width);
            const columns = this.getColumns(maxVisible);
            return columns * item.width;
        }

        return {
            width: getWidth.call(this),
            paddingTop: getTop.call(this),
        };
    }

    setGrid(array = []) {
        this._grid = array.map((model) => {
            return _.isArray(model) ? model : [model];
        });

        return this;
    }

    getGrid() {
        return this._grid;
    }

    setScreenSize() {  
        this._screen = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        return this;
    }

    getScreenSize() {
        if (!this._screen) this.setScreenSize();
        return this._screen;
    }

    /*
     * .update()
     * Define CSS with new Grid layout
     * Fix some spacial case
     *
     * @return {ScrollerView} this
     */
    update() {
        const grid = this.getGrid();
        const screenSize = this.getScreenSize();
        const itemSize = this.collection.getItemSize(screenSize);
        const isPortrait = itemSize.height >= itemSize.width;
        const models = grid.map((_models) => {
            return _models.map((model, index) => {
                let styles = _.clone(itemSize);

                if (model.format === 'landscape') {
                    /*
                     * When there is only one 'landscape' picture, 
                     * container must be twice bigger than a "portrait"
                     */
                    const isLonelyLandscape = isPortrait && _models.length === 1;
                    if (isLonelyLandscape) {
                        Object.assign(styles, {
                            width: styles.width * 2,
                        });
                    }

                    /*
                     * When there are 2 landscape in the same item, 
                     * height must be half smaller
                     */
                    if (_models.length === 2) {
                        Object.assign(styles, {
                            height: styles.height / 2,
                        });
                    }
                }

                // Background alignment into its container
                Object.assign(styles, {
                    backgroundImage: `url(${ model.src })`,
                    backgroundSize: isFullFill(model, styles) ? '100% auto' : 'auto 100%',
                });

                return Object.assign(_.clone(model), { styles: styles });
            });
        });
        
        this.trigger('update', {
            models: models,
            styles: this.getOffset(itemSize), 
        });

        function isFullFill(model, itemSize) {
            const imgHeight =  model.imgHeight || model.height;
            const imgWidth = model.imgWidth || model.width;
            return imgHeight / imgWidth >= itemSize.height / itemSize.width;
        }
        return this;
    }
};

export default ScrollerView;
