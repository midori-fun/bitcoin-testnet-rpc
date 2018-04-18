new ClipboardJS('.btn');
$(".copybtn").on("click", function() {
	$(this).html("Copied!");
});

$("#host").val(location.host);

if(location.protocol.includes("https")) {
	$("#introduction").append(`If you want to use http, go to <a href="http://${location.hostname}:55002">http version</a>.`);
} else {
	$("#introduction").append(`If you want to use https, go to <a href="https://${location.hostname}:55000">https version</a>.`);
}

$("form input").each(function(i, e) {
	if($(e).val() === "" && localStorage[e.id]) {
		$(e).val(localStorage[e.id]);
	}

	$(e).on("blur", function() {
		localStorage[e.id] = $(e).val();
	});
});

$("form").on("submit", function() {
	$("form input").each(function(i, e) {
		if($(e).val() === "") {
			$(e).val($(e).attr("placeholder"));
		}
	});

	let params = eval($("#params").val());
	if(Array.isArray(params) === false) {
		params = [];
	}

	let options = {
		type: 'post',
		dataType: 'json',
		contentType: 'application/json',
		scriptCharset: 'utf-8',
		data: JSON.stringify({
			method: $("#method").val(),
			params: params,
			rpcuser: $("#rpcuser").val(),
			rpcpassword: $("#rpcpassword").val(),
			rpcport: $("#rpcport").val(),
			host: $("#host").val()
		}),
		beforeSend: function (xhr) {
			xhr.setRequestHeader("Authorization", "Basic " + btoa($("#rpcuser").val() + ":" + $("#rpcpassword").val()));
		}
	};

	let curl = Object.assign(
		{ url: `${location.protocol}//${location.host}/curl` },
		options
	)
	let api = Object.assign(
		{ url: `${location.protocol}//${location.host}/` },
		options
	)

	$("#api,#curl").val("proceeding...");
	$("form input").prop("disabled", true);
	$("form button").addClass("disabled").text("Proceeding...");
	$.ajax(api).done(function(r) {
		if(r.statusCode === "403") {
			$("#api,#curl").val(r.body);
			return false;
		}
		$("#api").val(JSON.stringify(r));
	}).catch(function(err) {
		$("#api").val(err.toString());
	}).always(function(){
		$("#api").removeAttr("readonly");
		$("form input").prop("disabled", false);
		$("form button").removeClass("disabled").text("Run");
	});

	$.ajax(curl).always(function(r) {
		$("#curl").val(r.responseText);
		$("#curl").removeAttr("readonly");
	});

	event.preventDefault();
});