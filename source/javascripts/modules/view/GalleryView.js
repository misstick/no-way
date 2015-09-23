import BaseView from './BaseView';
import LoaderView from './LoaderView';
import ScrollerView from './ScrollerView';
import BaseCollection from './../collection/BaseCollection';
import GridCollection from './../collection/GridCollection';

const templateHeader = '<div data-content="<%= type %>">';
const templateContent = '<div class="image <%= format %>" data-cid="<%= cid %>" style="background-image: url(\'<%= src %>\');"><%= content %></div>';
const templateFooter = '</div>';

//
// Handle format: landscape/portrait
// Set pictures close together
// Save picture positions
//

class GalleryView extends BaseView {
    constructor(el, options = {}) {
        super(el, options);

        this.collection = new GridCollection();
        this._fill = this.el.data("fill") || "width";

        // Container size
        this.scrollerView = new ScrollerView(this.el, {
            collection: this.collection
        });

        // Push content into .collection
        this.loaderView = new LoaderView(this.el, {
            collection: this.collection
        });
        this.loaderView.on("load:stop", this.render.bind(this));
        this.loaderView.render.call(this.loaderView);
    }

    render(event, options) {
        const success = _.after(this.collection.getSize(), successCallback.bind(this));

        let _grid = [];
        let _allContent = '';
        console.log("Gallery.Render", this.collection.getSize(), this.collection.models);

        // Transform data into DOM
        this.collection.sortByFormat(renderFormatCallback);

        function renderFormatCallback(data) {
            // it depends of screen size
            // 1 screen height == 2.5 rows
            var content = '';
            var model0 = data;
            
            if (_.isArray(data)) {
                model0 = data[0];
                _.each(data, function(model) {
                    content += _.template(templateContent, model);
                });
            } else {
                content = _.template(templateContent, model0);
            }
            _allContent += _.template(templateHeader, model0) + content + _.template(templateFooter, model0);

            // Save Grid
            var cid = _.isArray(data) ? _.pluck(data, "cid") : [data.cid];
            _grid.push(cid);

            // Change Grid size
            success();
        };

        function successCallback() {
            this.scrollerView.saveGrid(_grid);
            this.scrollerView.render(_allContent);
            this.trigger("render:stop");
        };
    }
};

export default GalleryView;
