//Bind Number Keys to Switch to Buffers 1-10 
function define_switch_buffer_key (key, buf_num) { 
    define_key(default_global_keymap, key, function (I) { 
	switch_to_buffer(I.window, I.window.buffers.get_buffer(buf_num)); 
    }); 
} 

for (let i = 0; i < 10; ++i) { 
    define_switch_buffer_key("C-" + String((i+1)%10), i); 
} 

// make M-f and M-b switch to next and previous buffers 
define_key(content_buffer_normal_keymap, "C-up", "buffer-next"); 
define_key(content_buffer_normal_keymap, "C-down", "buffer-previous");

// Use M-f to follow link in new background buffer 
define_key(default_global_keymap, "M-f", "follow-new-buffer-background");
