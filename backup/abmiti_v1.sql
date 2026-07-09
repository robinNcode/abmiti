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

/*Table structure for table `budget_line_categories` */

DROP TABLE IF EXISTS `budget_line_categories`;

CREATE TABLE `budget_line_categories` (
  `budget_line_id` varchar(36) NOT NULL,
  `category_id` varchar(36) NOT NULL,
  PRIMARY KEY (`budget_line_id`,`category_id`),
  KEY `fk_budget_line_categories_category` (`category_id`),
  CONSTRAINT `fk_budget_line_categories_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_line_categories_line` FOREIGN KEY (`budget_line_id`) REFERENCES `budget_lines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `sort_order` smallint(6) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_budget_lines_budget` (`budget_id`),
  CONSTRAINT `fk_budget_lines_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `budget_lines` */

insert  into `budget_lines`(`id`,`budget_id`,`name`,`icon`,`color`,`allocation_method`,`allocation_value`,`sort_order`,`is_active`,`note`) values 
('09b943b3-36af-43fa-85ec-7380e5a25269','50b00fb1-0d9a-4dad-9ea6-d7f1f12163ac','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('293e7972-da50-4fbf-a806-38d5ea72a633','50b00fb1-0d9a-4dad-9ea6-d7f1f12163ac','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('2f84e5d2-2012-4ea0-b567-aa080cf3657d','50b00fb1-0d9a-4dad-9ea6-d7f1f12163ac','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('82f292e0-e060-4a29-af9e-3fcbfe3b836b','50b00fb1-0d9a-4dad-9ea6-d7f1f12163ac','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('c9fceb17-8e31-47ab-a7c8-94927124246c','50b00fb1-0d9a-4dad-9ea6-d7f1f12163ac','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('f9a8830f-70e7-4d15-a12f-385e87f9dbd0','50b00fb1-0d9a-4dad-9ea6-d7f1f12163ac','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development');

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
('50b00fb1-0d9a-4dad-9ea6-d7f1f12163ac','56fb2111-4f01-4299-a02b-e0029b268c4d',6,2026,47500.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-06-24 21:58:41','2026-06-24 22:01:02');

/*Table structure for table `categories` */

DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon` varchar(20) NOT NULL DEFAULT 'icon',
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
('66c12b24-d823-43e8-bbfc-02546803e019','56fb2111-4f01-4299-a02b-e0029b268c4d','Home Rent','?','#c2552a','expense',0,'2026-06-24 22:02:21'),
('bfc0358e-6380-4f54-9319-29860ea5c934','56fb2111-4f01-4299-a02b-e0029b268c4d','Monthly Salary','?','#1abc9c','income',0,'2026-06-24 22:00:13');

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
  PRIMARY KEY (`id`),
  KEY `idx_entries_user_date` (`user_id`,`date`),
  KEY `idx_entries_user_type_date` (`user_id`,`type`,`date`),
  KEY `idx_entries_user_category` (`user_id`,`category_id`),
  KEY `fk_entries_category` (`category_id`),
  KEY `fk_entries_account` (`account_id`),
  CONSTRAINT `fk_entries_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_entries_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `entries` */

insert  into `entries`(`id`,`user_id`,`type`,`amount`,`note`,`category_id`,`source`,`account_id`,`sector`,`date`,`parsed_from_sms`,`raw_sms`,`created_at`,`updated_at`) values 
('30459aa6-09f4-4d38-944e-209aa5af8e0b','56fb2111-4f01-4299-a02b-e0029b268c4d','expense',11000.00,'Home Rent','66c12b24-d823-43e8-bbfc-02546803e019','cash',NULL,'','2026-06-15',0,NULL,'2026-06-24 22:02:45','2026-06-24 22:02:45'),
('59fb9385-915b-4beb-a6ea-273f29227ab3','56fb2111-4f01-4299-a02b-e0029b268c4d','income',47500.00,'Monthly Salary','bfc0358e-6380-4f54-9319-29860ea5c934','bank',NULL,'','2026-06-12',0,NULL,'2026-06-24 22:00:37','2026-06-24 22:00:37');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `budget` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`name`,`email`,`password`,`budget`,`created_at`,`updated_at`) values 
('56fb2111-4f01-4299-a02b-e0029b268c4d','MD Shahin Mia Robin','admin@abmiti.com','$2a$12$r.83iYDe.3bK5VQTy8X5nuLS4TV1lhBtXa3.JaGvZTxl5YoilmJOi',0.00,'2026-06-24 21:58:41','2026-06-24 21:58:41');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
