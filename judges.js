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
				if (judges.message == -1) {
					handleSessionExpiration();
				} else {
					resolve(judges);
				}
			},
			"json");
	});
}

function getJudgeConflicts(judgeId) {
	return new Promise((resolve, reject) => {
		$.get("api/conflicts/getByJudge.php",
			{ "judgeId": judgeId },
			function (conflicts) {
				if (conflicts.message == -1) {
					handleSessionExpiration();
				} else {
					resolve(conflicts);
				}
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
	rowHTML += "<button class='notes'>Notes</button>";
	rowHTML += "</td><td>";
	rowHTML += `<input type='checkbox' class='checkIn' ${(judge.checkedIn == 1) ? 'checked' : ''}>`;
	rowHTML += "</td><td>";
	rowHTML += `<input type='checkbox' class='round1' ${(judge.round1 == 1) ? 'checked' : ''}>`;
	rowHTML += "</td><td>";
	rowHTML += `<input type='checkbox' class='round2' ${(judge.round2 == 1) ? 'checked' : ''}>`;
	rowHTML += "</td><td>";
	rowHTML += `<input type='checkbox' class='round3' ${(judge.round3 == 1) ? 'checked' : ''}>`;
	rowHTML += "</td><td>";
	rowHTML += `<input type='checkbox' class='round4' ${(judge.round4 == 1) ? 'checked' : ''}>`;
	rowHTML += "</td></tr>"

	return rowHTML;
}

function createConflictRow(conflict) {
	let rowHTML = `<tr><td>${conflict.team}</td><td><button class='deleteConflict' conflict='${conflict.id}'>Delete</button></td></tr>`
	return rowHTML;
}

function fillTable(judges) {
	let tableHTML = "<tr><th>Name</th><th>Category</th><th>Conflicts</th><th>Delete</th><th>Notes</th><th>Check In</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th></tr>";
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

	for (let a = 1; a <= 4; a++) {
		$(`.round${a}`).on("change", function () {
			let id = $(this).parent().parent().attr("id");
			let round = $(this).attr('class').substring(5);
			let availability;
			if ($(this).prop("checked")) {
				availability = 1;
			} else {
				availability = 0;
			}

			updateAvailability(id, round, availability);
		});
	}


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
		let id = $(this).parent().parent().attr("id");
		let name = $(this).parent().parent().children().children(".name").val();
		conflictModal(id, name);
	});

	$(".notes").click(function () {
		let id = $(this).parent().parent().attr("id");
		let name = $(this).parent().parent().children().children(".name").val();
		notesModal(id, name);
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

function notesModal(id, name) {
	getNotes(id).then((notes) => {
		//generate HTML from that list
		let modalHTML = `<textarea id='modalNotesArea'>${notes[0].notes}</textarea>`;

		//display HTML in the modal
		$("#modal").html(modalHTML);
		$("#modal").dialog({
			buttons: [
				{
					text: "Save",
					click: function () {
						let updatedNotes = $("#modalNotesArea").val();
						updateNotes(id, updatedNotes);
						$(this).dialog("close");
					}
				}
			],
			title: `${name} - Notes`,
			modal: true
		});
	});
}

$("#addJudge").click(function () {
	let name = $("#newJudgeName").val();
	let category = $("#newJudgeCategory").val();
	if (category == 0) { category = 1 };
	createJudge(name, category);
});

function updateName(id, name) {
	$.post("api/judges/updateName.php",
		{ "id": id, "name": name },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function updateCategory(id, category) {
	$.post("api/judges/updateCategory.php",
		{ "id": id, "category": category },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function checkIn(id) {
	$.post("api/judges/checkIn.php",
		{ "id": id },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function checkOut(id) {
	$.post("api/judges/checkOut.php",
		{ "id": id },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function deleteJudge(id) {
	$.post("api/judges/delete.php",
		{ "id": id },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function deleteConflict(id) {
	$.post("api/conflicts/delete.php",
		{ "id": id },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function createConflict(judgeId, teamNumber) {
	$.post("api/conflicts/create.php",
		{ "judge": judgeId, "team": teamNumber },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function createJudge(name, category) {
	$.post("api/judges/create.php",
		{ "name": name, "category": category },
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			} else {
				getJudges().then((judges) => fillTable(judges));
				$("#newJudgeName").val("");
			}
		},
		"json");
}

function updateAvailability(id, round, availabiity) {
	$.post("api/judges/updateAvailability.php",
		{
			"id": id,
			"round": round,
			"availability": availabiity
		},
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function updateNotes(id, notes) {
	$.post("api/judges/updateNotes.php",
		{
			"id": id,
			"notes": notes
		},
		function (response) {
			if (response.message == -1) {
				handleSessionExpiration();
			}
		},
		"json");
}

function getNotes(judgeId) {
	return new Promise((resolve, reject) => {
		$.get("api/judges/getNotes.php",
			{ "judgeId": judgeId },
			function (notes) {
				if (notes.message == -1) {
					handleSessionExpiration();
				} else {
					resolve(notes);
				}
			},
			"json");
	});
}

function handleSessionExpiration() {
	let html = "User session expired. Please login again <a href='index.html'>here</a>."
	$("body").html(html);
}