/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 10.4.32-MariaDB 
*********************************************************************
*/
/*!40101 SET NAMES utf8 */;

create table `users` (
	`id` varchar (108),
	`name` varchar (240),
	`email` varchar (765),
	`password` varchar (765),
	`budget` Decimal (17),
	`avatar` varchar (1500),
	`google_id` varchar (765),
	`created_at` timestamp ,
	`updated_at` timestamp ,
	`user_type` char (15),
	`quick_expenses` blob 
); 
insert into `users` (`id`, `name`, `email`, `password`, `budget`, `avatar`, `google_id`, `created_at`, `updated_at`, `user_type`, `quick_expenses`) values('3cb76480-a8a1-4e4e-8a88-144406c29bf9','Admin','admin@abmiti.com','$2a$12$JuSdxpFkWvdszVLhoEZ42uSJUEUjz8XsOXDaFR8quGmlbrsrMomBq','0.00','?',NULL,'2026-09-29 12:34:39','2026-09-29 12:35:28','admin',NULL);
insert into `users` (`id`, `name`, `email`, `password`, `budget`, `avatar`, `google_id`, `created_at`, `updated_at`, `user_type`, `quick_expenses`) values('6368a950-3ef1-45f1-83ca-5215558fc329','MsM Robin','robin@abmiti.com','$2a$12$3kWqqhXBFkPlVfI2hHC/NuZLNFulClX4htZX8kJzYrHZpOQtSwOfW','0.00','?',NULL,'2026-09-29 12:37:02','2026-10-18 16:22:12','user',NULL);
