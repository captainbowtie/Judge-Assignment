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

if (
	isset($_POST["name"]) &&
	isset($_POST["category"])
) {
	$name = htmlspecialchars(strip_tags($_POST["name"]));
	$category = htmlspecialchars(strip_tags($_POST["category"]));

	if (createJudge($name, $category)) {
		// set response code - 201 created
		http_response_code(201);

		// tell the user
		echo json_encode(array("message" => 0));
	} else {

		// set response code - 503 service unavailable
		http_response_code(503);

		// tell the user
		echo json_encode(array("message" => "Unable to create judge."));
	}
} else {

	// set response code - 400 bad request
	http_response_code(400);

	// tell the user
	echo json_encode(array("message" => "Unable to create judge. Data is incomplete."));
}

function createJudge($name, $category)
{

	$judgeCreated = false;
	$db = new Database();
	$conn = $db->getConnection();
	$stmt = $conn->prepare("INSERT INTO judges (name, category) VALUES (:name, :category)");
	$stmt->bindParam(':name', $name);
	$stmt->bindParam(':category', $category);
	$stmt->execute();
	$conn = null;
	$judgeCreated = true;
	return $judgeCreated;
}
