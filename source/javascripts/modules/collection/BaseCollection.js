const defaultModel = {
    order: 0,
};

let viewCounter = 0;

class BaseCollection {
    constructor(data = null) {
        this.models = [];
        this.cid = "C" + (++viewCounter);

        if (data) {
            this.add(data);
        }
    }

    add(data, options = {}) {
        if (!data) return;

        // Multiple data : Recursive call
        if (_.isArray(data)) {
            data.forEach((model) => {
                this.add(model);
            });
            return;
        }
        let model = _.clone(defaultModel);
        model = Object.assign(model, data);
        model = this.validate(model, options);
        if (model) {
            model.cid = this.cid + this.getSize();
            this.models.push(model);
            this.trigger("add", model);
        }
    }

    validate(data) {
        return data;
    }

    sort() {
        this.models = _.sortBy(this.models, function(model) {
            return model.order;
        });
    }

    get(index) {
        return this.models[index];
    }

    getSize() {
        return this.models.length;
    }

    reset() {
        this.models = []
    }

    on(name, func = null) {
        $(window).on(this.cid + "::" + name, func);
    }

    off(name, func = null) {
        $(window).off(this.cid + "::" + name, func || null);
    }

    trigger(name, data = {}) {
        $(window).trigger(this.cid + "::" + name, data);
    }

    remove() {
        this.reset();
        this.off("add");
        delete this;
    }
};

export default BaseCollection;
