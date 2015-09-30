import BaseView from './BaseView';

/*
 * new LoaderView()
 * save data from DOMElements
 * send event at the beginning & the end
 *
 * @param {DOMElement} el
 * @param {object} options
 * @return {LoaderView} this
 */
class LoaderView extends BaseView {
    /*
     * .getData() get data from {DOMElement} container
     * 
     * @param {DOMElement} container element
     * @param {DOMElement} img that belongs to previousElement
     * @return {object} data
     */
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

    /*
     * .render() display getData() && Events
     * 
     * @return {LoaderView} this
     */
    render() {
        const items = Array.from($(this.el).children());

        // End of prec
        const addCallback = _.after(items.length, renderComplete.bind(this));
        this.collection.on('add', addCallback);

        // Load && process content
        this.trigger('start');
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
            this.collection.off('add', addCallback);
            this.collection.sort();
        };

        return this;
    }
};

export default LoaderView;
