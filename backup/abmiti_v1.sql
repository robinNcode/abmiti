/*
SQLyog Ultimate
MySQL - 8.0.46-0ubuntu0.24.04.4 : Database - robinncode_abmiti_v1
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`robinncode_abmiti_v1` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

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
  `thumbnail_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `blog_posts` */

insert  into `blog_posts`(`id`,`title`,`slug`,`excerpt`,`content`,`published`,`created_at`,`updated_at`,`thumbnail_url`) values 
('739d23c9-b389-4617-ae23-0282a33ff843','Test new Blog ','test-new-blog','','I have reviewed the issues and successfully addressed both of them:\n\n1. **MarkdownEditor**.tsx Fix: I removed the Tab key override in the handleKeyDown function. The Tab and Shift+Tab keys will now retain their default, native focus-navigation behavior instead of trapping focus and inserting spaces.\n2. **BlogPostPage**.tsx Fix: I added an isActive flag within the useEffect hook that fetches the blog post. This ensures that the .then, .catch, and .finally callbacks only update the React state (setPost, setError, setLoading) if the component hasn\'t unmounted or the slug hasn\'t changed before the request completes, thus preventing any race conditions or memory leaks from stale requests.\nThe changes have been applied!',1,'2026-10-01 12:46:32','2026-10-27 17:57:11','public/uploads/105b5139-a85e-4055-90e5-eabb859f4ab3-thumb.webp');

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
('00ccd76f-96ed-466c-9a8e-1ac74b7f26e1','e6799bd9-3668-4515-8561-ad65671bc02a','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('1385e93c-8cbf-4087-9ea6-58b2e24e25a2','0f1dcf6c-e97d-46ff-9ca9-26c0fce8d068','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('1433693b-cd57-4a93-9b9d-86cd3a05cd45','8715fe85-3221-437b-8bb8-38c05081009b','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('1c8a739a-a896-472a-81fa-036abc1e23f3','6018193c-d4ec-4b21-baa0-dd23219abae2','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('1dc91baf-6464-440e-8cda-faa8f3575169','0e9da543-e084-44c6-87c3-44c160e2bcc8','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('1dd60c2b-7a47-4555-8df1-93d2b2d3d12b','0e9da543-e084-44c6-87c3-44c160e2bcc8','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('28e61118-2054-4ea4-b77b-2c15c1543248','0f1dcf6c-e97d-46ff-9ca9-26c0fce8d068','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('2b088ebe-5571-4443-afee-8f11cf609281','6018193c-d4ec-4b21-baa0-dd23219abae2','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('2ecf181b-681c-4d65-8dc4-1eda88f99b3f','0f1dcf6c-e97d-46ff-9ca9-26c0fce8d068','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('3bc25025-a694-4bfd-828d-410838e36ff4','e6799bd9-3668-4515-8561-ad65671bc02a','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('44045589-d119-4ea6-a655-83a7037bb995','0e9da543-e084-44c6-87c3-44c160e2bcc8','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('4afa8dc7-594e-4f3f-b8ff-536b0e423465','8715fe85-3221-437b-8bb8-38c05081009b','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('4d18030a-6308-4217-84fc-b75eab201da3','0f1dcf6c-e97d-46ff-9ca9-26c0fce8d068','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('559ddd58-57ed-419f-8988-09da6c08b345','6018193c-d4ec-4b21-baa0-dd23219abae2','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('5eead200-d6f9-4a99-a821-32ce0ddafca7','e6799bd9-3668-4515-8561-ad65671bc02a','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('5f055cd0-78e2-4019-90e4-65aa36d3c819','0e9da543-e084-44c6-87c3-44c160e2bcc8','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('67df569c-c728-49ac-98d8-fa2eff054480','e6799bd9-3668-4515-8561-ad65671bc02a','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('772dc216-9639-492a-91b0-2c52e54f859b','8715fe85-3221-437b-8bb8-38c05081009b','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('775ba23e-f3a1-4b13-9c43-cebf7fa6fea5','0f1dcf6c-e97d-46ff-9ca9-26c0fce8d068','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('7ee0e192-e680-4fb4-ade9-cb68fecc1629','027ef745-0205-4056-a336-b17b39d08ce6','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('805f7c75-b6ab-44df-a5b5-a40746068f62','027ef745-0205-4056-a336-b17b39d08ce6','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('9097ffa3-214e-48e4-a2f7-d255d2ba1ddc','8715fe85-3221-437b-8bb8-38c05081009b','Charity (Sadaqah)','?','#7C3AED','percentage',5.0000,5,1,'Optional; zakat, donations'),
('9ae6b943-174c-47d6-bfb4-0a78a38ff258','8715fe85-3221-437b-8bb8-38c05081009b','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('aa2ca8d5-5f65-4546-b705-98931303b22a','0e9da543-e084-44c6-87c3-44c160e2bcc8','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('b0a4c4fe-4d52-41a9-8436-235e9f07fe31','027ef745-0205-4056-a336-b17b39d08ce6','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('b0dbba83-5c9d-46cb-ba7a-5e9172607603','0f1dcf6c-e97d-46ff-9ca9-26c0fce8d068','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('b3531e98-a60b-4cb0-bd45-88023a405735','e6799bd9-3668-4515-8561-ad65671bc02a','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('bc5b4e87-03c2-4553-881b-e10e761e04a4','0e9da543-e084-44c6-87c3-44c160e2bcc8','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('be5734ee-76ff-4894-9f63-dae089f7c929','027ef745-0205-4056-a336-b17b39d08ce6','Fun / Entertainment','?','#D4973E','percentage',5.0000,3,1,'Leisure, dining out, travel'),
('d22dac93-790a-4736-854d-2b1615942c27','6018193c-d4ec-4b21-baa0-dd23219abae2','Wife Expenses','?','#DB2777','percentage',10.0000,2,1,'Spouse allowance and personal needs'),
('d71bc7cd-a944-43ff-b6ff-dbfd6ab1e728','e6799bd9-3668-4515-8561-ad65671bc02a','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('e13ef89b-478d-45d5-855b-f83e6ee9b892','6018193c-d4ec-4b21-baa0-dd23219abae2','Investment','?','#2563EB','percentage',25.0000,1,1,'Land, gold, business, skill development'),
('e9356ffd-f56a-4148-a9ea-35603f39461d','6018193c-d4ec-4b21-baa0-dd23219abae2','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education'),
('f1088a24-d78c-4d75-acf1-2e614e80ba56','8715fe85-3221-437b-8bb8-38c05081009b','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('f1bf72e2-a5df-45b8-ab0f-d39d7b5373d1','027ef745-0205-4056-a336-b17b39d08ce6','Emergency Fund','?️','#0F766E','percentage',5.0000,4,1,'Savings buffer'),
('f5b67241-62c8-4073-ada0-3c9d1c1b3dae','027ef745-0205-4056-a336-b17b39d08ce6','Living Cost','?','#4A7C59','percentage',50.0000,0,1,'Family expenses: rent, food, utilities, education');

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
('027ef745-0205-4056-a336-b17b39d08ce6','6368a950-3ef1-45f1-83ca-5215558fc329',7,2026,0.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-10-18 19:00:46','2026-10-18 19:00:46'),
('0e9da543-e084-44c6-87c3-44c160e2bcc8','6368a950-3ef1-45f1-83ca-5215558fc329',9,2026,0.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-09-29 12:37:03','2026-09-29 12:37:03'),
('0f1dcf6c-e97d-46ff-9ca9-26c0fce8d068','6368a950-3ef1-45f1-83ca-5215558fc329',11,2026,0.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-10-19 11:39:17','2026-10-19 11:39:17'),
('6018193c-d4ec-4b21-baa0-dd23219abae2','3cb76480-a8a1-4e4e-8a88-144406c29bf9',9,2026,0.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-09-29 12:34:39','2026-09-29 12:34:39'),
('8715fe85-3221-437b-8bb8-38c05081009b','6368a950-3ef1-45f1-83ca-5215558fc329',8,2026,0.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-10-18 18:59:48','2026-10-18 18:59:48'),
('e6799bd9-3668-4515-8561-ad65671bc02a','6368a950-3ef1-45f1-83ca-5215558fc329',10,2026,40000.00,0,'Halal 50/25/10/5/5/5 Budget',NULL,'2026-10-04 16:30:26','2026-10-18 16:49:46');

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
('1a6b0c17-cbf2-46ec-8d68-1ca0ba529c71','6368a950-3ef1-45f1-83ca-5215558fc329','Business Investments','?','#2E7D32','income',0,'2026-10-18 18:58:26'),
('51d5f763-02f8-47f2-9cd6-81cacea980c0','6368a950-3ef1-45f1-83ca-5215558fc329','Gifts','?','#e74c3c','expense',0,'2026-10-18 18:17:04'),
('878c20a9-924c-4068-bd24-2ca30314ca84','6368a950-3ef1-45f1-83ca-5215558fc329','Rental Expenses','?','#c2552a','expense',0,'2026-10-18 17:56:18'),
('97478abb-7d30-441c-b1e3-1b34fc246072','6368a950-3ef1-45f1-83ca-5215558fc329','Wife Expenses','?','#6A1B9A','expense',0,'2026-10-18 18:56:33'),
('de92d184-ba3d-42ae-b40a-3cf381b3a8cc','6368a950-3ef1-45f1-83ca-5215558fc329','Monthly Salary','?','#c2552a','income',0,'2026-10-18 16:48:48');

/*Table structure for table `contact_messages` */

DROP TABLE IF EXISTS `contact_messages`;

CREATE TABLE `contact_messages` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `contact_messages` */

insert  into `contact_messages`(`id`,`name`,`email`,`message`,`created_at`,`is_resolved`) values 
('399b7545-b948-44be-a156-f97c08de3ba4','Voluptatum nihil nih','nomoc@mailinator.com','Dolor ea porro qui d','2026-10-04 15:36:44',0),
('830f9af0-1268-47ba-96ef-3a81f13b6d5b','Exercitation dolor m','gekukibow@mailinator.com','Proident saepe dolo','2026-10-04 15:36:57',0),
('898bc535-70e6-4ffa-9000-e72820c6f871','Labore suscipit adip','pelejid@mailinator.com','Commodi eius laborio','2026-10-04 15:33:42',0);

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
('04a073a5-f89d-4eb8-9b8b-23c3c75c578a','6368a950-3ef1-45f1-83ca-5215558fc329','expense',10000.00,'Mamun\'s wedding gift','51d5f763-02f8-47f2-9cd6-81cacea980c0','cash',NULL,'','2026-10-17',0,NULL,'2026-10-18 18:17:32','2026-10-18 18:17:32'),
('71b112ec-59c5-494b-837b-9c545463c6d8','6368a950-3ef1-45f1-83ca-5215558fc329','expense',12000.00,'Octber Month rent','878c20a9-924c-4068-bd24-2ca30314ca84','cash',NULL,'','2026-10-10',0,NULL,'2026-10-18 17:56:50','2026-10-18 17:56:50'),
('a91367d4-5260-4774-b545-61592ecc0e9b','6368a950-3ef1-45f1-83ca-5215558fc329','income',500.00,'From business investments','1a6b0c17-cbf2-46ec-8d68-1ca0ba529c71','cash',NULL,'','2026-10-18',0,NULL,'2026-10-18 18:58:37','2026-10-18 18:58:37'),
('bed68e8f-daac-4d19-b08d-c4808c6db061','6368a950-3ef1-45f1-83ca-5215558fc329','income',47500.00,'Salary from Bank Asia','de92d184-ba3d-42ae-b40a-3cf381b3a8cc','bank',NULL,'','2026-09-10',0,NULL,'2026-10-18 19:00:43','2026-10-18 19:00:43'),
('e167c5a9-cdaf-43f6-bd0d-8ed5ae6db566','6368a950-3ef1-45f1-83ca-5215558fc329','expense',1000.00,'Exam transportation cost and hand expenses','97478abb-7d30-441c-b1e3-1b34fc246072','bkash',NULL,'','2026-10-18',0,NULL,'2026-10-18 18:57:05','2026-10-18 18:57:05'),
('e1e4dc38-9459-4e60-ac9c-0df25aa4f7e5','6368a950-3ef1-45f1-83ca-5215558fc329','income',46694.00,'Salary from Bank Asia','de92d184-ba3d-42ae-b40a-3cf381b3a8cc','bank',NULL,'','2026-10-08',0,NULL,'2026-10-18 16:49:26','2026-10-18 16:49:26');

/*Table structure for table `notifications` */

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target_user_id` varchar(36) DEFAULT NULL,
  `read_by` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cleared_by` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_target` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `notifications` */

insert  into `notifications`(`id`,`title`,`message`,`target_user_id`,`read_by`,`created_at`,`cleared_by`) values 
('44f2665c-8643-4bac-a1ad-3e3701fab402','Test notifications','Test messages',NULL,'[\"3cb76480-a8a1-4e4e-8a88-144406c29bf9\", \"6368a950-3ef1-45f1-83ca-5215558fc329\"]','2026-10-04 16:32:46','[]');

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
('010_admin_content_payments.sql','2026-09-29 12:32:27'),
('011_add_blog_thumbnail.sql','2026-10-01 12:56:19'),
('012_add_is_resolved_to_contact_messages.sql','2026-10-04 15:39:20'),
('013_add_cleared_by_to_notifications.sql','2026-10-04 16:26:22');

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
('6368a950-3ef1-45f1-83ca-5215558fc329','MsM Robin','robin@abmiti.com','$2a$12$3kWqqhXBFkPlVfI2hHC/NuZLNFulClX4htZX8kJzYrHZpOQtSwOfW',0.00,'?',NULL,'2026-09-29 12:37:02','2026-10-18 16:22:12','user'),
('e6f7a30a-5a9e-46be-a563-956170077a51','Layout Tester','layout.tester@abmiti.local','$2a$12$4/a0U3NT5qdT9GURFUri4uzFCZHZ0ZQEnKWUQAe.Uke5rGlUHwUjG',0.00,NULL,NULL,'2026-10-07 11:08:16','2026-10-07 11:08:16','user');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
