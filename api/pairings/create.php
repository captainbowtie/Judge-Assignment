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
		isset($_POST["round"]) &&
		isset($_POST["pairings"])
	) {
		$round = htmlspecialchars(strip_tags($_POST["round"]));
		$pairings = array();
		foreach ($_POST["pairings"] as &$pairing) {
			$rank = htmlspecialchars(strip_tags($pairing["rank"]));
			$room = htmlspecialchars(strip_tags($pairing["room"]));
			$plaintiff = htmlspecialchars(strip_tags($pairing["plaintiff"]));
			$defense = htmlspecialchars(strip_tags($pairing["defense"]));
			array_push($pairings, array("rank" => $rank, "room" => $room, "plaintiff" => $plaintiff, "defense" => $defense));
		}


		if (createPairings($round, $pairings)) {
			// set response code - 201 created
			http_response_code(201);

			// tell the user
			echo json_encode(array("message" => 0));
		} else {

			// set response code - 503 service unavailable
			http_response_code(503);

			// tell the user
			echo json_encode(array("message" => "Unable to create pairings."));
		}
	} else {

		// set response code - 400 bad request
		http_response_code(400);

		// tell the user
		echo json_encode(array("message" => "Unable to create pairings. Data is incomplete."));
	}
} else {
	$_SESSION["isAdmin"] = false;
	echo json_encode(array("message" => -1));
}
function createPairings($round, $pairings)
{

	$pairingsCreated = false;
	$db = new Database();
	$conn = $db->getConnection();
	//get ids of existing pairings for the round so their corresponding assignments can be deleted
	$existingPairingsStmt = $conn->prepare("SELECT id FROM pairings WHERE round=:round");
	$existingPairingsStmt->bindParam(':round', $round);
	$existingPairingsStmt->execute();
	$existingPairingsResult = $existingPairingsStmt->fetchAll(PDO::FETCH_ASSOC);
	//delete existing pairings from assignments
	$deleteAssignmentsStmt = $conn->prepare("DELETE FROM assignments WHERE pairing=:pairing");
	foreach ($existingPairingsResult as $pairing) {
		$deleteAssignmentsStmt->bindParam(':pairing', $pairing["id"]);
		$deleteAssignmentsStmt->execute();
	}
	//delete old pairings
	$deletePairingsStmt = $conn->prepare("DELETE FROM pairings WHERE round=:round");
	$deletePairingsStmt->bindParam(':round', $round);
	$deletePairingsStmt->execute();
	//create the new pairings
	$createStmt = $conn->prepare("INSERT INTO pairings (round, rank, room, plaintiff, defense) VALUES (:round, :rank, :room, :plaintiff, :defense)");
	$createStmt->bindParam(':round', $round);
	foreach ($pairings as &$pairing) {
		$createStmt->bindParam(':rank', $pairing["rank"]);
		$createStmt->bindParam(':room', $pairing["room"]);
		$createStmt->bindParam(':plaintiff', $pairing["plaintiff"]);
		$createStmt->bindParam(':defense', $pairing["defense"]);
		$createStmt->execute();
	}
	$conn = null;
	$pairingsCreated = true;
	return $pairingsCreated;
}
