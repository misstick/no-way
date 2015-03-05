(function(baseCollection) {

    var NAMESPACE = "grid";

    var GridCollection = function(data) {
        baseCollection.apply(this, arguments);
    }
    
    GridCollection.prototype = Object.create(baseCollection.prototype);
    
    _.extend(GridCollection.prototype, {
        
        defaults: {
            order: 0,
            src: null,
            width: 0,
            height: 0,
            format: "portrait"
        },
        
        get_format: function(data) {
            return (data.width > data.height) ? "landscape" : "portrait";
        },
        
        validate: function(data, options) {
            // Use "landscape" format only when the DOM is only a picture
            if (this.is_picture(data)) {
                data.format = this.get_format(data);
            }
            data.type = (!data.src) ? "text": "picture";
            return data;
        },
        
        sort_by_format: function(callback) {
            
            var models = _.clone(this.models);
            
            var is_portrait = _.findWhere(models, {format: "portrait"}) || false;

            var callback = callback || function(data) { return data; };
            return _.map(models, function(model, index, list) {
                if (model.format == "landscape" && is_portrait) {
                    var _list = list.slice(index + 1, list.length);
                    var next = _.findWhere(_list, {format: "landscape"});
                    if (next) {
                        list.splice(_.indexOf(list, next), 1);
                        return callback([model, next]);
                    }
                    return callback(model);
                }
                
                return callback(model);
            });
        },
        
        is_picture: function(data) {
            return data.__is_picture || false;
        },
        
        
        get_grid_ref: function(screen_coords) {
            
            var item0 = null;
            // var height_max = Math.ceil(screen_coords.height / 1.5);
            
            // Get Smaller Item into the grid
            _.each(this.models, function(model) {
                
                if (!item0) {
                    item0 = {
                        height: model.height,
                        width: model.width
                    }
                    return;
                }
                
                if (model.format == "portrait") {

                    var _height = model.height;
                    var _is_landscape = this.get_format(item0) === "landscape";
                    if (_height < item0.height || _is_landscape) {
                        item0 = {
                            height: model.height,
                            width: model.width,
                            format: model.format
                        }
                    }
                } else {

                    var _height = item0.width * item0.height * 2 / model.width;
                    if (_height < item0.height) {
                        var _old_height0 = item0.height;
                        item0.height = model.height;
                    }
                }
            }.bind(this));
            
            // // It should have several rows
            // // in one page
            // if (height0 > height_max) {
            //     height0 = height_max;
            // }
            
            return _.extend(item0, {
                format: this.get_format(item0)
            });
        }
    });

    _COLLECTION[NAMESPACE]  = GridCollection;
})(_COLLECTION["base"]);