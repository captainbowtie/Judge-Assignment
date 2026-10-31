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

if (isset($_POST["password"])) {
	$password = $_POST["password"];
	session_start();
	if (password_verify($password, ADMIN_HASH)) {
		session_regenerate_id(true);
		$_SESSION["isAdmin"] = true;
		$_SESSION["isUser"] = false;
		echo json_encode(array("message" => 0));
	} elseif (password_verify($password, USER_HASH)) {
		session_regenerate_id(true);
		$_SESSION["isUser"] = true;
		$_SESSION["isAdmin"] = false;
		echo json_encode(array("message" => 0));
	} else {
		sleep(1);
		echo json_encode(array("message" => 1));
	}
}