<?php
/**
 * HS256 tokens for the mobile client.
 *
 * @package Azra212\WpMobileClient
 */

declare(strict_types=1);

namespace Azra212\WpMobileClient;

defined( 'ABSPATH' ) || exit;

/**
 * Issues and checks signed, expiring tokens.
 */
class Jwt {

	/**
	 * Access token lifetime, in seconds.
	 *
	 * @var int
	 */
	const ACCESS_TTL = 900;

	/**
	 * Refresh token lifetime, in seconds.
	 *
	 * @var int
	 */
	const REFRESH_TTL = 2592000;

	/**
	 * Clock skew accepted when checking exp and iat, in seconds.
	 *
	 * @var int
	 */
	const SKEW = 30;

	/**
	 * Sign a token for a user.
	 *
	 * @param int    $user_id   WordPress user ID.
	 * @param string $token_use Either access or refresh.
	 * @return string|\WP_Error Encoded token, or an error when signing is not possible.
	 */
	public function issue( int $user_id, string $token_use ) {
		if ( $user_id <= 0 || ! in_array( $token_use, array( 'access', 'refresh' ), true ) ) {
			return new \WP_Error(
				'jwt_failed',
				'Could not issue a token.',
				array( 'status' => 500 )
			);
		}

		$secret = $this->secret();
		if ( '' === $secret ) {
			return new \WP_Error(
				'jwt_not_configured',
				'Set WP_MOBILE_CLIENT_JWT_SECRET in wp-config.php.',
				array( 'status' => 500 )
			);
		}

		$issued_at = time();
		$ttl       = ( 'refresh' === $token_use ) ? self::REFRESH_TTL : self::ACCESS_TTL;
		$header    = $this->encode_json(
			array(
				'alg' => 'HS256',
				'typ' => 'JWT',
			)
		);
		$payload   = $this->encode_json(
			array(
				'iss'       => $this->issuer(),
				'iat'       => $issued_at,
				'exp'       => $issued_at + $ttl,
				'sub'       => $user_id,
				'token_use' => $token_use,
			)
		);

		if ( is_wp_error( $header ) ) {
			return $header;
		}
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		$signature = $this->base64url_encode(
			hash_hmac( 'sha256', $header . '.' . $payload, $secret, true )
		);

		return $header . '.' . $payload . '.' . $signature;
	}

	/**
	 * Check a token and return the user ID it names.
	 *
	 * @param string $token         Compact JWT from the client.
	 * @param string $expected_use  access or refresh. The other kind is rejected.
	 * @return int|\WP_Error User ID, or a 401 error.
	 */
	public function verify( string $token, string $expected_use ) {
		if ( strlen( $token ) < 20 || strlen( $token ) > 4096 ) {
			return $this->invalid_token();
		}

		$parts = explode( '.', $token );
		if ( 3 !== count( $parts ) ) {
			return $this->invalid_token();
		}

		$header_part  = $parts[0];
		$payload_part = $parts[1];
		$signature    = $parts[2];
		if ( '' === $header_part || '' === $payload_part || '' === $signature ) {
			return $this->invalid_token();
		}

		$secret = $this->secret();
		if ( '' === $secret ) {
			return new \WP_Error(
				'jwt_not_configured',
				'Set WP_MOBILE_CLIENT_JWT_SECRET in wp-config.php.',
				array( 'status' => 500 )
			);
		}

		$expected = $this->base64url_encode(
			hash_hmac( 'sha256', $header_part . '.' . $payload_part, $secret, true )
		);
		if ( ! hash_equals( $expected, $signature ) ) {
			return $this->invalid_token();
		}

		$header = json_decode( $this->base64url_decode( $header_part ), true );
		if ( ! is_array( $header ) || 'HS256' !== ( $header['alg'] ?? '' ) || 'JWT' !== ( $header['typ'] ?? '' ) ) {
			return $this->invalid_token();
		}

		$claims = json_decode( $this->base64url_decode( $payload_part ), true );
		if ( ! is_array( $claims ) ) {
			return $this->invalid_token();
		}

		$issuer          = $claims['iss'] ?? '';
		$expected_issuer = $this->issuer();
		if ( ! is_string( $issuer ) || strlen( $issuer ) !== strlen( $expected_issuer ) || ! hash_equals( $expected_issuer, $issuer ) ) {
			return $this->invalid_token();
		}

		$token_use = $claims['token_use'] ?? '';
		if ( ! is_string( $token_use ) || strlen( $token_use ) !== strlen( $expected_use ) || ! hash_equals( $expected_use, $token_use ) ) {
			return $this->invalid_token();
		}

		$now = time();
		$iat = $claims['iat'] ?? 0;
		$exp = $claims['exp'] ?? 0;
		$sub = $claims['sub'] ?? 0;
		if ( ! is_int( $iat ) || ! is_int( $exp ) || ! is_int( $sub ) ) {
			return $this->invalid_token();
		}
		if ( $sub <= 0 || $iat > ( $now + self::SKEW ) || $exp <= ( $now - self::SKEW ) ) {
			return $this->invalid_token();
		}

		return $sub;
	}

	/**
	 * Secret from wp-config.php.
	 *
	 * WP_MOBILE_CLIENT_JWT_SECRET is preferred. JWT_AUTH_SECRET_KEY still works so an
	 * existing config does not have to be renamed in the same deploy as the plugin.
	 *
	 * @return string Empty when neither constant is set to a non-empty string.
	 */
	private function secret(): string {
		if ( defined( 'WP_MOBILE_CLIENT_JWT_SECRET' ) && is_string( WP_MOBILE_CLIENT_JWT_SECRET ) && '' !== WP_MOBILE_CLIENT_JWT_SECRET ) {
			return WP_MOBILE_CLIENT_JWT_SECRET;
		}

		if ( defined( 'JWT_AUTH_SECRET_KEY' ) && is_string( JWT_AUTH_SECRET_KEY ) && '' !== JWT_AUTH_SECRET_KEY ) {
			return JWT_AUTH_SECRET_KEY;
		}

		return '';
	}

	/**
	 * Site URL stored in the token so a token from another site is rejected.
	 *
	 * @return string
	 */
	private function issuer(): string {
		return (string) get_site_url();
	}

	/**
	 * JSON-encode a token segment.
	 *
	 * @param array<string, mixed> $data Header or claims.
	 * @return string|\WP_Error Encoded segment.
	 */
	private function encode_json( array $data ) {
		$json = wp_json_encode( $data );
		if ( ! is_string( $json ) || '' === $json ) {
			return new \WP_Error(
				'jwt_failed',
				'Could not issue a token.',
				array( 'status' => 500 )
			);
		}

		return $this->base64url_encode( $json );
	}

	/**
	 * Base64url without padding, as JWT requires.
	 *
	 * @param string $data Raw bytes.
	 * @return string
	 */
	private function base64url_encode( string $data ): string {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- JWT segments are base64url, not obfuscated code.
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	/**
	 * Decode a base64url segment. Returns an empty string when the input is not base64.
	 *
	 * @param string $data Encoded segment.
	 * @return string
	 */
	private function base64url_decode( string $data ): string {
		$remainder = strlen( $data ) % 4;
		if ( 0 !== $remainder ) {
			$data .= str_repeat( '=', 4 - $remainder );
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- JWT segments are base64url, not obfuscated code.
		$decoded = base64_decode( strtr( $data, '-_', '+/' ), true );
		if ( false === $decoded ) {
			return '';
		}

		return $decoded;
	}

	/**
	 * Generic rejection. Callers do not learn which check failed.
	 *
	 * @return \WP_Error
	 */
	private function invalid_token(): \WP_Error {
		return new \WP_Error(
			'invalid_token',
			'Invalid or expired token.',
			array( 'status' => 401 )
		);
	}
}
