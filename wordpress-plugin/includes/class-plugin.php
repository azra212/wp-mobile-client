<?php
/**
 * Plugin bootstrap.
 *
 * @package Azra212\WpMobileClient
 */

declare(strict_types=1);

namespace Azra212\WpMobileClient;

defined( 'ABSPATH' ) || exit;

/**
 * Hooks the REST controller in when WordPress is ready for routes.
 */
class Plugin {

	/**
	 * Register routes on rest_api_init.
	 *
	 * @return void
	 */
	public static function init(): void {
		$routes = new Rest_Controller( new Jwt(), new Rate_Limiter() );
		add_action( 'rest_api_init', array( $routes, 'register_routes' ) );
	}
}
