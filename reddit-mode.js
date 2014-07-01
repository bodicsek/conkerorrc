require("reddit");

interactive("reddit-open-comments-new-buffer",
    "Open the comments-page associated with the currently selected link in a new buffer.",
            reddit_open_comments_new_buffer);

define_key(reddit_keymap, "H", "reddit-open-comments-new-buffer");


