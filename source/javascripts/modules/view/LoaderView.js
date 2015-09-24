import BaseView from './BaseView';

class LoaderView extends BaseView {
    constructor(el, options = {}) {
        super(el, options);

        this.on('load:start', this.start.bind(this));
        this.on('load:stop', this.stop.bind(this));
    }

    start() {
        $(this.el).addClass('load');
    }

    stop() {
        $(this.el).removeClass('load');
    }

    getData(el, img) {
        if (!el) {
            return false;
        }
        let content = $(el).html();
        let data = {
            order: el._index,
            width: el.offsetWidth,
            height: el.offsetHeight,
            content: content,
            src: '',
        }
        if (img) {
            Object.assign(data, {
                src: img.src,
                imgWidth: img.offsetWidth,
                imgHeight: img.offsetHeight,
                content: content.replace(/\<img [\s\w\/"'.=_-]*\/{0,1}\>/, ''),
            });
        }
        return data;
    }

    render() {
        const items = Array.from($(this.el).children());

        // End of prec
        this.collection.on('add', _.after(items.length, renderComplete.bind(this)));

        // Load && process content
        this.trigger('load:start');
        items.forEach(renderItem.bind(this));

        function isLoaded(el) {
            return !!el.offsetWidth;
        }

        function isPicture(el) {
            return el.tagName.toLowerCase() == 'img';
        }

        function getPicture(el) {
            return (!isPicture(el)) ? $('img', el).get(0) : el;
        }

        function savePicture(el, img) {
            const data = this.getData(el, img);
            this.collection.add(data);
        };

        function renderItem(el, index) {
            el._index = index;
            const img = getPicture(el);
            if (img && ! isLoaded(img)) {
                img.onload = (event) => savePicture.call(this, el, img);
                return;
            }
            savePicture.call(this, el, img);
        }

        function renderComplete() {
            this.collection.sort();
            this.trigger('load:stop');
            this.collection.off('add', renderComplete);
        };
    }
};

export default LoaderView;
