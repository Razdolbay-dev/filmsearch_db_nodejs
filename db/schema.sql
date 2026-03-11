/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: media_from_tmdb
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('superadmin','admin','moderator') DEFAULT 'admin',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `genres`
--

DROP TABLE IF EXISTS `genres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `genres` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `metadata`
--

DROP TABLE IF EXISTS `metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `series_id` int(11) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `proxy_used` tinyint(1) DEFAULT NULL,
  `number_of_seasons` int(11) DEFAULT NULL,
  `number_of_episodes` int(11) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `series_id` (`series_id`),
  CONSTRAINT `metadata_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74756 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movie_genres`
--

DROP TABLE IF EXISTS `movie_genres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_genres` (
  `movie_id` int(11) NOT NULL,
  `genre_id` int(11) NOT NULL,
  PRIMARY KEY (`movie_id`,`genre_id`),
  KEY `genre_id` (`genre_id`),
  CONSTRAINT `movie_genres_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`),
  CONSTRAINT `movie_genres_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movie_production_companies`
--

DROP TABLE IF EXISTS `movie_production_companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_production_companies` (
  `movie_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  PRIMARY KEY (`movie_id`,`company_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `movie_production_companies_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`),
  CONSTRAINT `movie_production_companies_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `production_companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movie_production_countries`
--

DROP TABLE IF EXISTS `movie_production_countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_production_countries` (
  `movie_id` int(11) NOT NULL,
  `country_iso` varchar(10) NOT NULL,
  PRIMARY KEY (`movie_id`,`country_iso`),
  KEY `country_iso` (`country_iso`),
  CONSTRAINT `movie_production_countries_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`),
  CONSTRAINT `movie_production_countries_ibfk_2` FOREIGN KEY (`country_iso`) REFERENCES `production_countries` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movie_spoken_languages`
--

DROP TABLE IF EXISTS `movie_spoken_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_spoken_languages` (
  `movie_id` int(11) NOT NULL,
  `language_iso` varchar(10) NOT NULL,
  PRIMARY KEY (`movie_id`,`language_iso`),
  KEY `language_iso` (`language_iso`),
  CONSTRAINT `movie_spoken_languages_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`),
  CONSTRAINT `movie_spoken_languages_ibfk_2` FOREIGN KEY (`language_iso`) REFERENCES `spoken_languages` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movies`
--

DROP TABLE IF EXISTS `movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movies` (
  `id` int(11) NOT NULL,
  `adult` tinyint(1) DEFAULT NULL,
  `backdrop_path` varchar(255) DEFAULT NULL,
  `budget` bigint(20) DEFAULT NULL,
  `homepage` varchar(500) DEFAULT NULL,
  `imdb_id` varchar(20) DEFAULT NULL,
  `original_language` varchar(10) DEFAULT NULL,
  `original_title` varchar(255) DEFAULT NULL,
  `overview` text DEFAULT NULL,
  `popularity` decimal(10,4) DEFAULT NULL,
  `poster_path` varchar(255) DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `revenue` bigint(20) DEFAULT NULL,
  `runtime` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `video` tinyint(1) DEFAULT NULL,
  `vote_average` decimal(3,3) DEFAULT NULL,
  `vote_count` int(11) DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_companies`
--

DROP TABLE IF EXISTS `production_companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_companies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `origin_country` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_countries`
--

DROP TABLE IF EXISTS `production_countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_countries` (
  `iso_code` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spoken_languages`
--

DROP TABLE IF EXISTS `spoken_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spoken_languages` (
  `iso_code` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `english_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sync_jobs`
--

DROP TABLE IF EXISTS `sync_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_jobs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `job_name` varchar(100) NOT NULL,
  `job_type` enum('movies','series','mixed') DEFAULT 'movies',
  `status` enum('pending','running','paused','completed','failed','stopped') DEFAULT 'pending',
  `total_items` int(11) DEFAULT 0,
  `processed_items` int(11) DEFAULT 0,
  `failed_items` int(11) DEFAULT 0,
  `skipped_items` int(11) DEFAULT 0,
  `current_item_id` int(11) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`job_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sync_processed_items`
--

DROP TABLE IF EXISTS `sync_processed_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_processed_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tmdb_id` int(11) NOT NULL,
  `item_type` enum('movie','series') NOT NULL,
  `status` enum('completed','failed','skipped') DEFAULT 'completed',
  `job_id` int(10) unsigned DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tmdb_type` (`tmdb_id`,`item_type`),
  KEY `idx_processed_at` (`processed_at`),
  KEY `idx_type` (`item_type`),
  KEY `job_id` (`job_id`),
  CONSTRAINT `sync_processed_items_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `sync_jobs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=484949 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sync_progress`
--

DROP TABLE IF EXISTS `sync_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sync_id` varchar(100) NOT NULL,
  `sync_type` varchar(20) DEFAULT 'full',
  `total_count` int(11) NOT NULL,
  `processed_count` int(11) DEFAULT 0,
  `success_count` int(11) DEFAULT 0,
  `failed_count` int(11) DEFAULT 0,
  `status` enum('running','paused','completed','stopped','error') DEFAULT 'running',
  `error_message` text DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT current_timestamp(),
  `end_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sync_id` (`sync_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sync_queue`
--

DROP TABLE IF EXISTS `sync_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_queue` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `job_id` int(10) unsigned NOT NULL,
  `tmdb_id` int(11) NOT NULL,
  `item_type` enum('movie','series') DEFAULT 'movie',
  `status` enum('pending','processing','completed','failed','skipped') DEFAULT 'pending',
  `attempts` int(11) DEFAULT 0,
  `last_attempt` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_job_item` (`job_id`,`tmdb_id`,`item_type`),
  KEY `idx_job_status` (`job_id`,`status`),
  KEY `idx_status_type` (`status`,`item_type`),
  KEY `idx_tmdb_id` (`tmdb_id`),
  CONSTRAINT `sync_queue_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `sync_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=478177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tmdb_export_collection`
--

DROP TABLE IF EXISTS `tmdb_export_collection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tmdb_export_collection` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tmdb_id` int(11) NOT NULL,
  `name` varchar(500) NOT NULL,
  `export_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_collection_export` (`tmdb_id`,`export_date`),
  KEY `idx_tmdb_id` (`tmdb_id`),
  KEY `idx_name` (`name`(100)),
  KEY `idx_export_date` (`export_date`)
) ENGINE=InnoDB AUTO_INCREMENT=18105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Экспорт коллекций TMDB (только базовые поля)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tmdb_export_movies`
--

DROP TABLE IF EXISTS `tmdb_export_movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tmdb_export_movies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tmdb_id` int(11) NOT NULL,
  `original_title` varchar(500) DEFAULT NULL,
  `popularity` decimal(10,4) DEFAULT 0.0000,
  `video` tinyint(1) DEFAULT 0,
  `adult` tinyint(1) DEFAULT 0,
  `export_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_movie_export` (`tmdb_id`,`export_date`),
  KEY `idx_tmdb_id` (`tmdb_id`),
  KEY `idx_popularity` (`popularity`),
  KEY `idx_export_date` (`export_date`),
  KEY `idx_adult` (`adult`),
  KEY `idx_video` (`video`)
) ENGINE=InnoDB AUTO_INCREMENT=249219 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Экспорт фильмов TMDB (только базовые поля)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tmdb_export_tv`
--

DROP TABLE IF EXISTS `tmdb_export_tv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tmdb_export_tv` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tmdb_id` int(11) NOT NULL,
  `original_name` varchar(500) DEFAULT NULL,
  `popularity` decimal(10,4) DEFAULT 0.0000,
  `export_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_tv_export` (`tmdb_id`,`export_date`),
  KEY `idx_tmdb_id` (`tmdb_id`),
  KEY `idx_popularity` (`popularity`),
  KEY `idx_export_date` (`export_date`)
) ENGINE=InnoDB AUTO_INCREMENT=119000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Экспорт TV сериалов TMDB (только базовые поля)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_episodes`
--

DROP TABLE IF EXISTS `tv_episodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_episodes` (
  `id` int(11) NOT NULL,
  `series_id` int(11) DEFAULT NULL,
  `season_id` int(11) DEFAULT NULL,
  `season_number` int(11) DEFAULT NULL,
  `episode_number` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `overview` text DEFAULT NULL,
  `air_date` date DEFAULT NULL,
  `runtime` int(11) DEFAULT NULL,
  `episode_type` varchar(50) DEFAULT NULL,
  `production_code` varchar(50) DEFAULT NULL,
  `still_path` varchar(255) DEFAULT NULL,
  `vote_average` decimal(3,1) DEFAULT NULL,
  `vote_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `series_id` (`series_id`),
  KEY `season_id` (`season_id`),
  CONSTRAINT `tv_episodes_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`),
  CONSTRAINT `tv_episodes_ibfk_2` FOREIGN KEY (`season_id`) REFERENCES `tv_seasons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_networks`
--

DROP TABLE IF EXISTS `tv_networks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_networks` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `origin_country` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_seasons`
--

DROP TABLE IF EXISTS `tv_seasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_seasons` (
  `id` int(11) NOT NULL,
  `series_id` int(11) DEFAULT NULL,
  `season_number` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `overview` text DEFAULT NULL,
  `air_date` date DEFAULT NULL,
  `episode_count` int(11) DEFAULT NULL,
  `poster_path` varchar(255) DEFAULT NULL,
  `vote_average` decimal(3,1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `series_id` (`series_id`),
  CONSTRAINT `tv_seasons_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_series`
--

DROP TABLE IF EXISTS `tv_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_series` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `overview` text DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `adult` tinyint(1) DEFAULT NULL,
  `backdrop_path` varchar(255) DEFAULT NULL,
  `poster_path` varchar(255) DEFAULT NULL,
  `homepage` varchar(500) DEFAULT NULL,
  `tagline` varchar(500) DEFAULT NULL,
  `original_language` varchar(10) DEFAULT NULL,
  `first_air_date` date DEFAULT NULL,
  `last_air_date` date DEFAULT NULL,
  `in_production` tinyint(1) DEFAULT NULL,
  `number_of_episodes` int(11) DEFAULT NULL,
  `number_of_seasons` int(11) DEFAULT NULL,
  `popularity` decimal(10,4) DEFAULT NULL,
  `vote_average` decimal(3,1) DEFAULT NULL,
  `vote_count` int(11) DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_series_genres`
--

DROP TABLE IF EXISTS `tv_series_genres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_series_genres` (
  `series_id` int(11) NOT NULL,
  `genre_id` int(11) NOT NULL,
  PRIMARY KEY (`series_id`,`genre_id`),
  KEY `genre_id` (`genre_id`),
  CONSTRAINT `tv_series_genres_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`),
  CONSTRAINT `tv_series_genres_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_series_networks`
--

DROP TABLE IF EXISTS `tv_series_networks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_series_networks` (
  `series_id` int(11) NOT NULL,
  `network_id` int(11) NOT NULL,
  PRIMARY KEY (`series_id`,`network_id`),
  KEY `network_id` (`network_id`),
  CONSTRAINT `tv_series_networks_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`),
  CONSTRAINT `tv_series_networks_ibfk_2` FOREIGN KEY (`network_id`) REFERENCES `tv_networks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_series_origin_countries`
--

DROP TABLE IF EXISTS `tv_series_origin_countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_series_origin_countries` (
  `series_id` int(11) NOT NULL,
  `country_iso` varchar(10) NOT NULL,
  PRIMARY KEY (`series_id`,`country_iso`),
  KEY `country_iso` (`country_iso`),
  CONSTRAINT `tv_series_origin_countries_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`),
  CONSTRAINT `tv_series_origin_countries_ibfk_2` FOREIGN KEY (`country_iso`) REFERENCES `production_countries` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_series_production_companies`
--

DROP TABLE IF EXISTS `tv_series_production_companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_series_production_companies` (
  `series_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  PRIMARY KEY (`series_id`,`company_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `tv_series_production_companies_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`),
  CONSTRAINT `tv_series_production_companies_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `production_companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_series_production_countries`
--

DROP TABLE IF EXISTS `tv_series_production_countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_series_production_countries` (
  `series_id` int(11) NOT NULL,
  `country_iso` varchar(10) NOT NULL,
  PRIMARY KEY (`series_id`,`country_iso`),
  KEY `country_iso` (`country_iso`),
  CONSTRAINT `tv_series_production_countries_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`),
  CONSTRAINT `tv_series_production_countries_ibfk_2` FOREIGN KEY (`country_iso`) REFERENCES `production_countries` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tv_series_spoken_languages`
--

DROP TABLE IF EXISTS `tv_series_spoken_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_series_spoken_languages` (
  `series_id` int(11) NOT NULL,
  `language_iso` varchar(10) NOT NULL,
  PRIMARY KEY (`series_id`,`language_iso`),
  KEY `language_iso` (`language_iso`),
  CONSTRAINT `tv_series_spoken_languages_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `tv_series` (`id`),
  CONSTRAINT `tv_series_spoken_languages_ibfk_2` FOREIGN KEY (`language_iso`) REFERENCES `spoken_languages` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-11 15:40:41
