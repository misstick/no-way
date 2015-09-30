import BaseView from './BaseView';
import LoaderView from './LoaderView';
import ScrollerView from './ScrollerView';
import BaseCollection from './../collection/BaseCollection';
import GridCollection from './../collection/GridCollection';

/*
 * TODO : transform BaseView into baseController
 * Remove all references to DOM
 * Use events/callback to send Data mainView
 * Rename files & move files from 'view/' to 'controller/'
 */

/*
 * TODO : define state
 * to update ReactViews insteadof 
 * overwrite them eachtime
 */

var NavView = React.createClass({
  render: function() {
    return (
        <nav>
            <button data-action="back" />
            <button data-action="next" />
        </nav>
    );
  }
});

var GalleryView = React.createClass({
  render: function() {
    return (
        <div data-type="gallery">
            <NavView {...this.props} />
            <GalleryView.Scroller {...this.props} />
        </div>
    );
  }
});

GalleryView.Scroller = React.createClass({
  render: function() {
    const items = ((models) => {
        return models.map((model) => {
            return <GalleryView.Item models={ model } />;
        });
    })(this.props.models);

    return (
        <div className="scroller" style={ this.props.styles }>
            { items }
        </div>
    );
  }
});

GalleryView.Item = React.createClass({
  render: function() {
    const models = this.props.models;
    const type = _.pluck(models, 'type')[0];
    const items = _.map(models, (model) => {
        const className = `image ${model.format}`;
        return (
            <div className={ className } 
                data-cid={ model.cid } 
                style={ model.styles }
                dangerouslySetInnerHTML={{__html: model.content}} >
            </div>
        );
    });

    return (
        <div data-content={ type }>
            { items }
        </div>
    );
  }
});

/*
 * Main View
 * Save data into a Collection,
 * Re-order items, save it into an Array (Grid),
 * Apply new order to DOMElements,
 *
 * @param {DOMElement} el
 * @param {object} options
 * @return {GalleryController} this
 */
class GalleryController extends BaseView {
    constructor(el, options = {}) {
        super(el, options);

        this.collection = new GridCollection();

        // Dispatch events
        this.on('change:_props', this.render.bind(this));
        this.on('change:collection', this.update.bind(this));

        // Container
        this.scrollerView = new ScrollerView(this.el, {
            collection: this.collection
        });
        this.scrollerView.on('update', (event, response) => {
            // Update ReactViews properties
            this._props = response;
        });

        // Save data from DOM
        this.loaderView = new LoaderView(this.el, {
            collection: this.collection
        });
        this.loaderView.on('start', () => {
            $(this.el).addClass('load');
        });
        this.loaderView.on('complete', () => {
            $(this.el).addClass('load');
        });
        this.loaderView.render();

        return this;
    }

    update() {
        // Group landscape pictures together
        const items = this.collection.groupByFormat();
        this.scrollerView.setGrid(items);

        return this;
    }

    render() {
        React.render(
            <GalleryView {...this._props} />,
            this.el
        );

        this.trigger('complete');

        return this;
    }
};

export default GalleryController;
