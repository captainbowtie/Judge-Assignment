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
	updatePairings();
	updateAssignments();
	updateJudges();
	setInterval(function () { updateJudges(); }, 10000);
	$("#assignments").tabs();
});

function updatePairings() {
	$.get("api/pairings/getAll.php",
		function (data) {
			pairings = data;
		},
		"json");
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


	tableHTML += "</table>";
	let buttonHTML = "<div>"
	buttonHTML += "<button class='addPairing'>Add Pairing Row</button>";
	buttonHTML += "<button class='deletePairing'>Delete Pairing Row</button>";
	buttonHTML += "<button class='addJudge'>Add Judge Column</button>";
	buttonHTML += "<button class='deleteJudge'>Delete Judge Column</button>";
	buttonHTML += "</div>"
	buttonHTML += "<div>"
	buttonHTML += "<button class='savePairings'>Save Pairings</button>";
	buttonHTML += "<button class='saveAssignments'>Save Assignments</button>";
	buttonHTML += "</div>"

	$(`#round${roundNumber}`).html(tableHTML + buttonHTML);
	fillJudgeSelects();

	function buildPairingRow(pairing) {
		let rowHTML = `<tr pairing='${pairing.id}'>`;
		rowHTML += `<td><input class='room' value='${pairing.room}'></td>`;//room
		rowHTML += `<td><input class='plaintiff' maxlength='4' size='4' value='${pairing.plaintiff}'></td>`;//π
		rowHTML += `<td><input class='defense' maxlength='4' size='4' value='${pairing.defense}'></td>`;//∆
		for (let a = 0; a < maxJudgesPerPairing; a++) {
			rowHTML += `<td><select class='judgeSelect' pairing='${pairing.id}'></select></td>`
		}
		rowHTML += "</tr>"
		return rowHTML;
	}

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
}



function updateJudgeSelects() {
	Promise.all(getAllJudges(), updateAssignments(), updatePairings()).then((data) => {
		let judges = data[0];

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