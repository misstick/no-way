import BaseCollection from './baseCollection';

const defaultModel = {
    order: 0,
    src: '',
    width: 0,
    height: 0,
    format: "portrait",
}

class GridCollection extends BaseCollection {
    getFormat(data = { width: 0, height: 0}) {
        return (data.width > data.height) ? "landscape" : "portrait";
    }

    getType(data = {}) {
        return (!data.src) ? "text": "picture";
    }

    validate(data, option = {}) {
        data.format = this.getFormat(data);
        data.type = this.getType(data);
        return data;
    }

    groupByFormat(callback) {
        const models = _.clone(this.models);
        const hasPortrait = _.findWhere(models, {format: "portrait"}) || false;
        return _.map(models, (model, index, list) => {
            // Group landscape contents
            if (model.format === "landscape" && hasPortrait) {
                var _list = list.slice(index + 1, list.length);
                var next = _.findWhere(_list, {format: "landscape" });
                if (next) {
                    list.splice(_.indexOf(list, next), 1);
                    return callback([model, next]);
                }
                return callback(model);
            }
            return callback(model);
        });
    }

    getRefererSize(screen_coords = { width: 0, height: 0}) {
        let item0 = null;
        const height_max = Math.ceil(screen_coords.height * 0.85);

        // Get Smaller Item into the grid
        _.each(this.models, (model = {}) => {
            var _height =  model.img_height || model.height;
            var _width = model.img_width || model.width;

            if (!item0) {
                item0 = {
                    height: _height,
                    width: _width
                }
                return;
            }

            if (model.format == "portrait") {
                var _height = model.height;
                var _is_landscape = this.getFormat(item0) === "landscape";
                if (_height < item0.height || _is_landscape) {
                    item0 = {
                        height: _height,
                        width: _width,
                        format: model.format
                    }
                }
            } else {
                var _test_height = item0.width * item0.height * 2 / _width;
                if (_test_height < item0.height) {
                    var _old_height0 = item0.height;
                    item0.height = _height;
                }
            }
        });

        // It should have several rows
        // in one page
        if (item0.height > height_max) {
            item0.width = Math.ceil(item0.width * height_max / item0.height);
            item0.height = height_max;
        }

        return Object.assign(item0, {
            format: this.getFormat(item0)
        });
    }
};

export default GridCollection;
