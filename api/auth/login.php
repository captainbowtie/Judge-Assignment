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
	if ($hash == "faa1637700db70020a5cd82f3b5663479f4d7b3b67a9c871a79c9ee5fb450437c4ffd29c4e3c0b0911e7a637a578fe747ca5370e14baaffe24732b3e3f1cbaf3") {
		session_start();
		$_SESSION["isAdmin"] = true;
		echo json_encode(array("message" => 0));
	} else {
		echo json_encode(array("message" => 1));
	}
}
