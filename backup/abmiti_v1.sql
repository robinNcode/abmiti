/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 8.0.46-0ubuntu0.24.04.3 : Database - abmiti_v1
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`abmiti_v1` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `abmiti_v1`;

/*Table structure for table `accounts` */

DROP TABLE IF EXISTS `accounts`;

CREATE TABLE `accounts` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('bank','mobile') NOT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `provider` enum('bkash','nagad','rocket') DEFAULT NULL,
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_accounts_user_type` (`user_id`,`type`),
  KEY `idx_accounts_user_active` (`user_id`,`is_active`),
  CONSTRAINT `fk_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `accounts` */

/*Table structure for table `budget_line_categories` */

DROP TABLE IF EXISTS `budget_line_categories`;

CREATE TABLE `budget_line_categories` (
  `budget_line_id` varchar(36) NOT NULL,
  `category_id` varchar(36) NOT NULL,
  PRIMARY KEY (`budget_line_id`,`category_id`),
  KEY `fk_budget_line_categories_category` (`category_id`),
  CONSTRAINT `fk_budget_line_categories_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_line_categories_line` FOREIGN KEY (`budget_line_id`) REFERENCES `budget_lines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `budget_line_categories` */

/*Table structure for table `budget_lines` */

DROP TABLE IF EXISTS `budget_lines`;

CREATE TABLE `budget_lines` (
  `id` varchar(36) NOT NULL,
  `budget_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `icon` varchar(20) DEFAULT 'icon',
  `color` varchar(7) DEFAULT '#4A7C59',
  `allocation_method` enum('percentage','fixed') NOT NULL,
  `allocation_value` decimal(10,4) NOT NULL,
  `sort_order` smallint DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `note` text,
  PRIMARY KEY (`id`),
  KEY `idx_budget_lines_budget` (`budget_id`),
  CONSTRAINT `fk_budget_lines_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `budget_lines` */

insert  into `budget_lines`(`id`,`budget_id`,`name`,`icon`,`color`,`allocation_method`,`allocation_value`,`sort_order`,`is_active`,`note`) values 
('1807e9eb-968e-4b75-9a19-b9d9c601fca1','93b2760e-e69b-455a-9572-4a2891cceb74','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('1dfd770f-f555-4419-95c2-8559bead4707','e94b671e-e762-4229-8ae6-431ec266ab15','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('400f7174-3c80-4cf5-af3f-30af71db098d','e94b671e-e762-4229-8ae6-431ec266ab15','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('416386dc-ce1d-4c60-b5a0-a2c90ba964e2','e94b671e-e762-4229-8ae6-431ec266ab15','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('5de518f0-77a1-437d-a44a-4861780365a9','93b2760e-e69b-455a-9572-4a2891cceb74','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('77e5de45-9b6b-454e-abf4-b51285bb6258','93b2760e-e69b-455a-9572-4a2891cceb74','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('90c62882-66c1-47f9-9008-8f30158d188c','e94b671e-e762-4229-8ae6-431ec266ab15','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('9a95825a-13a0-473a-99d9-d33beccbaa58','93b2760e-e69b-455a-9572-4a2891cceb74','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('d390ba4e-80f7-41ae-8a24-0ff746695bb1','93b2760e-e69b-455a-9572-4a2891cceb74','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('e09f8e1b-4b0b-40a7-b642-77ed7d870395','e94b671e-e762-4229-8ae6-431ec266ab15','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('e1cfb876-9092-4d91-b32d-f0b3d1f9f719','93b2760e-e69b-455a-9572-4a2891cceb74','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('ee27ee0a-1632-4add-8a1b-8028e5c06d0f','e94b671e-e762-4229-8ae6-431ec266ab15','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations');

/*Table structure for table `budget_sub_items` */

DROP TABLE IF EXISTS `budget_sub_items`;

CREATE TABLE `budget_sub_items` (
  `id` varchar(36) NOT NULL,
  `budget_line_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `expected_amount` decimal(15,2) NOT NULL,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `fk_budget_sub_items_line` (`budget_line_id`),
  CONSTRAINT `fk_budget_sub_items_line` FOREIGN KEY (`budget_line_id`) REFERENCES `budget_lines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `budget_sub_items` */

/*Table structure for table `budgets` */

DROP TABLE IF EXISTS `budgets`;

CREATE TABLE `budgets` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `month` tinyint unsigned NOT NULL,
  `year` smallint unsigned NOT NULL,
  `total_income` decimal(15,2) NOT NULL DEFAULT '0.00',
  `is_template` tinyint(1) NOT NULL DEFAULT '0',
  `template_name` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_month_year_template` (`user_id`,`month`,`year`,`is_template`),
  CONSTRAINT `fk_budgets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `budgets` */

insert  into `budgets`(`id`,`user_id`,`month`,`year`,`total_income`,`is_template`,`template_name`,`notes`,`created_at`,`updated_at`) values 
('93b2760e-e69b-455a-9572-4a2891cceb74','6207fcb0-21de-4479-99e7-9af9f6b1f1f4',6,2026,50000.00,1,'6/2026 Budget',NULL,'2026-06-23 18:12:47','2026-06-23 18:12:47'),
('e94b671e-e762-4229-8ae6-431ec266ab15','6207fcb0-21de-4479-99e7-9af9f6b1f1f4',6,2026,50000.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-06-23 18:09:59','2026-06-23 18:11:48');

/*Table structure for table `categories` */

DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon` varchar(20) NOT NULL DEFAULT 0xF09F93A6,
  `color` varchar(20) NOT NULL DEFAULT '#c2552a',
  `type` enum('income','expense','savings','investment','payable','receivable') NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_category` (`user_id`,`name`,`type`),
  KEY `idx_cat_user_type` (`user_id`,`type`),
  CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `categories` */

insert  into `categories`(`id`,`user_id`,`name`,`icon`,`color`,`type`,`is_default`,`created_at`) values 
('0eccbae9-7a24-44d9-8a14-493c077b8b5d','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','Home Rent','?','#e74c3c','expense',0,'2026-06-22 10:43:46'),
('2dbeaf33-83da-4732-b8d7-25625aee9cfc','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','Varisty Expense','?','#c2552a','expense',0,'2026-06-22 10:52:32'),
('35bf24f2-8c46-4f0f-9a9c-84f8d51bd19f','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','Monthly Salary','?','#1abc9c','income',0,'2026-06-22 10:44:34'),
('6683c3a9-ccf8-436c-8896-93cea70a881c','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','Monthly Goceries','?️','#c2552a','expense',0,'2026-06-22 10:53:01'),
('9f65f6c4-2e08-4fd4-8fc7-689fa695980e','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','Hospital Treatment','?','#c2552a','expense',0,'2026-06-22 10:52:46'),
('a5c67e5b-e0ba-47dc-a036-130074da478c','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','Sajib\'s Repayment','?','#c2552a','expense',0,'2026-06-22 11:02:27');

/*Table structure for table `entries` */

DROP TABLE IF EXISTS `entries`;

CREATE TABLE `entries` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` enum('income','expense','savings','investment','payable','receivable') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `note` varchar(300) NOT NULL DEFAULT '',
  `category_id` varchar(36) NOT NULL,
  `source` enum('bank','bkash','nagad','cash','card','other') NOT NULL DEFAULT 'cash',
  `account_id` varchar(36) DEFAULT NULL,
  `sector` varchar(120) NOT NULL DEFAULT '',
  `date` date NOT NULL,
  `parsed_from_sms` tinyint(1) NOT NULL DEFAULT '0',
  `raw_sms` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entries_user_date` (`user_id`,`date` DESC),
  KEY `idx_entries_user_type_date` (`user_id`,`type`,`date` DESC),
  KEY `idx_entries_user_category` (`user_id`,`category_id`),
  KEY `fk_entries_category` (`category_id`),
  KEY `fk_entries_account` (`account_id`),
  CONSTRAINT `fk_entries_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_entries_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `entries` */

insert  into `entries`(`id`,`user_id`,`type`,`amount`,`note`,`category_id`,`source`,`account_id`,`sector`,`date`,`parsed_from_sms`,`raw_sms`,`created_at`,`updated_at`) values 
('1c833928-9af2-4493-983c-ac68264ec308','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','income',46834.25,'Monthly Salary','35bf24f2-8c46-4f0f-9a9c-84f8d51bd19f','bank',NULL,'','2026-06-11',0,NULL,'2026-06-22 10:51:26','2026-06-22 10:51:26'),
('4b39b0ca-70ff-4e87-b1f2-01d46534fdf7','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','expense',11000.00,'Monthly House Rent','0eccbae9-7a24-44d9-8a14-493c077b8b5d','cash',NULL,'','2026-06-16',0,NULL,'2026-06-22 10:51:52','2026-06-22 10:51:52'),
('747b7959-1ba7-41dc-b7d7-f5e1e8af1d47','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','expense',15000.00,'Wise Varsity Expense','2dbeaf33-83da-4732-b8d7-25625aee9cfc','cash',NULL,'','2026-06-21',0,NULL,'2026-06-22 10:54:39','2026-06-22 10:54:39'),
('ee81be70-1b5c-41d3-bd68-6ef6f55f3156','6207fcb0-21de-4479-99e7-9af9f6b1f1f4','expense',6000.00,'95k due','a5c67e5b-e0ba-47dc-a036-130074da478c','bank',NULL,'','2026-06-13',0,NULL,'2026-06-22 11:03:30','2026-06-22 11:03:30');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `budget` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`name`,`email`,`password`,`budget`,`created_at`,`updated_at`) values 
('6207fcb0-21de-4479-99e7-9af9f6b1f1f4','Test1','test@abmiti.com','$2a$12$Rvv71kcb6lZx/UUKNjaeKOUx3FNvE8ybstL9DNO5NlcJIl0hdHw8S',30000.00,'2026-06-22 10:31:37','2026-06-22 11:06:38');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
