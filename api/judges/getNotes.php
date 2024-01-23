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
if ($_SESSION["isAdmin"] || $_SESSION["isUser"]) {
	if (
		isset($_GET["judgeId"])
	) {
		$id = htmlspecialchars(strip_tags($_GET["judgeId"]));
		try {
			$db = new Database();
			$conn = $db->getConnection();
			$stmt = $conn->prepare("SELECT notes FROM judges WHERE id = :id");
			$stmt->bindParam(':id', $id);
			$stmt->execute();
			$result = $stmt->setFetchMode(PDO::FETCH_ASSOC);
			echo json_encode($stmt->fetchAll());
		} catch (PDOException $e) {
			echo "Error: " . $e->getMessage();
		}
		$conn = null;
	}
} else {
	$_SESSION["isAdmin"] = false;
	echo json_encode(array("message" => -1));
}
