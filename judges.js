let judges;

function getJudges() {
	$.get("api/judges/getAll.php", function (data) {
		judges = data;
	}, "json");
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
	rowHTML += "<button class='delete'>Delete</button>";
	rowHTML += "</td><td>";
	rowHTML += `<input type='checkbox' class='checkedIn' ${(judge.checkedIn == 1) ? 'checked' : ''}>`;
	rowHTML += "</td></tr>"

	return rowHTML;
}

function fillTable() {
	let tableHTML = "";
	function appendHTML(judge) {
		tableHTML += createJudgeRow(judge);
	}
	judges.forEach(appendHTML);
	$("#judges").html(tableHTML);
}