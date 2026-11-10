<?php
/**
 * REST routes under bgh/v1.
 *
 * @package Azra212\WpMobileClient
 */

declare(strict_types=1);

namespace Azra212\WpMobileClient;

defined( 'ABSPATH' ) || exit;

/**
 * Login, refresh, profile, and health routes.
 */
class Rest_Controller {

	/**
	 * Token signer.
	 *
	 * @var Jwt
	 */
	private $jwt;

	/**
	 * Login throttle.
	 *
	 * @var Rate_Limiter
	 */
	private $limiter;

	/**
	 * Wire the signer and the throttle.
	 *
	 * @param Jwt          $jwt     Token signer.
	 * @param Rate_Limiter $limiter Login throttle.
	 */
	public function __construct( Jwt $jwt, Rate_Limiter $limiter ) {
		$this->jwt     = $jwt;
		$this->limiter = $limiter;
	}

	/**
	 * Register every route with an explicit permission callback.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			'bgh/v1',
			'/health',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'health' ),
				'permission_callback' => array( $this, 'allow_public' ),
			)
		);

		register_rest_route(
			'bgh/v1',
			'/login',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'login' ),
				'permission_callback' => array( $this, 'allow_public' ),
				'args'                => array(
					'username' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => array( $this, 'sanitize_username' ),
					),
					'password' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => array( $this, 'sanitize_password' ),
					),
				),
			)
		);

		register_rest_route(
			'bgh/v1',
			'/refresh',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'refresh' ),
				'permission_callback' => array( $this, 'allow_public' ),
				'args'                => array(
					'refresh_token' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => array( $this, 'sanitize_token' ),
					),
				),
			)
		);

		register_rest_route(
			'bgh/v1',
			'/me',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'me' ),
				'permission_callback' => array( $this, 'require_access_token' ),
			)
		);
	}

	/**
	 * Public routes still pass through a named callback so none are left open by omission.
	 *
	 * @return bool
	 */
	public function allow_public(): bool {
		return true;
	}

	/**
	 * Accept a request only when it carries a valid access token.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return true|\WP_Error
	 */
	public function require_access_token( \WP_REST_Request $request ) {
		$user_id = $this->user_id_from_bearer( $request, 'access' );
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user instanceof \WP_User ) {
			return new \WP_Error(
				'invalid_token',
				'Invalid or expired token.',
				array( 'status' => 401 )
			);
		}

		wp_set_current_user( $user->ID );
		return true;
	}

	/**
	 * Report that the plugin is loaded.
	 *
	 * @return \WP_REST_Response
	 */
	public function health(): \WP_REST_Response {
		return new \WP_REST_Response(
			array(
				'status'    => 'ok',
				'timestamp' => gmdate( 'c' ),
				'version'   => '1.0.0',
			),
			200
		);
	}

	/**
	 * Exchange a username and password for an access token and a refresh token.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function login( \WP_REST_Request $request ) {
		$username = (string) $request->get_param( 'username' );
		$password = (string) $request->get_param( 'password' );
		$bucket   = $this->client_ip() . '|' . strtolower( $username );

		if ( ! $this->limiter->allow( $bucket ) ) {
			return new \WP_Error(
				'too_many_attempts',
				'Too many login attempts. Try again later.',
				array( 'status' => 429 )
			);
		}

		if ( '' === $username || '' === $password ) {
			$this->limiter->hit( $bucket );
			return new \WP_Error(
				'missing_credentials',
				'Username and password are required.',
				array( 'status' => 400 )
			);
		}

		$user = wp_authenticate( $username, $password );
		if ( is_wp_error( $user ) ) {
			$this->limiter->hit( $bucket );
			return new \WP_Error(
				'invalid_credentials',
				'Invalid credentials.',
				array( 'status' => 401 )
			);
		}

		$this->limiter->clear( $bucket );

		$access  = $this->jwt->issue( (int) $user->ID, 'access' );
		$refresh = $this->jwt->issue( (int) $user->ID, 'refresh' );
		if ( is_wp_error( $access ) ) {
			return $access;
		}
		if ( is_wp_error( $refresh ) ) {
			return $refresh;
		}

		return new \WP_REST_Response(
			array(
				'token'         => $access,
				'refresh_token' => $refresh,
				'expires_in'    => Jwt::ACCESS_TTL,
				'user'          => $this->user_payload( $user ),
			),
			200
		);
	}

	/**
	 * Exchange a refresh token for a new pair.
	 *
	 * The previous refresh token stays valid until it expires. Logout deletes tokens on the device.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function refresh( \WP_REST_Request $request ) {
		$token = (string) $request->get_param( 'refresh_token' );
		if ( '' === $token ) {
			return new \WP_Error(
				'invalid_token',
				'Refresh token is required.',
				array( 'status' => 400 )
			);
		}

		$user_id = $this->jwt->verify( $token, 'refresh' );
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user instanceof \WP_User ) {
			return new \WP_Error(
				'invalid_token',
				'Invalid or expired token.',
				array( 'status' => 401 )
			);
		}

		$access  = $this->jwt->issue( (int) $user->ID, 'access' );
		$refresh = $this->jwt->issue( (int) $user->ID, 'refresh' );
		if ( is_wp_error( $access ) ) {
			return $access;
		}
		if ( is_wp_error( $refresh ) ) {
			return $refresh;
		}

		return new \WP_REST_Response(
			array(
				'token'         => $access,
				'refresh_token' => $refresh,
				'expires_in'    => Jwt::ACCESS_TTL,
			),
			200
		);
	}

	/**
	 * Return the user named by the access token.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function me( \WP_REST_Request $request ) {
		$user_id = $this->user_id_from_bearer( $request, 'access' );
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user instanceof \WP_User ) {
			return new \WP_Error(
				'invalid_token',
				'Invalid or expired token.',
				array( 'status' => 401 )
			);
		}

		return new \WP_REST_Response( $this->user_payload( $user ), 200 );
	}

	/**
	 * Strip unsafe characters from a login name.
	 *
	 * @param mixed $value Raw username.
	 * @return string
	 */
	public function sanitize_username( $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}

		return sanitize_user( $value );
	}

	/**
	 * Reject a password that is not a reasonably sized string.
	 *
	 * The value is not passed through sanitize_text_field(), which would change the password.
	 *
	 * @param mixed $value Raw password.
	 * @return string
	 */
	public function sanitize_password( $value ): string {
		if ( ! is_string( $value ) || strlen( $value ) > 4096 ) {
			return '';
		}

		return $value;
	}

	/**
	 * Accept only a compact three-part token.
	 *
	 * @param mixed $value Raw token.
	 * @return string
	 */
	public function sanitize_token( $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$token = trim( $value );
		if ( strlen( $token ) > 4096 || 1 !== preg_match( '/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/', $token ) ) {
			return '';
		}

		return $token;
	}

	/**
	 * Read a bearer token and verify it for the expected use.
	 *
	 * @param \WP_REST_Request $request       Incoming request.
	 * @param string           $expected_use  access or refresh.
	 * @return int|\WP_Error
	 */
	private function user_id_from_bearer( \WP_REST_Request $request, string $expected_use ) {
		$header = $request->get_header( 'authorization' );
		if ( ! is_string( $header ) || 1 !== preg_match( '/^Bearer\s+(\S+)/i', $header, $matches ) ) {
			return new \WP_Error(
				'unauthorized',
				'Missing token.',
				array( 'status' => 401 )
			);
		}

		$token = isset( $matches[1] ) ? (string) $matches[1] : '';
		return $this->jwt->verify( $token, $expected_use );
	}

	/**
	 * Fields the app stores for the signed-in user.
	 *
	 * @param \WP_User $user WordPress user.
	 * @return array{id: int, username: string, email: string, roles: array<int, string>}
	 */
	private function user_payload( \WP_User $user ): array {
		$roles = array();
		foreach ( $user->roles as $role ) {
			if ( is_string( $role ) ) {
				$roles[] = $role;
			}
		}

		return array(
			'id'       => (int) $user->ID,
			'username' => (string) $user->user_login,
			'email'    => (string) $user->user_email,
			'roles'    => array_values( $roles ),
		);
	}

	/**
	 * Client address used only as a throttle bucket.
	 *
	 * @return string
	 */
	private function client_ip(): string {
		if ( ! isset( $_SERVER['REMOTE_ADDR'] ) ) {
			return '0.0.0.0';
		}

		$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		if ( ! is_string( $ip ) || false === filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return '0.0.0.0';
		}

		return $ip;
	}
}
