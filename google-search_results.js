require("google-search-results");
google_search_bind_number_shortcuts();

// Bind the "n" key to the next page link, the "p" key to the previous-page link
// note: works only if the display language is english
define_key(google_search_results_keymap, "n", "follow", $browser_object = browser_object_relationship_next);
define_key(google_search_results_keymap, "p", "follow", $browser_object = browser_object_relationship_previous);
