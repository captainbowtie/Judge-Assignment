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
	if ($hash == "cc4f766d0dede9be858b0f8808b89b88b5321e0f6fa5d579ce1c05ade1e8aa363c9a4fedaed990d9127931b27da27ad982a2720e192b247491c2779cdbd8f058") {
		session_start();
		$_SESSION["isAdmin"] = true;
		$_SESSION["isUser"] = false;
		echo json_encode(array("message" => 0));
		//hash for judge checkin password ()
	} elseif ($hash == "7fd8937d2571ecb46ab31617fb8a468557fbe2a90bd9b7a32545fef745a74a4937e5f7666abf59a2b4bcad8ad7412e828139a4a04ee610c524773ce72fa26d45") {
		session_start();
		$_SESSION["isUser"] = true;
		$_SESSION["isAdmin"] = false;
		echo json_encode(array("message" => 0));
	} else {
		echo json_encode(array("message" => 1));
	}
}
