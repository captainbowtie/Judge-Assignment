/* 
 * Copyright (C) 2023 allen
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
	rowHTML += `<input type='checkbox' class='checkIn' ${(judge.checkedIn == 1) ? 'checked' : ''}>`;
	rowHTML += "</td></tr>"

	return rowHTML;
}

function createConflictRow(conflict) {
	let rowHTML = `<tr><td>${conflict.team}</td><td><button class='deleteConflict' conflict='${conflict.id}'>Delete</button></td></tr>`
	return rowHTML;
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

	$(".checkIn").on("change", function () {
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
						getJudges().then((judges) => fillTable(judges));
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
		let name = $(this).parent().parent().children().children(".name").val();
		conflictModal(id, name);
	});
}

function conflictModal(id, name) {
	getJudgeConflicts(id).then((conflicts) => {
		//generate HTML from that list
		let modalHTML = "<table>";
		modalHTML += "<tr><td><input id='conflictInput' maxlength='4' size='4'></td><td><button id='addConflict'>Add</button></td></tr>";
		if (conflicts.length == 0) {
			modalHTML += "<tr><td>No conflicts found</td></tr>";
			modalHTML += "<tr><td>Add conflicts above</td></tr>";
		} else {
			conflicts.forEach((conflict) => {
				modalHTML += createConflictRow(conflict);
			});
		}
		modalHTML += "</table>";

		//display HTML in the modal
		$("#modal").html(modalHTML);
		$("#modal").dialog({
			title: `${name} - Conflicts`,
			modal: true
		});
		//attach listeners to the elements within the modal
		$(".deleteConflict").click(function () {
			let conflictId = $(this).attr("conflict");
			deleteConflict(conflictId);
			conflictModal(id, name);
		});

		$("#addConflict").click(function () {
			createConflict(id, $("#conflictInput").val());
			conflictModal(id, name);
		});
	});
}

$("#addJudge").click(function () {
	let name = $("#newJudgeName").val();
	let category = $("#newJudgeCategory").val();
	if (category == 0) { category = 1 };
	createJudge(name, category);
	getJudges().then((judges) => fillTable(judges));
	$("#newJudgeName").val("");
});

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

function createConflict(judgeId, teamNumber) {
	$.post("api/conflicts/create.php", { "judge": judgeId, "team": teamNumber }, "json");
}

function createJudge(name, category) {
	$.post("api/judges/create.php", { "name": name, "category": category }, "json");
}