<?php
/**
 * Plugin Name: Wp Mobile Client
 * Description: Custom API layer for React Native app
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// Include core files
require_once plugin_dir_path(__FILE__) . 'includes/routes.php';
require_once plugin_dir_path(__FILE__) . 'includes/security.php';
require_once plugin_dir_path(__FILE__) . 'includes/auth.php';


// Initialize plugin
add_action('rest_api_init', 'wp_mobile_client_register_routes');
