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
if ($_SESSION["isAdmin"]) {
	if (
		isset($_GET["judgeId"])
	) {
		$judgeId = htmlspecialchars(strip_tags($_GET["judgeId"]));

		getConflicts($judgeId);
	} else {

		// set response code - 400 bad request
		http_response_code(400);

		// tell the user
		echo json_encode(array("message" => "Unable to get conflicts. Data is incomplete."));
	}
} else {
	$_SESSION["isAdmin"] = false;
	echo json_encode(array("message" => -1));
}
function getConflicts($judgeId)
{
	try {
		$db = new Database();
		$conn = $db->getConnection();
		$stmt = $conn->prepare("SELECT id,judge,team FROM conflicts WHERE judge=:judgeId ORDER BY team");
		$stmt->bindParam(':judgeId', $judgeId);
		$stmt->execute();
		$result = $stmt->setFetchMode(PDO::FETCH_ASSOC);
		echo json_encode($stmt->fetchAll());
	} catch (PDOException $e) {
		echo "Error: " . $e->getMessage();
	}
	$conn = null;
}
