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

if (
	isset($_POST["password"])
) {
	$password = $_POST["password"];
	$hash = hash("sha512", $password);
	//Hash for admin password ()
	if ($hash == "c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec") {
		session_start();
		$_SESSION["isAdmin"] = true;
		$_SESSION["isUser"] = false;
		echo json_encode(array("message" => 0));
		//hash for judge checkin password ()
	} elseif ($hash == "b14361404c078ffd549c03db443c3fede2f3e534d73f78f77301ed97d4a436a9fd9db05ee8b325c0ad36438b43fec8510c204fc1c1edb21d0941c00e9e2c1ce2") {
		session_start();
		$_SESSION["isUser"] = true;
		$_SESSION["isAdmin"] = false;
		echo json_encode(array("message" => 0));
	} else {
		echo json_encode(array("message" => 1));
	}
}
