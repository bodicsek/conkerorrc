var Keepass2 = function () {

    "use strict";

    var storageKeyAes = "keepass2Key";
    var storageKeyId  = "keepass2Id";

    var LocalStorage = function () {

        var _invalidValue = "no data";

        function open() {
            var url = "http://keepass2.conkeror.com";
            var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
            var ssm = Components.classes["@mozilla.org/scriptsecuritymanager;1"].getService(Components.interfaces.nsIScriptSecurityManager);
            var dsm = Components.classes["@mozilla.org/dom/storagemanager;1"].getService(Components.interfaces.nsIDOMStorageManager);

            var uri = ios.newURI(url, "", null);
            var principal = ssm.getCodebasePrincipal(uri);
            return dsm.getLocalStorageForPrincipal(principal, "");
        }

        return {

            invalidValue : _invalidValue,

            store : function (key, value) {
                var db = open();
                if (db !== null) {
                    db.setItem(key, value);
                }
            },

            retrieve : function (key) {
                var db = open();
                if (db !== null) {
                    var value = db.getItem(key);
                    if (value !== null) {
                        return value;
                    }
                    return _invalidValue;
                }
                return _invalidValue;
            },

            remove : function (key) {
                var db = open();
                if (db !== null) {
                    db.removeItem(key);
                }
            }

        };
    }();

    function generateKey() {
        var iv = [];
        for (var i = 0; i < 32; i++) {
            iv.push(String.fromCharCode(Math.floor(Math.random() * 256)));
        }
        iv = iv.join('');
        return btoa(iv);
    }

    function retrieveKey() {
        var key = LocalStorage.retrieve(storageKeyAes);
        if (LocalStorage.invalidValue === key) {
            key = generateKey();
            LocalStorage.store(storageKeyAes, key);
        }
        return key;
    }

    function retrieveId() {
        return LocalStorage.retrieve(storageKeyId);
    }

    function storeId(id) {
        LocalStorage.store(storageKeyId, id);
    }

    function generateIv() {
        var iv = [];
        for (var i = 0; i < 16; i++) {
            iv.push(String.fromCharCode(Math.floor(Math.random() * 256)));
        }
        iv = iv.join('');
        return btoa(iv);
    }

    function encrypt(data, iv) {
        var enc = sjcl.mode.cbc.encrypt(
            new sjcl.cipher.aes(sjcl.codec.base64.toBits(retrieveKey())),
            sjcl.codec.utf8String.toBits(data),
            sjcl.codec.base64.toBits(iv));
        return sjcl.codec.base64.fromBits(enc);
    }

    function decrypt(data, iv) {
        var dec = sjcl.mode.cbc.decrypt(
            new sjcl.cipher.aes(sjcl.codec.base64.toBits(retrieveKey())),
            sjcl.codec.base64.toBits(data),
            sjcl.codec.base64.toBits(iv));
        return sjcl.codec.utf8String.fromBits(dec);
    }

    function createBaseRequest(requestType) {
        var request = {};
        request.RequestType = requestType;
        request.Id = retrieveId();
        var iv = generateIv();
        request.Nonce = iv;
        request.Verifier = encrypt(iv, iv);
        return request;
    }

    function sendRequest(req, callback) {
        var Xhr = {
            request: function (method, request) {
                var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) {
                        callback(xhr.responseText);
                    }
                };
                xhr.open(method, "http://localhost:19455", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(request);
            },
            post: function (request) {
                this.request("POST", request);
            }
        };

        Xhr.post(JSON.stringify(req));
    }

    function applyTextByName(document, name, text) {
        var result = document.getElementsByName(name);
        if (result !== null && result.length !== 0) {
            for (var i = 0; i < result.length; i++) {
                result.item(i).value = text;
            }
            return true;
        }
        return false;
    }

    function applyLogin(document, login) {
        return (applyTextByName(document, "felhasznaloNev", login) ||
                applyTextByName(document, "log_email", login) ||
                applyTextByName(document, "session_key", login) ||
                applyTextByName(document, "username", login) ||
                applyTextByName(document, "userid", login) ||
                applyTextByName(document, "login", login) ||
                applyTextByName(document, "login_email", login) ||
                applyTextByName(document, "email", login) ||
                applyTextByName(document, "session[username_or_email]", login));
    }

    function applyPassword(document, password) {
        return (applyTextByName(document, "jelszo", password) ||
                applyTextByName(document, "login_password", password) ||
                applyTextByName(document, "log_password", password) ||
                applyTextByName(document, "session_password", password) ||
                applyTextByName(document, "pass", password) ||
                applyTextByName(document, "password", password) ||
                applyTextByName(document, "session[password]", password));
    }

    return {

        connect : function (success, error) {
            var req = createBaseRequest("test-associate");
            sendRequest(req, function(r) {
                var resp = JSON.parse(r);
                if (! resp.Success) {
                    req.RequestType = "associate";
                    req.Key = retrieveKey();
                    sendRequest(req, function(r1) {
                        var resp1 = JSON.parse(r1);
                        if (! resp1.Success) {
                            error();
                        } else {
                            storeId(resp1.Id);
                            success();
                        }
                    });
                } else {
                    success();
                }
            });
        },

        getLogins : function (url, success, error) {
            var req = createBaseRequest("get-logins");
            req.Url = encrypt(url, req.Nonce);
            sendRequest(req, function(r) {
                var resp = JSON.parse(r);
                if(resp.Success && resp.Entries.length !== 0) {
                    var decryptedEntries = _.map(resp.Entries, function(entry) { 
                        var decryptedEntry = {};
                        decryptedEntry.Login = decrypt(entry.Login, resp.Nonce);
                        decryptedEntry.Password = decrypt(entry.Password, resp.Nonce);
                        return decryptedEntry;
                    });
                    success(decryptedEntries);
                } else {
                    error();
                }
            });
        },

        applyCredentials : function (document, creds) {
            return (applyLogin(document, creds[0].Login) &&
                    applyPassword(document, creds[0].Password));
        }

    };
}();

interactive("keepass2_connect",
            "tries to connect to a keepass2 database",
            function (I) {
                Keepass2.connect(function () { I.minibuffer.message("keepass2: connection OK."); },
                                 function () { I.minibuffer.message("keepass2: connection FAILED."); });
            });

interactive("keepass2_get_logins",
            "tries to get keepass2 database login entries for the current site",
            function (I) {
                Keepass2.connect(function () { Keepass2.getLogins(I.buffer.document.location,
                                                                 function(logins) { 
                                                                     if (! Keepass2.applyCredentials(I.buffer.document, logins)) {
                                                                         I.minibuffer.message("keepass2: login = " + logins[0].Login + " password = " + logins[0].Password);
                                                                     }
                                                                 },
                                                                 function() { I.minibuffer.message("keepass2: credentials not found."); }); },
                                 function () { I.minibuffer.message("keepass2: connection FAILED.");});
            });

