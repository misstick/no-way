import BaseCollection from './baseCollection';

const defaultModel = {
    order: 0,
    src: '',
    width: 0,
    height: 0,
    format: 'portrait',
}

class GridCollection extends BaseCollection {
    getFormat(data = { width: 0, height: 0}) {
        return (data.width > data.height) ? 'landscape' : 'portrait';
    }

    getType(data = {}) {
        return (!data.src) ? 'text': 'picture';
    }

    validate(data, option = {}) {
        data.format = this.getFormat(data);
        data.type = this.getType(data);
        return data;
    }

    groupByFormat(callback = function (model) { return model; }) {
        const models = _.clone(this.models);
        const hasPortrait = !!_.findWhere(models, {format: 'portrait'}) || false;
        const items = models.map((model, index, _models) => {
            // Group landscape contents
            if (model.format === 'landscape' && hasPortrait) {
                const __models = _models.slice(index + 1, _models.length);
                const next = _.findWhere(__models, { format: 'landscape' });
                if (next) {
                    _models.splice(_.indexOf(_models, next), 1);
                    return callback([model, next], index, _models);
                }
                return callback(model, index, _models);
            }
            return callback(model, index, _models);
        });
        // Remove references to removed index
        return _.compact(items);
    }

    getItemSize(screenCoords) {
        let item0 = null;
        const heightMax = Math.ceil(screenCoords.height * 0.85);

        // Get smaller item into the grid
        this.models.forEach((model = {}) => {
            let height =  model.imgHeight || model.height;
            let width = model.imgWidth || model.width;

            // Default coords
            if (!item0) {
                item0 = {
                    height: height,
                    width: width,
                }
                return;
            }

            // Find smaller coords
            if (model.format == 'portrait') {
                height = model.height;
                const isLandscape = this.getFormat(item0) === 'landscape';
                if (height < item0.height || isLandscape) {
                    item0 = {
                        height: height,
                        width: width,
                    }
                }
            } else {
                const testHeight = item0.width * item0.height * 2 / width;
                if (testHeight < item0.height) {
                    item0.height = height;
                }
            }
        });

        // Coords should be smaller than screen size
        if (item0.height > heightMax) {
            item0.width = Math.ceil(item0.width * heightMax / item0.height);
            item0.height = heightMax;
        }

        return item0;
    }
};

export default GridCollection;
