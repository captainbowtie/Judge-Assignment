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
	setInterval(function () { updateJudges(); }, 10000);
	$("#assignments").tabs();
	Promise.all([updatePairings(), updateAssignments()]).then(() => {
		updateJudges();
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
	return new Promise((resolve, reject) => {
		$.post("api/judges/checkIn.php",
			{ "id": id },
			() => { resolve(); },
			"json");
	});

}

function checkOut(id) {
	return new Promise((resolve, reject) => {
		$.post("api/judges/checkOut.php",
			{ "id": id },
			() => { resolve() },
			"json");
	});

}

function updateJudges() {
	getAllJudges().then((judges) => {
		//sort judges into those anticipated for current round and everyone else
		let currentRound = 1;
		pairings.forEach(pairing => {
			if (pairing.round > currentRound) {
				currentRound = pairing.round;
			}
		});
		let roundJudges = [];
		let nonroundJudges = [];
		judges.forEach((judge) => {
			if (judge[`round${currentRound}`] == true) {
				roundJudges.push(judge);
			} else {
				nonroundJudges.push(judge);
			}
		});

		//create HTML with black line between available and unavailable judges
		let tableHTML = "<table>";
		roundJudges.forEach((judge) => {
			let preside = (judge.preside == 0) ? "No preference" : ((judge.preside == 1) ? "Preside" : "Score");
			tableHTML += "<tr>";
			tableHTML += `<td title='${judge.category + "\n" + preside + "\n" + judge.notes}'>${judge.name}</td>`;
			tableHTML += `<td><input type='checkbox' class='checkIn' judge='${judge.id}' ${(judge.checkedIn == 1) ? 'checked' : ''}></td>`;
			tableHTML += "</tr>";
		});
		tableHTML += "<tr><td><hr></td><td></td></tr>";
		nonroundJudges.forEach((judge) => {
			let preside = (judge.preside == 0) ? "No preference" : ((judge.preside == 1) ? "Preside" : "Score");
			tableHTML += "<tr>";
			tableHTML += `<td title='${judge.category + "\n" + preside + "\n" + judge.notes}'>${judge.name}</td>`;
			tableHTML += `<td><input type='checkbox' class='checkIn' judge='${judge.id}' ${(judge.checkedIn == 1) ? 'checked' : ''}></td>`;
			tableHTML += "</tr>";
		});
		tableHTML += "</table>";
		$("#judges").html(tableHTML);

		highlightAssigned();

		$(".checkIn").on("change", function () {
			let id = $(this).attr("judge");
			if ($(this).prop("checked")) {
				checkIn(id).then(() => { screenAssignments() });
			} else {
				checkOut(id).then(() => { screenAssignments() });
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
	tableHTML += "<tr><th class='rankHeader'>Rank</th><th>Room</th><th>π</th><th>∆</th>";
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
		rowHTML += `<td><input class='rank' size='2' maxLength='2' value='${pairing.rank}' disabled="disabled"></td>`;//rank
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
	buttonHTML += "<button class='generateAssignments'>Generate Assignments</button>"
	buttonHTML += "</div>"

	$(`#round${roundNumber}`).html(tableHTML + buttonHTML);

	$(`#round${roundNumber}`).find(".addPairing").click(() => {
		addPairingRow();
	});
	$(`#round${roundNumber}`).find(".removePairing").click(() => {
		removePairingRow();
	});
	$(`#round${roundNumber}`).find(".addJudge").click(() => {
		addJudgeColumn();
	});
	$(`#round${roundNumber}`).find(".removeJudge").click(() => {
		removeJudgeColumn();
	});
	$(`#round${roundNumber}`).find(".rankHeader").click(() => {
		let currentVisibility = $($(`#round${roundNumber}`).find(".rank")[0]).css("visibility");
		if (currentVisibility == "visible") {
			$(`#round${roundNumber}`).find(".rank").css("visibility", "hidden");
		} else {
			$(`#round${roundNumber}`).find(".rank").css("visibility", "visible");
		}
	});
	$()
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
	$(`#round${roundNumber}`).find(".editPairings").click(() => {
		$(`#round${roundNumber}`).find(".editPairings").html("Save Pairings");
		$(`#round${roundNumber}`).find(".editPairings").attr("class", "savePairings");
		$(`#round${roundNumber}`).find(".addPairing").prop("disabled", false);
		$(`#round${roundNumber}`).find(".removePairing").prop("disabled", false);
		let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
		for (let a = 1; a < rows.length; a++) {
			$(rows[a]).find(".rank").prop("disabled", false);
			$(rows[a]).find(".room").prop("disabled", false);
			$(rows[a]).find(".plaintiff").prop("disabled", false);
			$(rows[a]).find(".defense").prop("disabled", false);
		}
		attachSavePairingsHandler();
	});
	$(`#round${roundNumber}`).children().children(".editAssignments").click(() => {
		$(`#round${roundNumber}`).children().children(".editAssignments").html("Save Assignments");
		$(`#round${roundNumber}`).children().children(".editAssignments").attr("class", "saveAssignments");
		$(`#round${roundNumber}`).children().children(".addJudge").prop("disabled", false);
		$(`#round${roundNumber}`).children().children(".removeJudge").prop("disabled", false);
		let rows = $(`#round${roundNumber}`).children("table").children().children("tr");
		for (let a = 1; a < rows.length; a++) {
			$(rows[a]).children().children(".judgeSelect").prop("disabled", false);
		}
		attachSaveAssignmentsHandler();
	});
	attachSaveAssignmentsHandler();
	function attachSaveAssignmentsHandler() {
		$(`#round${roundNumber}`).children().children(".saveAssignments").click(() => {
			if (roundAssignments.length > 0) {
				let modalHTML = `<div>Judge assignments already exist for this round. Are you sure you want to overwrite them?</div>`;
				$("#modal").html(modalHTML);
				$("#modal").dialog({
					buttons: [
						{
							text: "Confirm",
							click: function () {
								saveAssignments();
								$(this).dialog("close");
							}
						}
					],
					title: "Confirm New Assignments",
					modal: true
				});
			} else { saveAssignments(); }
		});
	};
	$(`#round${roundNumber}`).children().children(".generateAssignments").click(() => {
		generateAssignments();
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

	$("body").on("change", ".judgeSelect", function () {
		screenAssignments();
		highlightAssigned();
	});

	function addPairingRow() {
		let rowHTML = "<tr>";
		rowHTML += "<td><input class='rank' maxlength='2' size='2'></td>"
		//if this is first round just create blank rooms
		if (roundNumber == 1) {
			rowHTML += "<td><input class='room'></td>"
		} else {//but if it is a later round, copy the room names from the prior round
			let currentRoomCount = ($(`#round${roundNumber}`).find(".room")).length;
			let nextRoomName = $(`#round${roundNumber - 1}`).find(".room")[currentRoomCount].value;
			rowHTML += `<td><input class='room' value='${nextRoomName}'></td>`;
		}
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
		$(".judgeSelect").on("change", function () {
			screenAssignments();
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
		$(".judgeSelect").on("change", function () {
			screenAssignments();
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
			let rank = $(rows[a]).find(".rank").val();
			let room = $(rows[a]).find(".room").val();
			let plaintiff = $(rows[a]).find(".plaintiff").val();
			let defense = $(rows[a]).find(".defense").val();
			let pairing = {
				"rank": rank,
				"room": room,
				"plaintiff": plaintiff,
				"defense": defense
			};
			pairings.push(pairing);
		}
		let data = JSON.stringify({ "round": roundNumber, "pairings": pairings });
		$.post("api/pairings/create.php",
			data,
			() => { updatePairings().then(() => { buildAssignmentTable(roundNumber); }); },
			"json");
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
		$.post("api/assignments/create.php",
			data,
			() => { updateAssignments().then(() => { buildAssignmentTable(roundNumber); }); },
			"json");
	}
	function generateAssignments() {
		let maxAttempts = 10000;
		let attemptCounter = 0;
		attemptAssignments();

		function attemptAssignments() {
			attemptCounter++;
			getAllJudges().then((judges) => {
				//filter judges round availabiity
				let filteredJudges = filterJudges(judges);
				//get selects
				$(`#round${roundNumber}`).find(".judgeSelect").val(0);
				let selects = $(`#round${roundNumber}`).find(".judgeSelect");
				//shuffle the selects
				let shuffledSelects = shuffle(selects);
				//shuffle the judges
				let shuffledJudges = shuffle(filteredJudges);
				//fill selects until they're all full or we run out of judges
				for (let a = 0; a < shuffledSelects.length; a++) {
					if (a < shuffledJudges.length) {
						$(shuffledSelects[a]).val(shuffledJudges[a].id);
					}
				}
				screenAssignments().then((assignmentsValid) => {
					if (!assignmentsValid && attemptCounter < maxAttempts) {
						attemptAssignments();
					} else if (!assignmentsValid) {
						alert(`"Unable to find permissible judge assignments after ${maxAttempts} attempts. Please click the button again to continue trying, or assign judges manually."`);
					}
				});
				//screen the assignments for conflicts
				//if there are conflicts, try again
				//if there aren't conflicts, display the assignments
			});
		}

		function filterJudges(judges) {
			let filteredJudges = [];
			judges.forEach((judge) => {
				if (judge[`round${roundNumber}`] == true || judge["checkedIn"] == true) {
					filteredJudges.push(judge);
				}
			});
			return filteredJudges;
		}
	}
}

function updateJudgeSelects() {
	getAllJudges().then((judges) => {
		let judgeSelects = $(".judgeSelect");
		for (let a = 0; a < judgeSelects.length; a++) {
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
		//

	});
}

function screenPastRoundConflicts() {
	//determine current round
	let currentRound = 1;
	pairings.forEach(pairing => {
		if (pairing.round > currentRound) {
			currentRound = pairing.round;
		}
	});

	return new Promise((resolve, reject) => {
		Promise.all([updateAssignments(), updatePairings()]).then(() => {
			let assignmentsValid = true;
			let selects = $(".judgeSelect");
			for (let a = 0; a < selects.length; a++) {
				let plaintiff = $(selects[a]).parent().parent().children().children(".plaintiff").val();
				let defense = $(selects[a]).parent().parent().children().children(".defense").val();
				let judge = $(selects[a]).val();
				assignments.forEach((assignment) => {
					let assignmentPlaintiff;
					let assignmentDefense;
					let assignmentJudge = assignment.judge;
					let isCurrentRoundAssignment = false; //flag to ignore assignment if it is from current round
					pairings.forEach((pairing) => {
						if (pairing.id == assignment.pairing) {
							assignmentPlaintiff = pairing.plaintiff;
							assignmentDefense = pairing.defense;
							if (pairing.round == currentRound) {
								isCurrentRoundAssignment = true;
							}
						}
					});

					if (!isCurrentRoundAssignment && assignmentJudge == judge &&
						(plaintiff == assignmentPlaintiff || plaintiff == assignmentDefense ||
							defense == assignmentPlaintiff || defense == assignmentDefense)) {
						$(selects[a]).css("background-color", "#ffff66");
						$(selects[a]).attr("title", "Judge has perviously judged assigned teams.");
						assignmentsValid = false;
					}
				});
			}
			resolve(assignmentsValid);
		});
	});

}

function screenAffiliationConflicts() {
	return new Promise((resolve, reject) => {
		getAllConflicts().then((conflicts) => {
			let assignmentsValid = true;
			let selects = $(".judgeSelect");
			for (let a = 0; a < selects.length; a++) {
				let plaintiff = $(selects[a]).parent().parent().children().children(".plaintiff").val();
				let defense = $(selects[a]).parent().parent().children().children(".defense").val();
				let judge = $(selects[a]).val();
				conflicts.forEach(conflict => {
					if ((conflict.team == plaintiff || conflict.team == defense) && conflict.judge == judge) {
						$(selects[a]).css("background-color", "#ffc266");
						$(selects[a]).attr("title", "Judge has an affiliation conflict.");
						assignmentsValid = false;
					}
				});
			}
			resolve(assignmentsValid);
		});
	});
}

function screenDoubleAssignments() {
	let assignmentsValid = true;
	let judgeCounts = [];
	for (let roundNumber = 1; roundNumber < 5; roundNumber++) {
		let selects = $(`#round${roundNumber}`).children().children().children().children().children("select");
		for (let a = 0; a < selects.length; a++) {
			judgeCounts[$(selects[a]).val()] = 0;
		}
		for (let a = 0; a < selects.length; a++) {
			judgeCounts[$(selects[a]).val()]++;
		}
		judgeCounts.forEach((judge, index) => {
			if (judge > 1 && index !== 0) {
				for (let a = 0; a < selects.length; a++) {
					if ($(selects[a]).val() == index) {
						$(selects[a]).css("background-color", "#ff9999");
						$(selects[a]).attr("title", "Judge is assigned to multiple rounds.");
						assignmentsValid = false;
					}
				}
			}
		});
	}
	return assignmentsValid;
}

function screenCheckedIn() {
	let selects = $(".judgeSelect");
	return new Promise((resolve, reject) => {
		getAllJudges().then((judges) => {
			let assignmentsValid = true;
			for (let a = 0; a < selects.length; a++) {
				judges.forEach((judge) => {
					if ($(selects[a]).val() == judge.id && judge.checkedIn == 0) {
						$(selects[a]).css("background-color", "#ccffff");
						$(selects[a]).attr("title", "Judge is not checked in.");
						assignmentsValid = false;
					}
				});
			}
			resolve(assignmentsValid);
		});
	});

}

async function screenAssignments() {
	$(".judgeSelect").css("background-color", "#e9e9ed");
	await screenCheckedIn();
	let pastRoundValid = await screenPastRoundConflicts();
	let affiliationsValid = await screenAffiliationConflicts();
	let doubleAssigmentsValid = screenDoubleAssignments();
	$(".judgeSelect").tooltip();
	if (pastRoundValid && affiliationsValid && doubleAssigmentsValid) {
		return true;
	} else {
		return false;
	}
}

function shuffle(array) {
	//CC BY-SA 4.0 https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {

		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}

function highlightAssigned() {
	//determine current round so only judges assigned in that round are highlighted
	let currentRound = 1;
	pairings.forEach(pairing => {
		if (pairing.round > currentRound) {
			currentRound = pairing.round;
		}
	});

	let currentRoundSelects = $(`#round${currentRound}`).children().children().children().children().children(".judgeSelect");
	let checkIns = $(".checkIn");

	for (let a = 0; a < checkIns.length; a++) {
		$($(".checkIn")[a]).parent().parent().css("background-color", "#ffffff");
		let checkInValue = $(checkIns[a]).attr("judge");
		for (let b = 0; b < currentRoundSelects.length; b++) {
			let selectValue = $(currentRoundSelects[b]).val();
			if (checkInValue == selectValue) {
				$($(".checkIn")[a]).parent().parent().css("background-color", "#ccffcc");
			}
		}
	}
}