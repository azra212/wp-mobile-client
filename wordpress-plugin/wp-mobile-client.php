<?php
/**
 * Plugin Name: WP Mobile Client
 * Plugin URI: https://github.com/azra212/wp-mobile-client
 * Description: Signed, expiring login tokens for the WP Mobile Client app.
 * Version: 1.0.0
 * Requires at least: 6.2
 * Requires PHP: 8.0
 * Author: azra212
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-mobile-client
 *
 * @package Azra212\WpMobileClient
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/includes/class-rate-limiter.php';
require_once __DIR__ . '/includes/class-jwt.php';
require_once __DIR__ . '/includes/class-rest-controller.php';
require_once __DIR__ . '/includes/class-plugin.php';

\Azra212\WpMobileClient\Plugin::init();
