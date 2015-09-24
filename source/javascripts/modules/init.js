import GalleryView from './view/GalleryView';

'use strict';

// Create Gallery View
$('[data-type=gallery]').each(function(index, item) {
    let view = new GalleryView($(item));
    view.on('render:finished', () => {
        displayLinks();
        setEllipsis(this);
    });
});

// Write contact email
let email =  $('footer .email');
if (email.get(0)) {
    const parent = email.get(0).parentNode;
    const value = email.html().replace('[AT]', '@').replace('[DOT]', '.');
    email.remove();
    $(parent).html(`<a href="mailto:${value}">${$(parent).html()}</a>`);
}

// Transform all gallery items into a single link
function displayLinks() {
    $('[data-type=gallery] .image').each(function(index, item) {
        const link = $('a', item.parentNode);
        if (!link.get(0)) return;

        item = $(item);
        item.addClass('clickable');
        item.data('href', link.attr('href'));
        item.on('click', goto_article);
    });

    function goto_article(event) {
        let el = event.currentTarget;
        window.location = $(el).data('href');
    }
}

// Shortten items description
function setEllipsis(el) {
    $('[data-content=text] .content', el).each((index, item) => {
        const className = 'ellipsis';
        const test = (item.scrollHeight > item.offsetHeight);
        $(item)[test ? 'addClass' : 'removeClass'](className);

        // @TODO : add a height to .content not to crop a text in half height line

        createLink(item);
    });
    
    // Set description as a link
    function createLink(el) {
        if (el.tagName.toLowerCase() === 'A') return;

        const url = $('h2 a', el.parentNode).first().attr('href');
        $(el.parentNode).append(`<a href="${url}" class="${el.className}">`);

        // Remove linked Children
        $('a', el).each((index, item) => {
            const text = $(item).html();
            $(item).after(text);
            item.remove();
        });

        // Create Link Element
        let link = $('a.content', el.parentNode);
        link.html($(el).html());
        $(el).remove();
    }
};
