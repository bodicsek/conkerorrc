function diigo_add (minibuffer, buffer) {
    var url = buffer.document.location;
    var title = buffer.document.title + " | " + url;
    var desc = buffer.document.getSelection ? buffer.document.getSelection() : buffer.document.selection.createRange().text;
    load_url_in_new_buffer('https://www.diigo.com/post?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc)+'&client=simplelet#main','_blank','menubar=no,height=580,width=608,toolbar=no,scrollbars=no,status=no');('https://www.diigo.com/post?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc)+'&client=simplelet#main','_blank','menubar=no,height=580,width=608,toolbar=no,scrollbars=no,status=no');
    minibuffer.message("Adding to diigo: " + title);
}

interactive("diigo_add",
	    "tries to add the current buffer's url to diigo",
	    function (I) {
		diigo_add(I.minibuffer, I.buffer);
	    });
