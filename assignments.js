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
	setInterval(function () { updateJudges; }, 10000);
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
	$.get("api/assignments/getAll.php",
		function (data) {
			assignments = data;
		},
		"json");
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
	$("#assignments").html(tableHTML);

	function buildPairingRow(pairing) {
		let rowHTML = `<tr pairing='${pairing.id}'>`;
		rowHTML += `<td><input class='room' value='${pairing.room}'></td>`;//room
		rowHTML += `<td><input class='plaintiff' maxlength='4' size='4' value='${pairing.plaintiff}'></td>`;//π
		rowHTML += `<td><input class='defense' maxlength='4' size='4' value='${pairing.defense}'></td>`;//∆
		for (let a = 0; a < maxJudgesPerPairing; a++) {
			rowHTML += "<td><select class='judgeSelect'></select></td>"
		}
		rowHTML += "</tr>"
		return rowHTML;
	}
}