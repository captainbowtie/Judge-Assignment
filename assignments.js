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
let pairings;
let assignments;

$(document).ready(function () {
	updateJudges();
	setInterval(function () { updateJudges(); }, 10000);
	$("#assignments").tabs();
	Promise.all([updatePairings(), updateAssignments()]).then(() => {
		for (let a = 0; a < 4; a++) {
			buildAssignmentTable(a + 1);
		}
	});

});

function updatePairings() {
	return new Promise((resolve, reject) => {
		$.get("api/pairings/getAll.php",
			function (data) {
				pairings = data;
				resolve();
			},
			"json");
	});

};

function getAllJudges() {
	return new Promise((resolve, reject) => {
		$.get("api/judges/getAll.php",
			function (judges) {
				resolve(judges);
			},
			"json");
	});
};

function getAllConflicts() {
	return new Promise((resolve, reject) => {
		$.get("api/conflicts/getAll.php",
			function (conflicts) {
				resolve(conflicts);
			},
			"json");
	});
};

function updateAssignments() {
	return new Promise((resolve, reject) => {
		$.get("api/assignments/getAll.php",
			function (data) {
				assignments = data;
				resolve();
			},
			"json");
	});

};

function checkIn(id) {
	$.post("api/judges/checkIn.php", { "id": id }, "json");
}

function checkOut(id) {
	$.post("api/judges/checkOut.php", { "id": id }, "json");
}

function updateJudges() {
	getAllJudges().then((judges) => {
		let tableHTML = "<table>";
		judges.forEach((judge) => {
			tableHTML += "<tr>";
			tableHTML += `<td>${judge.name}</td>`;
			tableHTML += `<td><input type='checkbox' class='checkIn' judge='${judge.id}' ${(judge.checkedIn == 1) ? 'checked' : ''}></td>`;
			tableHTML += "</tr>";
		});
		tableHTML += "</table>";
		$("#judges").html(tableHTML);

		$(".checkIn").on("change", function () {
			let id = $(this).attr("judge");
			if ($(this).prop("checked")) {
				checkIn(id);
			} else {
				checkOut(id);
			}
		});
	});

	function createJudgeRow(judge) {
		let rowHTML = `<tr id='${judge.id}'>`;
		rowHTML += "<td>";
		rowHTML += judge.name;
		rowHTML += "</td><td>";
		rowHTML += `<input type='checkbox' class='checkedIn' ${(judge.checkedIn == 1) ? 'checked' : ''}>`;
		rowHTML += "</td></tr>"

		return rowHTML;
	}
}

function buildAssignmentTable(roundNumber) {
	//filter round pairings
	let roundPairings = [];
	pairings.forEach((pairing) => {
		if (pairing.round == roundNumber) {
			roundPairings.push(pairing);
		}
	});

	//filter round assignments
	let roundAssignments = [];
	let judgePerPairingCounts = [];
	assignments.forEach((assignment) => {
		roundPairings.forEach((pairing) => {
			if (pairing.id == assignment.pairing) {
				roundAssignments.push(assignment);
				//in addition to filtering, we also get a count of judges per pairing here, to find out how many columns we need
				if (typeof judgePerPairingCounts[pairing.id] == 'undefined') {
					judgePerPairingCounts[pairing.id] = 1;
				} else {
					judgePerPairingCounts[pairing.id]++;
				}
			}
		});
	});
	//determine max judges per pairing
	let maxJudgesPerPairing = 1;
	judgePerPairingCounts.forEach((judgeCount) => {
		if (judgeCount > maxJudgesPerPairing) {
			maxJudgesPerPairing = judgeCount;
		}
	});

	//table headers
	let tableHTML = "<table>";
	tableHTML += "<tr><th>Room</th><th>π</th><th>∆</th>";
	for (let a = 0; a < maxJudgesPerPairing; a++) {
		tableHTML += `<th>Judge ${a + 1}</th>`
	}
	tableHTML += "</tr>";

	//table rows
	roundPairings.forEach((pairing) => {
		tableHTML += buildPairingRow(pairing);
	});
	function buildPairingRow(pairing) {
		let rowHTML = `<tr pairing='${pairing.id}'>`;
		rowHTML += `<td><input class='room' value='${pairing.room}' disabled="disabled"></td>`;//room
		rowHTML += `<td><input class='plaintiff' maxlength='4' size='4' value='${pairing.plaintiff}' disabled="disabled"></td>`;//π
		rowHTML += `<td><input class='defense' maxlength='4' size='4' value='${pairing.defense}' disabled="disabled"></td>`;//∆
		for (let a = 0; a < maxJudgesPerPairing; a++) {
			rowHTML += `<td><select class='judgeSelect' pairing='${pairing.id}' `
			//if assignments already exist, then disable the selects
			if (roundAssignments.length > 0) {
				rowHTML += "disabled='disabled'";
			}
			rowHTML += `></select></td>`;
		}
		rowHTML += "</tr>"
		return rowHTML;
	}

	tableHTML += "</table>";
	//html for buttons
	let buttonHTML = "<div>"
	//if pairings already exist, the add/delete pairing buttons should be disabled
	if (roundPairings.length > 0) {
		buttonHTML += "<button class='addPairing' disabled='disabled'>Add Pairing Row</button>";
		buttonHTML += "<button class='removePairing' disabled='disabled'>Delete Pairing Row</button>";
	} else {
		buttonHTML += "<button class='addPairing'>Add Pairing Row</button>";
		buttonHTML += "<button class='removePairing'>Delete Pairing Row</button>";
	}

	//if assignments already exist, the add/delete judge buttons should be disabled
	if (roundAssignments.length > 0) {
		buttonHTML += "<button class='addJudge' disabled='disabled'>Add Judge Column</button>";
		buttonHTML += "<button class='removeJudge' disabled='disabled'>Delete Judge Column</button>";
	} else {
		buttonHTML += "<button class='addJudge'>Add Judge Column</button>";
		buttonHTML += "<button class='removeJudge'>Delete Judge Column</button>";
	}

	buttonHTML += "</div>"
	buttonHTML += "<div>"
	//if pairings already exist, the save pairing button should be changed to an edit button
	if (roundPairings.length > 0) {
		buttonHTML += "<button class='editPairings'>Edit Pairings</button>";
	} else {
		buttonHTML += "<button class='savePairings'>Save Pairings</button>";
	}

	//if assignments already exist, the save assignments button should be changed to an edit button
	if (roundAssignments.length > 0) {
		buttonHTML += "<button class='editAssignments'>Edit Assignments</button>";
	} else {
		buttonHTML += "<button class='saveAssignments'>Save Assignments</button>";
	}
	buttonHTML += "</div>"

	$(`#round${roundNumber}`).html(tableHTML + buttonHTML);

	$(`#round${roundNumber}`).children().children(".addPairing").click(() => {
		addPairingRow();
	});
	$(`#round${roundNumber}`).children().children(".removePairing").click(() => {
		removePairingRow();
	});
	$(`#round${roundNumber}`).children().children(".addJudge").click(() => {
		addJudgeColumn();
	});
	$(`#round${roundNumber}`).children().children(".removeJudge").click(() => {
		removeJudgeColumn();
	});
	attachSavePairingsHandler();
	function attachSavePairingsHandler() {
		$(`#round${roundNumber}`).children().children(".savePairings").click(() => {
			if (roundPairings.length > 0) {
				let modalHTML = `<div>Pairings already exist for this round. Are you sure you want to overwrite them?</div>`;
				$("#modal").html(modalHTML);
				$("#modal").dialog({
					buttons: [
						{
							text: "Confirm",
							click: function () {
								savePairings();
								$(this).dialog("close");
							}
						}
					],
					title: "Confirm New Pairings",
					modal: true
				});
			} else { savePairings(); }

		});
	}

	$(`#round${roundNumber}`).children().children(".saveAssignments").click(() => {
		saveAssignments();
	});
	$(`#round${roundNumber}`).children().children(".editPairings").click(() => {
		$(`#round${roundNumber}`).children().children(".editPairings").html("Save Pairings");
		$(`#round${roundNumber}`).children().children(".editPairings").attr("class", "savePairings");
		$(`#round${roundNumber}`).children().children(".addPairing").prop("disabled", false);
		$(`#round${roundNumber}`).children().children(".removePairing").prop("disabled", false);
		let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
		for (let a = 1; a < rows.length; a++) {
			$(rows[a]).children().children(".room").prop("disabled", false);
			$(rows[a]).children().children(".plaintiff").prop("disabled", false);
			$(rows[a]).children().children(".defense").prop("disabled", false);
		}
		attachSavePairingsHandler();
	});

	fillJudgeSelects();



	function fillJudgeSelects() {
		getAllJudges().then((judges) => {
			//first we just fill all the selects with all the names
			let judgeSelects = $(`#round${roundNumber}`).children().children().children().children().children(".judgeSelect");
			for (let a = 0; a < judgeSelects.length; a++) {
				let selectHTML = "<option selected value='0'>---</option>";
				judges.forEach((judge) => {
					selectHTML += `<option value ='${judge.id}'>${judge.name}</option>`
				});
				$(judgeSelects[a]).html(selectHTML);
			}

			//then we go through and see if assignments already exist, and if so, update the selects to reflect thos assignments
			let pairingRows = $(`#round${roundNumber}`).children().children().children();
			for (let a = 0; a < pairingRows.length; a++) {
				let pairingId = $(pairingRows[a]).attr("pairing");
				let judgeIds = [];
				for (let b = 0; b < assignments.length; b++) {
					if (assignments[b].pairing == pairingId) {
						judgeIds.push(assignments[b].judge);
					}
				}
				let pairingSelects = $(pairingRows[a]).children().children(".judgeSelect");
				for (let b = 0; b < judgeIds.length; b++) {
					$(pairingSelects[b]).val(judgeIds[b]);
				}
			}
		});
	}

	function addPairingRow() {
		let rowHTML = "<tr>";
		rowHTML += "<td><input class='room'></td>"
		rowHTML += "<td><input class='plaintiff' maxlength='4' size='4'></td>";
		rowHTML += "<td><input class='defense' maxlength='4' size='4'></td>";
		getAllJudges().then((judges) => {
			//first we just fill all the selects with all the names	
			let selectHTML = "<option selected value='0'>---</option>";
			judges.forEach((judge) => {
				selectHTML += `<option value ='${judge.id}'>${judge.name}</option>`
			});

			for (let a = 0; a < maxJudgesPerPairing; a++) {
				rowHTML += `<td><select class='judgeSelect'>${selectHTML}</select></td>`;
			}
			"</tr>"
			$(`#round${roundNumber}`).children("table").append(rowHTML);
		});
	}

	function removePairingRow() {
		let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
		$(rows[rows.length - 1]).remove();
	}

	function addJudgeColumn() {
		maxJudgesPerPairing++;
		let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
		$(rows[0]).append(`<th>Judge ${maxJudgesPerPairing}</th>`);
		getAllJudges().then((judges) => {
			//first we just fill all the selects with all the names	
			let selectHTML = "<td><select class='judgeSelect'><option selected value='0'>---</option>";
			judges.forEach((judge) => {
				selectHTML += `<option value ='${judge.id}'>${judge.name}</option>`
			});
			selectHTML += "</select></td>";
			for (let a = 1; a < rows.length; a++) {
				$(rows[a]).append(selectHTML);
			}
		});
	}

	function removeJudgeColumn() {
		if (maxJudgesPerPairing > 0) {
			maxJudgesPerPairing--;
			let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
			let indexForRemoval = $(rows[0]).children().length - 1;
			for (let a = 0; a < rows.length; a++) {
				$($(rows[a]).children()[indexForRemoval]).remove();
			}
		}
	}

	function savePairings() {
		let pairings = [];
		let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
		//start at 1 because [0] is the header row
		for (let a = 1; a < rows.length; a++) {
			let room = $(rows[a]).children().children(".room").val();
			let plaintiff = $(rows[a]).children().children(".plaintiff").val();
			let defense = $(rows[a]).children().children(".defense").val();
			let pairing = {
				"room": room,
				"plaintiff": plaintiff,
				"defense": defense
			};
			pairings.push(pairing);
		}
		let data = JSON.stringify({ "round": roundNumber, "pairings": pairings });
		$.post("api/pairings/create.php", data, () => { buildAssignmentTable(roundNumber) }, "json");
	}

	function saveAssignments() {
		let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
		let assignments = [];
		//start at 1 because [0] is the header row
		for (let a = 1; a < rows.length; a++) {
			let selects = $(rows[a]).children().children("select");
			let pairing = $(rows[a]).attr("pairing");
			for (let b = 0; b < selects.length; b++) {
				let judge = $(selects[b]).val();
				let assignment = { "pairing": pairing, "judge": judge };
				assignments.push(assignment);
			}
		}
		let data = JSON.stringify({ "assignments": assignments });
		$.post("api/assignments/create.php", data, () => {
			updateAssignments().then(() => { buildAssignmentTable(roundNumber) });
		}, "json");
	}
}

function updateJudgeSelects() {
	getAllJudges().then((judges) => {
		for (let a = 0; a < judgeSelects.length; a++) {
			// the selects currently don't have anything in them, then fill them and set their value
			if ($(judgeSelects[a]).val() === null) {

			} else { //if the selects alraedy do have values, preserve those values
				let value = $(judgeSelects[a]).val();
				let selectHTML = "<option selected value='0'>---</option>";
				judges.forEach((judge) => {
					if (judge.id == value) {
						selectHTML += `<option value ='${judge.id}' selected>${judge.name}</option>`
					} else {
						selectHTML += `<option value ='${judge.id}'>${judge.name}</option>`
					}

				});
			}
		}
		//

	});
}