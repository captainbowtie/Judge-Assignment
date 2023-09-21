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

// Get config information
require_once __DIR__ . "/../config.php";
require_once SITE_ROOT . "/database.php";

// Create db connection
$db = new Database();
$conn = $db->getConnection();

//Query to create table
$query = "CREATE TABLE IF NOT EXISTS pairings (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
round INT(1) UNSIGNED NOT NULL,
room VARCHAR(32) DEFAULT 'N/A',
plaintiff SMALLINT UNSIGNED NOT NULL,
defense SMALLINT UNSIGNED NOT NULL
)";

$conn->exec($query);
$conn = null;
