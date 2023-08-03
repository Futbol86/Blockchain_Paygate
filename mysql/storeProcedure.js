DELIMITER //

CREATE PROCEDURE `p2` ()
LANGUAGE SQL
DETERMINISTIC
SQL SECURITY DEFINER
COMMENT 'A procedure'
BEGIN
	SELECT 'Hello World!';
END //


// call procedure
CALL store_procedure(param1, param2)

// Alter Procedure
// Drop Procedure

DELIMITER //

CREATE PROCEDURE `proc_OUT` (OUT var1 VARCHAR(100))
BEGIN 
	 SET var1 = 'This is a test';
END //

DECLARE a,b INT DEFAULT 5;
DECLARE str VARCHAR(50);
DECLARE today TIMESTAMP DEFAULT CURRENT_DATE;
DECLARE v1, v2, v3 TINYINT;

// Example 

DELIMITER //

CREATE PROCEDURE `var_proc` (IN paramstr VARCHAR(20))
BEGIN
	DECLARE a,b INT DEFAULT 5;
	DECLARE str VARCHAR(50);
	DECLARE today TIMESTAMP DEFAULT CURRENT_DATE;
	DECLARE v1,v2,v3 TINYINT;

	INSERT INTO table1 VALUES (a);
	SET str = 'I am a string';
	SELECT CONCAT(str, paramstr), today FROM table2 WHERE b >= 5;
END //

DELIMITER //

CREATE PROCEDURE `proc_IF` (IN param1 INT)
BEGIN
	DECLARE variable1 INT;
	SET variable1 = param1 + 1;

	IF variable1 = 0 THEN
		SELECT variable1;
	END IF;

	IF param1 = 0 THEN
		SELECT ' Parameter value = 0';
	ELSE 
		SELECT ' Parameter value <> 0';
	END IF;
END //