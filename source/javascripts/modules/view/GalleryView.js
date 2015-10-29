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
    const navKey = `collection${ this.props.cid }-nav`;
    const scrollerKey = `collection${ this.props.cid }-scroller`;
    return (
        <div data-type="gallery">
            <NavView {...this.props} key={ navKey } />
            <GalleryView.Scroller {...this.props} key={ scrollerKey } />
        </div>
    );
  }
});

GalleryView.Scroller = React.createClass({
  render: function() {
    const items = ((models) => {
        return models.map((model, indice) => {
            const itemKey = `collection${ this.props.cid }-item${ indice }`;
            return <GalleryView.Item models={ model } key={ itemKey } id={ itemKey } />;
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
    const items = _.map(models, (model, indice) => {
        const className = `image ${model.format}`;
        const subItemKey = `${ this.props.id }-subItem${ indice }`;
        return (
            <div className={ className }
                key={ subItemKey }
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
        this.on('change:props', _.debounce(this.render.bind(this), 200));
        this.collection.on('change', this.update.bind(this));

        // Container
        this.scrollerView = new ScrollerView(this.el, {
            collection: this.collection
        });
        this.scrollerView.on('update', (event, response) => {
            if (!_.isEqual(this.props, response)) {
                // Update ReactViews properties
                Object.assign(this.props, response);
            }
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
        ReactDOM.render(
            <GalleryView {...this.props} />,
            this.el
        );

        this.trigger('complete');

        return this;
    }
};

export default GalleryController;
