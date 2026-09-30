/*
SQLyog Ultimate
MySQL - 8.0.46-0ubuntu0.24.04.4 : Database - abmiti_v1
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

/*Table structure for table `blog_posts` */

DROP TABLE IF EXISTS `blog_posts`;

CREATE TABLE `blog_posts` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text,
  `content` longtext NOT NULL,
  `published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `blog_posts` */

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
  `icon` varchar(20) DEFAULT 0xF09F93A6,
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
('1c8a739a-a896-472a-81fa-036abc1e23f3','6018193c-d4ec-4b21-baa0-dd23219abae2','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('1dc91baf-6464-440e-8cda-faa8f3575169','0e9da543-e084-44c6-87c3-44c160e2bcc8','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('1dd60c2b-7a47-4555-8df1-93d2b2d3d12b','0e9da543-e084-44c6-87c3-44c160e2bcc8','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('2b088ebe-5571-4443-afee-8f11cf609281','6018193c-d4ec-4b21-baa0-dd23219abae2','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('44045589-d119-4ea6-a655-83a7037bb995','0e9da543-e084-44c6-87c3-44c160e2bcc8','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('559ddd58-57ed-419f-8988-09da6c08b345','6018193c-d4ec-4b21-baa0-dd23219abae2','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('5f055cd0-78e2-4019-90e4-65aa36d3c819','0e9da543-e084-44c6-87c3-44c160e2bcc8','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('aa2ca8d5-5f65-4546-b705-98931303b22a','0e9da543-e084-44c6-87c3-44c160e2bcc8','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('bc5b4e87-03c2-4553-881b-e10e761e04a4','0e9da543-e084-44c6-87c3-44c160e2bcc8','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('d22dac93-790a-4736-854d-2b1615942c27','6018193c-d4ec-4b21-baa0-dd23219abae2','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('e13ef89b-478d-45d5-855b-f83e6ee9b892','6018193c-d4ec-4b21-baa0-dd23219abae2','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('e9356ffd-f56a-4148-a9ea-35603f39461d','6018193c-d4ec-4b21-baa0-dd23219abae2','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education');

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
('0e9da543-e084-44c6-87c3-44c160e2bcc8','6368a950-3ef1-45f1-83ca-5215558fc329',9,2026,0.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-09-29 12:37:03','2026-09-29 12:37:03'),
('6018193c-d4ec-4b21-baa0-dd23219abae2','3cb76480-a8a1-4e4e-8a88-144406c29bf9',9,2026,0.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-09-29 12:34:39','2026-09-29 12:34:39');

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

/*Table structure for table `contact_messages` */

DROP TABLE IF EXISTS `contact_messages`;

CREATE TABLE `contact_messages` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

/*Table structure for table `notifications` */

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target_user_id` varchar(36) DEFAULT NULL,
  `read_by` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notification_target` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `notifications` */

/*Table structure for table `payments` */

DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `transaction_id` varchar(80) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `plan` varchar(30) NOT NULL,
  `status` varchar(20) NOT NULL,
  `gateway_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `payments` */

/*Table structure for table `schema_migrations` */

DROP TABLE IF EXISTS `schema_migrations`;

CREATE TABLE `schema_migrations` (
  `version` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `schema_migrations` */

insert  into `schema_migrations`(`version`,`applied_at`) values 
('000_create_schema_migrations.sql','2026-09-29 12:32:26'),
('001_create_users.sql','2026-09-29 12:32:26'),
('002_create_categories.sql','2026-09-29 12:32:26'),
('003_create_accounts.sql','2026-09-29 12:32:27'),
('004_create_entries.sql','2026-09-29 12:32:27'),
('005_migrate_budgets.sql','2026-09-29 12:32:27'),
('006_create_budget_lines.sql','2026-09-29 12:32:27'),
('007_create_budget_line_categories.sql','2026-09-29 12:32:27'),
('008_create_budget_sub_items.sql','2026-09-29 12:32:27'),
('009_add_google_oauth.sql','2026-09-29 12:32:27'),
('010_admin_content_payments.sql','2026-09-29 12:32:27');

/*Table structure for table `site_config` */

DROP TABLE IF EXISTS `site_config`;

CREATE TABLE `site_config` (
  `config_key` varchar(80) NOT NULL,
  `config_value` json NOT NULL,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_subscriptions_user_id` (`user_id`),
  KEY `idx_subscriptions_status` (`status`),
  KEY `idx_subscriptions_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `subscriptions` */

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `budget` decimal(15,2) NOT NULL DEFAULT '0.00',
  `avatar` varchar(500) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_type` enum('admin','user') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`name`,`email`,`password`,`budget`,`avatar`,`google_id`,`created_at`,`updated_at`,`user_type`) values 
('3cb76480-a8a1-4e4e-8a88-144406c29bf9','Admin','admin@abmiti.com','$2a$12$JuSdxpFkWvdszVLhoEZ42uSJUEUjz8XsOXDaFR8quGmlbrsrMomBq',0.00,'?',NULL,'2026-09-29 12:34:39','2026-09-29 12:35:28','admin'),
('6368a950-3ef1-45f1-83ca-5215558fc329','MsM Robin','robin@abmiti.com','$2a$12$3kWqqhXBFkPlVfI2hHC/NuZLNFulClX4htZX8kJzYrHZpOQtSwOfW',0.00,NULL,NULL,'2026-09-29 12:37:02','2026-09-29 12:37:02','user');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
