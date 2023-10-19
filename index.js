$("button").click(function () {
	let data = { "password": $("input").val() }
	$.post(
		"api/auth/login.php",
		data,
		function (response) {
			if (response.message == 0) {
				window.location.replace("judges.html");
			} else {
				$("body").append("<div id='invalid'>Invalid login</div>");

			}
		},
		"json");
});