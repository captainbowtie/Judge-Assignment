<?php

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

require_once __DIR__ . "/../../config.php";
require_once SITE_ROOT . "/database.php";
$_POST = json_decode(file_get_contents('php://input'), true);

session_start();
if ($_SESSION["isAdmin"]) {
	if (
		isset($_POST["assignments"])
	) {
		$assignments = array();
		foreach ($_POST["assignments"] as &$assignment) {
			$pairing = htmlspecialchars(strip_tags($assignment["pairing"]));
			$judge = htmlspecialchars(strip_tags($assignment["judge"]));
			array_push($assignments, array("pairing" => $pairing, "judge" => $judge));
		}


		if (createAssignments($assignments)) {
			// set response code - 201 created
			http_response_code(201);

			// tell the user
			echo json_encode(array("message" => 0));
		} else {

			// set response code - 503 service unavailable
			http_response_code(503);

			// tell the user
			echo json_encode(array("message" => "Unable to create assignments."));
		}
	} else {

		// set response code - 400 bad request
		http_response_code(400);

		// tell the user
		echo json_encode(array("message" => "Unable to create assignments. Data is incomplete."));
	}
} else {
	$_SESSION["isAdmin"] = false;
	echo json_encode(array("message" => -1));
}
function createAssignments($assignments)
{

	$assignmentsCreated = false;
	$db = new Database();
	$conn = $db->getConnection();
	$deleteStmt = $conn->prepare("DELETE FROM assignments WHERE pairing=:pairing");
	foreach ($assignments as $assignment) {
		$deleteStmt->bindParam(':pairing', $assignment["pairing"]);
		$deleteStmt->execute();
	}
	$createStmt = $conn->prepare("INSERT INTO assignments (pairing, judge) VALUES (:pairing, :judge)");
	foreach ($assignments as $assignment) {
		$createStmt->bindParam(':pairing', $assignment["pairing"]);
		$createStmt->bindParam(':judge', $assignment["judge"]);
		$createStmt->execute();
	}
	$conn = null;
	$assignmentsCreated = true;
	return $assignmentsCreated;
}
