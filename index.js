$("#checkinLogin").click(function () {
	let data = { "password": $("input").val() }
	$.post(
		"api/auth/login.php",
		data,
		function (response) {
			if (response.message == 0) {
				window.location.replace("judges.html");
			} else {
				$("body").append("<div id='invalid'>Invalid login</div>");
				setTimeout(() => { $("#invalid").remove() }, 5000);
			}
		},
		"json");
});

$("#assignmentLogin").click(function () {
	let data = { "password": $("input").val() }
	$.post(
		"api/auth/login.php",
		data,
		function (response) {
			if (response.message == 0) {
				window.location.replace("assignments.html");
			} else {
				$("body").append("<div id='invalid'>Invalid login</div>");
				setTimeout(() => { $("#invalid").remove() }, 5000);
			}
		},
		"json");
});