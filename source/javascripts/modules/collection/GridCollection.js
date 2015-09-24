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

    groupByFormat(callback) {
        const models = _.clone(this.models);
        const hasPortrait = _.findWhere(models, {format: 'portrait'}) || false;
        return models.map((model, index, _models) => {
            // Group landscape contents
            if (model.format === 'landscape' && hasPortrait) {
                const __models = _models.slice(index + 1, _models.length);
                const next = _.findWhere(__models, { format: 'landscape' });
                if (next) {
                    _models.splice(_.indexOf(_models, next), 1);
                    return callback([model, next]);
                }
                return callback(model);
            }
            return callback(model);
        });
    }

    getRefererSize(screenCoords = { width: 0, height: 0}) {
        let item0 = null;
        const heightMax = Math.ceil(screenCoords.height * 0.85);

        // Get Smaller Item into the grid
        this.models.forEach((model = {}) => {
            let height =  model.imgHeight || model.height;
            let width = model.imgWidth || model.width;

            // Default value
            if (!item0) {
                item0 = {
                    height: height,
                    width: width,
                }
                return;
            }

            // Find a shorter value
            if (model.format == 'portrait') {
                height = model.height;
                const isLandscape = this.getFormat(item0) === 'landscape';
                if (height < item0.height || isLandscape) {
                    item0 = {
                        height: height,
                        width: width,
                        format: model.format,
                    }
                }
            } else {
                const testHeight = item0.width * item0.height * 2 / width;
                if (testHeight < item0.height) {
                    item0.height = height;
                }
            }
        });

        // It should have several rows
        // in one page
        if (item0.height > heightMax) {
            item0.width = Math.ceil(item0.width * heightMax / item0.height);
            item0.height = heightMax;
        }

        return Object.assign(item0, {
            format: this.getFormat(item0),
        });
    }
};

export default GridCollection;
