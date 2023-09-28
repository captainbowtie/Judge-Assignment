$(document).ready(function () {
	getJudges().then((judges) => fillTable(judges));
	setInterval(function () { getJudges().then((judges) => fillTable(judges)); }, 10000);
});

function getJudges() {
	return new Promise((resolve, reject) => {
		$.get("api/judges/getAll.php",
			function (judges) {
				resolve(judges);
			},
			"json");
	});
}

function getJudgeConflicts(judgeId) {
	return new Promise((resolve, reject) => {
		$.get("api/conflicts/getByJudge.php",
			{ "judgeId": judgeId },
			function (conflicts) {
				resolve(conflicts);
			},
			"json");
	});
}

function createJudgeRow(judge) {
	let rowHTML = `<tr id='${judge.id}'>`;
	rowHTML += "<td>";
	rowHTML += `<input class='name' value='${judge.name}'>`;
	rowHTML += "</td><td>";
	rowHTML += "<select class='category'>";
	switch (judge.category) {
		case 1:
			rowHTML += "<option value='1' selected='selected'>1</option>";
			rowHTML += "<option value='2'>2</option>";
			rowHTML += "<option value='3'>3</option>";
			break;
		case 2:
			rowHTML += "<option value='1'>1</option>";
			rowHTML += "<option value='2' selected='selected'>2</option>";
			rowHTML += "<option value='3'>3</option>";
			break;
		case 3:
			rowHTML += "<option value='1'>1</option>";
			rowHTML += "<option value='2'>2</option>";
			rowHTML += "<option value='3' selected='selected'>3</option>";
			break;
	}
	rowHTML += "</select>";
	rowHTML += "</td><td>";
	rowHTML += "<button class='conflicts'>Conflicts</button>";
	rowHTML += "</td><td>";
	rowHTML += "<button class='deleteJudge'>Delete</button>";
	rowHTML += "</td><td>";
	rowHTML += `<input type='checkbox' class='checkedIn' ${(judge.checkedIn == 1) ? 'checked' : ''}>`;
	rowHTML += "</td></tr>"

	return rowHTML;
}

function createConflictRow(conflict) {
	let rowHTML = `<tr><td>${conflict.team}</td><td><button class='deleteConflict>Delete</button></td></tr>`
	return rownHTML;
}

function fillTable(judges) {
	let tableHTML = "";
	function appendHTML(judge) {
		tableHTML += createJudgeRow(judge);
	}
	judges.forEach(appendHTML);
	$("#judges").html(tableHTML);

	//attach listeners to the newly created objects
	$(".name").on("input", function () {
		let id = $(this).parent().parent().attr("id");
		let name = $(this).val();
		updateName(id, name);
	});

	$(".category").on("change", function () {
		let id = $(this).parent().parent().attr("id");
		let category = $(this).val();
		updateCategory(id, category);
	});

	$(".checkedIn").on("change", function () {
		let id = $(this).parent().parent().attr("id");
		if ($(this).prop("checked")) {
			checkIn(id);
		} else {
			checkOut(id);
		}
	});

	$(".deleteJudge").click(function () {
		//generate modal HTML
		let id = $(this).parent().parent().attr("id");
		let name = $(this).parent().parent().children().children(".name").val();
		let modalHTML = `<div>Are you sure you want to delete ${name} from the judge list?</div>`;

		//display HTML in modal
		$("#modal").html(modalHTML);
		$("#modal").dialog({
			buttons: [
				{
					text: "Delete",
					click: function () {
						deleteJudge(id);
						getJudges().then(() => fillTable());
						$(this).dialog("close");
					}
				}
			],
			title: "Confirm Deletion",
			modal: true
		});
	});

	$(".conflicts").click(function () {
		//get conflict list
		let id = $(this).parent().parent().attr("id");
		getJudgeConflicts(id).then((conflicts) => {
			//generate HTML from that list
			let modalHTML = "<table>";
			conflicts.forEach((conflict) => {
				modalHTML += createConflictRow(conflict);
			});
			modalHTML += "</table>";
			//display HTML in the modal
			$("#modal").html(modalHTML);
			$("#modal").dialog({
				title: "Conflicts",
				modal: true
			});
			//attach listeners to the elements within the modal
			$(".deleteConflict").click(function () {
				deleteConflict(id);
			});
		});





	});
}

function updateName(id, name) {
	$.post("api/judges/updateName.php", { "id": id, "name": name }, "json");
}

function updateCategory(id, category) {
	$.post("api/judges/updateCategory.php", { "id": id, "category": category }, "json");
}

function checkIn(id) {
	$.post("api/judges/checkIn.php", { "id": id }, "json");
}

function checkOut(id) {
	$.post("api/judges/checkOut.php", { "id": id }, "json");
}

function deleteJudge(id) {
	$.post("api/judges/delete.php", { "id": id }, "json");
}

function deleteConflict(id) {
	$.post("api/conflicts/delete.php", { "id": id }, "json");
}