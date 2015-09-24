import BaseView from './BaseView';
import LoaderView from './LoaderView';
import ScrollerView from './ScrollerView';
import BaseCollection from './../collection/BaseCollection';
import GridCollection from './../collection/GridCollection';

/*
 * Main View
 * Save data into a Collection,
 * Re-order items, save it into an Array (Grid),
 * Apply new order to DOMElements,
 *
 * @param {DOMElement} el
 * @param {object} options
 * @return {GalleryView} this
 */

class GalleryView extends BaseView {
    constructor(el, options = {}) {
        super(el, options);

        this.collection = new GridCollection();
        this._fill = this.el.data('fill') || 'width';

        // Container
        this.scrollerView = new ScrollerView(this.el, {
            collection: this.collection
        });

        // Save data from DOM
        this.loaderView = new LoaderView(this.el, {
            collection: this.collection
        });
        this.loaderView.on('load:stop', this.render.bind(this));
        this.loaderView.render.call(this.loaderView);

        return this;
    }

    render() {
        let html = '';
        let coords = [];
        let type = null;

        // Group landscape pictures together
        const success = _.after(this.collection.getSize(), successCallback.bind(this));
        this.collection.groupByFormat(renderCallback.bind(this));

        function renderCallback(data = {}) {
            html += `<div data-content="${getType(data)}">${getContent(data)}</div>`;

            // Save grid coords
            coords.push(getCoords(data));

            // Update other views
            success({ 
                responseText: html, 
                coords: coords,
            });
        };

        function getCoords(data) {
            return _.isArray(data) ? _.pluck(data, 'cid') : [data.cid];
        }

        function getType(data) {
            const model = _.isArray(data) ? data[0] : data;
            return model.type;
        }

        function getContent(data) {
            if (_.isArray(data)) {
                return data.map((model) => {
                    return getContent(model);
                }).join("");
            }
            return `<div class="image ${data.format}" data-cid="${data.cid}" style="background-image: url('${data.src}');">${data.content}</div>`;
        }

        function successCallback(response) {
            this.scrollerView.saveGrid(response.coords);
            this.scrollerView.render(response.responseText);
            this.trigger('render:stop');
        };

        return this;
    }
};

export default GalleryView;
