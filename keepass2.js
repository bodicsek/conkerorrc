var name = "conkeror";
var key = "Lgh8xMEkV2j10bG7O42GjCibsUEpM80T7Db+skKGiNc=";

function generate_iv() {
    var iv = [];
    for (var i = 0; i < 16; i++) {
        iv.push(String.fromCharCode(Math.floor(Math.random() * 256)));
    }
    iv = iv.join('');
    return btoa(iv);
}

function encrypt(data, iv) {
    var enc = sjcl.mode.cbc.encrypt(
        new sjcl.cipher.aes(sjcl.codec.base64.toBits(key)),
        sjcl.codec.utf8String.toBits(data),
        sjcl.codec.base64.toBits(iv));
    return sjcl.codec.base64.fromBits(enc);
}

function decrypt(data, iv) {
    var dec = sjcl.mode.cbc.decrypt(
            new sjcl.cipher.aes(sjcl.codec.base64.toBits(key)),
            sjcl.codec.base64.toBits(data),
            sjcl.codec.base64.toBits(iv));
    return sjcl.codec.utf8String.fromBits(dec);
}

function create_base_request(requestType) {
    var request = {};
    request.RequestType = requestType;
    request.Id = name;
    var iv = generate_iv();
    request.Nonce = iv;
    request.Verifier = encrypt(iv, iv);
    return request;    
}

function send_request(req, callback) {
    var Xhr = {
	request: function(method, request) {
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
	post: function(request) {
            this.request("POST", request);
	}
    };

    Xhr.post(JSON.stringify(req));
}

function keepass2_connect (success, error) {
    var req = create_base_request("test-associate");
    send_request(req, function(r) {
	var resp = JSON.parse(r);
	if (! resp.Success) {
	    req.RequestType = "associate";
	    req.Key = key;
	    send_request(req, function(r1) {
		var resp1 = JSON.parse(r1);
		if (! resp1.Success) {
		    error();
		} else {
		    success();
		}
	    });
	} else {
	    success();
	}
    });
}

function keepass2_get_logins(url, success, error) {
    var req = create_base_request("get-logins");
    req.Url = encrypt(url, req.Nonce);
    send_request(req, function(r) {
	var resp = JSON.parse(r);
	if(resp.Success && resp.Entries.length != 0) {
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
}

interactive("keepass2_connect",
	    "tries to connect to a keepass2 database",
	    function (I) {
		keepass2_connect(function() { I.minibuffer.message("keepass2: connection OK."); },
				 function() { I.minibuffer.message("keepass2: connection FAILED."); });
	    });

interactive("keepass2_get_logins",
	    "tries to get keepass2 database login entries for the current site",
	    function (I) {
		keepass2_connect(function() { keepass2_get_logins(I.buffer.document.location,
								  function(logins) { 
								      I.minibuffer.message("keepass2: login = " + logins[0].Login + " password = " + logins[0].Password);
								  },
								  function() { I.minibuffer.message("keepass2: credentials not found.")}); },
				 function() { I.minibuffer.message("keepass2: connection FAILED.");});
	    });

