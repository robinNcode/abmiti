/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 10.4.32-MariaDB : Database - robinncode_abmiti_v1
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`robinncode_abmiti_v1` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `robinncode_abmiti_v1`;

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
  `balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_accounts_user_type` (`user_id`,`type`),
  KEY `idx_accounts_user_active` (`user_id`,`is_active`),
  CONSTRAINT `fk_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `accounts` */

/*Table structure for table `blog_posts` */

DROP TABLE IF EXISTS `blog_posts`;

CREATE TABLE `blog_posts` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext NOT NULL,
  `published` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `thumbnail_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `blog_posts` */

/*Table structure for table `budget_line_categories` */

DROP TABLE IF EXISTS `budget_line_categories`;

CREATE TABLE `budget_line_categories` (
  `budget_line_id` varchar(36) NOT NULL,
  `budget_id` varchar(36) NOT NULL,
  `category_id` varchar(36) NOT NULL,
  PRIMARY KEY (`budget_line_id`,`category_id`),
  UNIQUE KEY `uq_budget_line_categories_budget_category` (`budget_id`,`category_id`),
  KEY `fk_budget_line_categories_category` (`category_id`),
  CONSTRAINT `fk_budget_line_categories_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_line_categories_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_line_categories_line` FOREIGN KEY (`budget_line_id`) REFERENCES `budget_lines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `budget_line_categories` */

insert  into `budget_line_categories`(`budget_line_id`,`budget_id`,`category_id`) values 
('86bef0e8-bc58-43ef-a7ff-e275b70acc13','3ab854d9-b718-47b5-b80c-6030441a8020','198ebd51-07e4-4232-970e-f6c32c218d9c'),
('dbc0267a-38de-4437-a37a-032368f5b2e1','3ab854d9-b718-47b5-b80c-6030441a8020','239c8cbb-c29d-4aa1-92a0-a96e9b6d0385'),
('dbc0267a-38de-4437-a37a-032368f5b2e1','3ab854d9-b718-47b5-b80c-6030441a8020','51eea70b-f46d-4946-aec5-205127abae4d'),
('c9b0cdce-2503-4c5d-9bc8-65001f5b6062','3ab854d9-b718-47b5-b80c-6030441a8020','574abbc3-311f-46e9-9089-64ae8b67d61a'),
('b9c02985-667c-47ab-b28a-46f937f372a0','3ab854d9-b718-47b5-b80c-6030441a8020','b7456d8e-2651-4d31-9ab0-33523ee86749'),
('c9b0cdce-2503-4c5d-9bc8-65001f5b6062','3ab854d9-b718-47b5-b80c-6030441a8020','d6958b18-e58a-44af-9130-11c8190d9dba'),
('8d0655fd-bab1-4ae8-8c79-73afc4d25e9b','3ab854d9-b718-47b5-b80c-6030441a8020','dcd9a68a-00a2-48f4-b18a-2dae1459bc02'),
('e6efbec6-790a-4dc9-b25f-eb873df5f2c0','3ab854d9-b718-47b5-b80c-6030441a8020','e312f901-b724-405a-877a-2044ea6b8667'),
('dbc0267a-38de-4437-a37a-032368f5b2e1','3ab854d9-b718-47b5-b80c-6030441a8020','e32c88b8-715c-4010-a24e-81ab8643b54f'),
('dbc0267a-38de-4437-a37a-032368f5b2e1','3ab854d9-b718-47b5-b80c-6030441a8020','e9814712-dd40-41f6-bb0d-48660a9d8593'),
('af2f6bf7-da91-49f4-be3b-1606ad9a6280','d69075d7-177d-49be-ba47-f5de55a29583','198ebd51-07e4-4232-970e-f6c32c218d9c'),
('95d18d60-17f2-4fce-a881-67c732357dfe','d69075d7-177d-49be-ba47-f5de55a29583','239c8cbb-c29d-4aa1-92a0-a96e9b6d0385'),
('95d18d60-17f2-4fce-a881-67c732357dfe','d69075d7-177d-49be-ba47-f5de55a29583','51eea70b-f46d-4946-aec5-205127abae4d'),
('635cf38e-a943-4e31-9b32-87a307dd0f66','d69075d7-177d-49be-ba47-f5de55a29583','574abbc3-311f-46e9-9089-64ae8b67d61a'),
('db691b9c-80c1-41c8-9024-3d7f0acd3de5','d69075d7-177d-49be-ba47-f5de55a29583','b7456d8e-2651-4d31-9ab0-33523ee86749'),
('635cf38e-a943-4e31-9b32-87a307dd0f66','d69075d7-177d-49be-ba47-f5de55a29583','d6958b18-e58a-44af-9130-11c8190d9dba'),
('f64b5f47-4389-4462-bedf-13162fa9d11c','d69075d7-177d-49be-ba47-f5de55a29583','dcd9a68a-00a2-48f4-b18a-2dae1459bc02'),
('0ba6f845-3e90-4bfe-9f9d-bbb64683a27b','d69075d7-177d-49be-ba47-f5de55a29583','e312f901-b724-405a-877a-2044ea6b8667'),
('95d18d60-17f2-4fce-a881-67c732357dfe','d69075d7-177d-49be-ba47-f5de55a29583','e32c88b8-715c-4010-a24e-81ab8643b54f'),
('95d18d60-17f2-4fce-a881-67c732357dfe','d69075d7-177d-49be-ba47-f5de55a29583','e9814712-dd40-41f6-bb0d-48660a9d8593');

/*Table structure for table `budget_lines` */

DROP TABLE IF EXISTS `budget_lines`;

CREATE TABLE `budget_lines` (
  `id` varchar(36) NOT NULL,
  `budget_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `icon` varchar(20) DEFAULT '?',
  `color` varchar(7) DEFAULT '#4A7C59',
  `allocation_method` enum('percentage','fixed') NOT NULL,
  `allocation_value` decimal(10,4) NOT NULL,
  `sort_order` smallint(6) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_budget_lines_budget` (`budget_id`),
  CONSTRAINT `fk_budget_lines_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `budget_lines` */

insert  into `budget_lines`(`id`,`budget_id`,`name`,`icon`,`color`,`allocation_method`,`allocation_value`,`sort_order`,`is_active`,`note`) values 
('0ba6f845-3e90-4bfe-9f9d-bbb64683a27b','d69075d7-177d-49be-ba47-f5de55a29583','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('635cf38e-a943-4e31-9b32-87a307dd0f66','d69075d7-177d-49be-ba47-f5de55a29583','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('86bef0e8-bc58-43ef-a7ff-e275b70acc13','3ab854d9-b718-47b5-b80c-6030441a8020','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('8d0655fd-bab1-4ae8-8c79-73afc4d25e9b','3ab854d9-b718-47b5-b80c-6030441a8020','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('95d18d60-17f2-4fce-a881-67c732357dfe','d69075d7-177d-49be-ba47-f5de55a29583','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('af2f6bf7-da91-49f4-be3b-1606ad9a6280','d69075d7-177d-49be-ba47-f5de55a29583','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('b9c02985-667c-47ab-b28a-46f937f372a0','3ab854d9-b718-47b5-b80c-6030441a8020','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('c9b0cdce-2503-4c5d-9bc8-65001f5b6062','3ab854d9-b718-47b5-b80c-6030441a8020','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('db691b9c-80c1-41c8-9024-3d7f0acd3de5','d69075d7-177d-49be-ba47-f5de55a29583','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('dbc0267a-38de-4437-a37a-032368f5b2e1','3ab854d9-b718-47b5-b80c-6030441a8020','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('e6efbec6-790a-4dc9-b25f-eb873df5f2c0','3ab854d9-b718-47b5-b80c-6030441a8020','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('f64b5f47-4389-4462-bedf-13162fa9d11c','d69075d7-177d-49be-ba47-f5de55a29583','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs');

/*Table structure for table `budget_sub_items` */

DROP TABLE IF EXISTS `budget_sub_items`;

CREATE TABLE `budget_sub_items` (
  `id` varchar(36) NOT NULL,
  `budget_line_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `expected_amount` decimal(15,2) NOT NULL,
  `note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_budget_sub_items_line` (`budget_line_id`),
  CONSTRAINT `fk_budget_sub_items_line` FOREIGN KEY (`budget_line_id`) REFERENCES `budget_lines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `budget_sub_items` */

insert  into `budget_sub_items`(`id`,`budget_line_id`,`name`,`expected_amount`,`note`) values 
('05cbfd9f-ab2e-4237-b5bc-8ef18e1d18a0','dbc0267a-38de-4437-a37a-032368f5b2e1','Groceries',0.00,NULL),
('0cde2b5c-11a3-4cd3-8a3b-71e6a4e210a8','95d18d60-17f2-4fce-a881-67c732357dfe','Gas Bill',0.00,NULL),
('23bbdd10-d8a2-41b2-a2be-912a4e662f41','95d18d60-17f2-4fce-a881-67c732357dfe','Home Rent',0.00,NULL),
('2690bd3b-de2e-4de9-832d-1017caadd255','95d18d60-17f2-4fce-a881-67c732357dfe','Groceries',0.00,NULL),
('26f45302-a2c4-4042-9749-ef82d0dfa599','dbc0267a-38de-4437-a37a-032368f5b2e1','Home Rent',0.00,NULL),
('2a973b0a-b776-4951-b4af-bbe3a692d831','95d18d60-17f2-4fce-a881-67c732357dfe','Electricity Bill',0.00,NULL),
('4924f4e5-f0b2-4672-b96a-16a79a71416c','95d18d60-17f2-4fce-a881-67c732357dfe','College Fee',0.00,NULL),
('b1a33bbf-b418-437e-855b-20f00afedbbc','dbc0267a-38de-4437-a37a-032368f5b2e1','College Fee',0.00,NULL),
('d6dbf0b0-bca2-4cb1-9c2c-fa064c11cbbf','dbc0267a-38de-4437-a37a-032368f5b2e1','Electricity Bill',0.00,NULL),
('e7622bee-c8de-4a64-94e9-8799bcc5c927','dbc0267a-38de-4437-a37a-032368f5b2e1','Gas Bill',0.00,NULL);

/*Table structure for table `budgets` */

DROP TABLE IF EXISTS `budgets`;

CREATE TABLE `budgets` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `month` tinyint(3) unsigned NOT NULL,
  `year` smallint(5) unsigned NOT NULL,
  `total_income` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_template` tinyint(1) NOT NULL DEFAULT 0,
  `template_name` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_month_year_template` (`user_id`,`month`,`year`,`is_template`),
  CONSTRAINT `fk_budgets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `budgets` */

insert  into `budgets`(`id`,`user_id`,`month`,`year`,`total_income`,`is_template`,`template_name`,`notes`,`created_at`,`updated_at`) values 
('3ab854d9-b718-47b5-b80c-6030441a8020','6368a950-3ef1-45f1-83ca-5215558fc329',11,2026,40000.00,1,'11/2026 Budget',NULL,'2026-11-08 00:37:31','2026-11-08 00:37:31'),
('d69075d7-177d-49be-ba47-f5de55a29583','6368a950-3ef1-45f1-83ca-5215558fc329',11,2026,40000.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-11-08 00:35:56','2026-11-08 00:36:15');

/*Table structure for table `categories` */

DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon` varchar(20) NOT NULL DEFAULT '?',
  `color` varchar(20) NOT NULL DEFAULT '#c2552a',
  `type` enum('income','expense','savings','investment','payable','receivable') NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_category` (`user_id`,`name`,`type`),
  KEY `idx_cat_user_type` (`user_id`,`type`),
  CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `categories` */

insert  into `categories`(`id`,`user_id`,`name`,`icon`,`color`,`type`,`is_default`,`created_at`) values 
('047a6dc1-aa08-4418-a6c6-cc94b92d072f','6368a950-3ef1-45f1-83ca-5215558fc329','Bank Savings','?','#27ae60','savings',1,'2026-11-08 00:35:55'),
('05120380-71de-477a-a934-636aef9bacee','6368a950-3ef1-45f1-83ca-5215558fc329','Payment Receivable','?','#3498db','receivable',1,'2026-11-08 00:35:55'),
('1689b74a-2d24-4851-a749-bc7093a22451','6368a950-3ef1-45f1-83ca-5215558fc329','Other Savings','?','#e67e22','savings',1,'2026-11-08 00:35:55'),
('198ebd51-07e4-4232-970e-f6c32c218d9c','6368a950-3ef1-45f1-83ca-5215558fc329','Health','?','#e74c3c','expense',1,'2026-11-08 00:35:55'),
('239c8cbb-c29d-4aa1-92a0-a96e9b6d0385','6368a950-3ef1-45f1-83ca-5215558fc329','Food','?','#e67e22','expense',1,'2026-11-08 00:35:54'),
('3b1827b7-33b1-4982-9064-5b6b5891ba71','6368a950-3ef1-45f1-83ca-5215558fc329','Transport','?','#2980b9','expense',1,'2026-11-08 00:35:54'),
('51eea70b-f46d-4946-aec5-205127abae4d','6368a950-3ef1-45f1-83ca-5215558fc329','Home','?','#c2552a','expense',1,'2026-11-08 00:35:54'),
('574abbc3-311f-46e9-9089-64ae8b67d61a','6368a950-3ef1-45f1-83ca-5215558fc329','Travel','✈️','#1abc9c','expense',1,'2026-11-08 00:35:55'),
('9d20e002-85e9-42ea-954c-334e7434917c','6368a950-3ef1-45f1-83ca-5215558fc329','Gift','?','#9b59b6','income',1,'2026-11-08 00:35:54'),
('ad6d7da7-0524-4171-b8c1-32559bf80027','6368a950-3ef1-45f1-83ca-5215558fc329','Loan Receivable','?','#27ae60','receivable',1,'2026-11-08 00:35:55'),
('b240f10d-4e42-46c0-8fb3-634d885e9fe9','6368a950-3ef1-45f1-83ca-5215558fc329','Other Payable','?','#95a5a6','payable',1,'2026-11-08 00:35:55'),
('b4782eb8-4da3-4634-880f-7caaa47673a3','6368a950-3ef1-45f1-83ca-5215558fc329','Loan Payable','?','#e74c3c','payable',1,'2026-11-08 00:35:55'),
('b7456d8e-2651-4d31-9ab0-33523ee86749','6368a950-3ef1-45f1-83ca-5215558fc329','Other','?','#95a5a6','expense',1,'2026-11-08 00:35:55'),
('c145f92c-d526-43bb-af22-61f39751a2f1','6368a950-3ef1-45f1-83ca-5215558fc329','Bill Payable','?','#f39c12','payable',1,'2026-11-08 00:35:55'),
('d3891192-a8a6-4587-994b-d32eb529bc1e','6368a950-3ef1-45f1-83ca-5215558fc329','Salary','?','#4a7c59','income',1,'2026-11-08 00:35:54'),
('d6958b18-e58a-44af-9130-11c8190d9dba','6368a950-3ef1-45f1-83ca-5215558fc329','Entertainment','?','#16a085','expense',1,'2026-11-08 00:35:55'),
('dcd9a68a-00a2-48f4-b18a-2dae1459bc02','6368a950-3ef1-45f1-83ca-5215558fc329','Shopping','?️','#e91e63','expense',1,'2026-11-08 00:35:55'),
('e312f901-b724-405a-877a-2044ea6b8667','6368a950-3ef1-45f1-83ca-5215558fc329','Loan','?','#c0392b','expense',1,'2026-11-08 00:35:55'),
('e32c88b8-715c-4010-a24e-81ab8643b54f','6368a950-3ef1-45f1-83ca-5215558fc329','Utility','?','#f39c12','expense',1,'2026-11-08 00:35:54'),
('e9814712-dd40-41f6-bb0d-48660a9d8593','6368a950-3ef1-45f1-83ca-5215558fc329','Education','?','#8e44ad','expense',1,'2026-11-08 00:35:54'),
('ef71bda0-8273-404a-90e3-7c1386d42696','6368a950-3ef1-45f1-83ca-5215558fc329','Business','?','#d4973e','income',1,'2026-11-08 00:35:54'),
('efe3144f-6375-46d8-a0ed-3d26c010cd5f','6368a950-3ef1-45f1-83ca-5215558fc329','Mobile Savings','?','#f1c40f','savings',1,'2026-11-08 00:35:55'),
('f508d43c-394f-4de2-a857-feab0e34f66e','6368a950-3ef1-45f1-83ca-5215558fc329','Freelance','?','#2a6dc2','income',1,'2026-11-08 00:35:54'),
('f5ed6e7a-5fb2-43df-b444-6ef1d783bcfd','6368a950-3ef1-45f1-83ca-5215558fc329','Other Receivable','?','#9b59b6','receivable',1,'2026-11-08 00:35:55'),
('ff18fd9d-8961-45f5-be93-7fe4ab250be9','6368a950-3ef1-45f1-83ca-5215558fc329','Other','?','#7f8c8d','income',1,'2026-11-08 00:35:54');

/*Table structure for table `contact_messages` */

DROP TABLE IF EXISTS `contact_messages`;

CREATE TABLE `contact_messages` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_resolved` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `contact_messages` */

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
  `parsed_from_sms` tinyint(1) NOT NULL DEFAULT 0,
  `raw_sms` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payable_id` varchar(36) DEFAULT NULL,
  `receivable_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_entries_user_date` (`user_id`,`date`),
  KEY `idx_entries_user_type_date` (`user_id`,`type`,`date`),
  KEY `idx_entries_user_category` (`user_id`,`category_id`),
  KEY `fk_entries_category` (`category_id`),
  KEY `fk_entries_account` (`account_id`),
  KEY `idx_entries_payable` (`payable_id`),
  KEY `idx_entries_receivable` (`receivable_id`),
  CONSTRAINT `fk_entries_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_entries_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_entries_payable` FOREIGN KEY (`payable_id`) REFERENCES `payables` (`id`),
  CONSTRAINT `fk_entries_receivable` FOREIGN KEY (`receivable_id`) REFERENCES `receivables` (`id`),
  CONSTRAINT `fk_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `entries` */

insert  into `entries`(`id`,`user_id`,`type`,`amount`,`note`,`category_id`,`source`,`account_id`,`sector`,`date`,`parsed_from_sms`,`raw_sms`,`created_at`,`updated_at`,`payable_id`,`receivable_id`) values 
('5a3f276d-8cec-4dc9-aff0-99aad61e5fe8','6368a950-3ef1-45f1-83ca-5215558fc329','expense',12000.00,'Home Rent','51eea70b-f46d-4946-aec5-205127abae4d','cash',NULL,'','2026-11-11',0,NULL,'2026-11-08 00:38:25','2026-11-08 00:38:25',NULL,NULL);

/*Table structure for table `notifications` */

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target_user_id` varchar(36) DEFAULT NULL,
  `read_by` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`read_by`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cleared_by` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cleared_by`)),
  PRIMARY KEY (`id`),
  KEY `idx_notification_target` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `notifications` */

/*Table structure for table `payables` */

DROP TABLE IF EXISTS `payables`;

CREATE TABLE `payables` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `counterparty` varchar(100) NOT NULL,
  `principal` decimal(15,2) NOT NULL CHECK (`principal` > 0),
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00 CHECK (`paid_amount` >= 0),
  `kind` enum('borrowed_cash','unpaid_expense') NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `account_id` varchar(36) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `note` varchar(300) DEFAULT NULL,
  `status` enum('open','settled','cancelled') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payables_user_status_due` (`user_id`,`status`,`due_date`),
  KEY `fk_payables_category` (`category_id`),
  KEY `fk_payables_account` (`account_id`),
  CONSTRAINT `fk_payables_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payables_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payables_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_payables_paid_lte_principal` CHECK (`paid_amount` <= `principal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `payables` */

/*Table structure for table `payments` */

DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `transaction_id` varchar(80) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `plan` varchar(30) NOT NULL,
  `status` varchar(20) NOT NULL,
  `gateway_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gateway_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `payments` */

/*Table structure for table `receivables` */

DROP TABLE IF EXISTS `receivables`;

CREATE TABLE `receivables` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `counterparty` varchar(100) NOT NULL,
  `principal` decimal(15,2) NOT NULL CHECK (`principal` > 0),
  `received_amount` decimal(15,2) NOT NULL DEFAULT 0.00 CHECK (`received_amount` >= 0),
  `kind` enum('lent_cash','unpaid_income') NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `account_id` varchar(36) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `note` varchar(300) DEFAULT NULL,
  `status` enum('open','settled','cancelled') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_receivables_user_status_due` (`user_id`,`status`,`due_date`),
  KEY `fk_receivables_category` (`category_id`),
  KEY `fk_receivables_account` (`account_id`),
  CONSTRAINT `fk_receivables_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_receivables_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_receivables_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_receivables_received_lte_principal` CHECK (`received_amount` <= `principal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `receivables` */

/*Table structure for table `schema_migrations` */

DROP TABLE IF EXISTS `schema_migrations`;

CREATE TABLE `schema_migrations` (
  `version` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `schema_migrations` */

insert  into `schema_migrations`(`version`,`applied_at`) values 
('000_create_schema_migrations.sql','2026-11-07 23:51:52'),
('001_create_users.sql','2026-11-07 23:51:53'),
('002_create_categories.sql','2026-11-07 23:51:53'),
('003_create_accounts.sql','2026-11-07 23:51:53'),
('004_create_entries.sql','2026-11-07 23:51:54'),
('005_migrate_budgets.sql','2026-11-07 23:51:54'),
('006_create_budget_lines.sql','2026-11-07 23:51:55'),
('007_create_budget_line_categories.sql','2026-11-07 23:51:55'),
('008_create_budget_sub_items.sql','2026-11-07 23:51:55'),
('009_add_google_oauth.sql','2026-11-07 23:51:56'),
('010_admin_content_payments.sql','2026-11-07 23:51:57'),
('011_add_blog_thumbnail.sql','2026-11-07 23:51:57'),
('012_add_is_resolved_to_contact_messages.sql','2026-11-07 23:51:58'),
('013_add_cleared_by_to_notifications.sql','2026-11-07 23:51:58'),
('014_fix_emoji_charset.sql','2026-11-07 23:51:58'),
('015_payables.sql','2026-11-07 23:52:04'),
('016_budget_line_categories_budget_id.sql','2026-11-07 23:52:04'),
('017_receivables.sql','2026-11-07 23:52:06'),
('018_quick_expenses.sql','2026-11-07 23:52:07');

/*Table structure for table `site_config` */

DROP TABLE IF EXISTS `site_config`;

CREATE TABLE `site_config` (
  `config_key` varchar(80) NOT NULL,
  `config_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config_value`)),
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `site_config` */

/*Table structure for table `subscriptions` */

DROP TABLE IF EXISTS `subscriptions`;

CREATE TABLE `subscriptions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `transaction_id` varchar(80) NOT NULL,
  `plan` varchar(30) NOT NULL,
  `starts_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_subscriptions_user_id` (`user_id`),
  KEY `idx_subscriptions_status` (`status`),
  KEY `idx_subscriptions_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `subscriptions` */

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `budget` decimal(15,2) NOT NULL DEFAULT 0.00,
  `avatar` varchar(500) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_type` enum('admin','user') NOT NULL DEFAULT 'user',
  `quick_expenses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`quick_expenses`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`name`,`email`,`password`,`budget`,`avatar`,`google_id`,`created_at`,`updated_at`,`user_type`,`quick_expenses`) values 
('3cb76480-a8a1-4e4e-8a88-144406c29bf9','Admin','admin@abmiti.com','$2a$12$JuSdxpFkWvdszVLhoEZ42uSJUEUjz8XsOXDaFR8quGmlbrsrMomBq',0.00,'?',NULL,'2026-09-29 12:34:39','2026-09-29 12:35:28','admin',NULL),
('6368a950-3ef1-45f1-83ca-5215558fc329','MsM Robin','robin@abmiti.com','$2a$12$3kWqqhXBFkPlVfI2hHC/NuZLNFulClX4htZX8kJzYrHZpOQtSwOfW',0.00,'?',NULL,'2026-09-29 12:37:02','2026-10-18 16:22:12','user',NULL);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
