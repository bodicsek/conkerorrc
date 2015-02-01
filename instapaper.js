function iprl5 (document) {
    var d=document,
        z=d.createElement('scr'+'ipt'),
        b=d.body,
        l=d.location;
    try {
        if (!b) throw(0);
        d.title='(Saving...) '+d.title;
        z.setAttribute('src',l.protocol+'//www.instapaper.com/j/itcrB6N9fa0i?a=read-later&u='+encodeURIComponent(l.href)+'&t='+(new Date().getTime()));
        b.appendChild(z);
    } catch(e) {
        alert('Please wait until the page has loaded.');
    }
}

interactive("instapaper", "Send the current page to InstaPaper.",
            function (I) {
                iprl5(I.buffer.document);
            }
           );

define_key(default_global_keymap, "C-x i", "instapaper");

function iptxt (document) {
    var d=document;
    try {
        if (!d.body) throw(0);
        d.location.href='http://www.instapaper.com/text?u='+encodeURIComponent(d.location.href);
    } catch(e) {
        alert('Please wait until the page has loaded.');
    }
}


interactive("instapaper-text", "InstaPaper text view.",
            function (I) {
                iptxt(I.buffer.document);
            }
           );

define_key(default_global_keymap, "C-x I", "instapaper-text");
