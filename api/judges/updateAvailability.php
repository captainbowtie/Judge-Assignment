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
session_start();
if (!empty($_SESSION["isAdmin"]) || !empty($_SESSION["isUser"])) {
	if (
		isset($_POST["id"]) &&
		isset($_POST["round"]) &&
		isset($_POST["availability"])
	) {
		$id = htmlspecialchars(strip_tags($_POST["id"]));
		$round = $_POST["round"];
		$availability = $_POST["availability"];

		// whitelist: column names can't be bound, so only these exact values may reach the SQL
		if (!in_array($round, ["1", "2", "3", "4"], true) || !in_array($availability, ["0", "1"], true)) {
			http_response_code(400);
			echo json_encode(array("message" => "Invalid round or availability."));
			exit;
		}

		if (updateJudge($id, $round, (int)$availability)) {
			http_response_code(201);
			echo json_encode(array("message" => 0));
		} else {
			http_response_code(503);
			echo json_encode(array("message" => "Unable to update judge."));
		}
	} else {
		http_response_code(400);
		echo json_encode(array("message" => "Unable to update judge. Data is incomplete."));
	}
} else {
	$_SESSION["isAdmin"] = false;
	echo json_encode(array("message" => -1));
}
function updateJudge($id, $round, $availability)
{
	$column = "round" . (int)$round; // safe: $round is already 1-4
	$db = new Database();
	$conn = $db->getConnection();
	$stmt = $conn->prepare("UPDATE judges SET $column = :availability WHERE id = :id");
	$stmt->bindParam(':availability', $availability, PDO::PARAM_INT);
	$stmt->bindParam(':id', $id);
	$stmt->execute();
	$conn = null;
	return true;
}
