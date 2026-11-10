<?php
/**
 * Login attempt limiter.
 *
 * @package Azra212\WpMobileClient
 */

declare(strict_types=1);

namespace Azra212\WpMobileClient;

defined( 'ABSPATH' ) || exit;

/**
 * Counts failed logins in a short window.
 *
 * Transients are not an atomic counter. This is a brake on password guessing, not a lock.
 */
class Rate_Limiter {

	/**
	 * Failed attempts allowed for one bucket.
	 *
	 * @var int
	 */
	const MAX_ATTEMPTS = 5;

	/**
	 * How long a bucket is remembered, in seconds.
	 *
	 * @var int
	 */
	const WINDOW = 900;

	/**
	 * Whether another attempt is still allowed.
	 *
	 * @param string $bucket Caller-defined bucket, usually IP and username.
	 * @return bool
	 */
	public function allow( string $bucket ): bool {
		$count = get_transient( $this->key( $bucket ) );
		if ( false === $count ) {
			return true;
		}

		return (int) $count < self::MAX_ATTEMPTS;
	}

	/**
	 * Record one failed attempt.
	 *
	 * @param string $bucket Caller-defined bucket, usually IP and username.
	 * @return void
	 */
	public function hit( string $bucket ): void {
		$key   = $this->key( $bucket );
		$count = (int) get_transient( $key );
		set_transient( $key, $count + 1, self::WINDOW );
	}

	/**
	 * Forget attempts after a successful login.
	 *
	 * @param string $bucket Caller-defined bucket, usually IP and username.
	 * @return void
	 */
	public function clear( string $bucket ): void {
		delete_transient( $this->key( $bucket ) );
	}

	/**
	 * Transient key for a bucket.
	 *
	 * @param string $bucket Caller-defined bucket.
	 * @return string
	 */
	private function key( string $bucket ): string {
		return 'wpmc_' . hash( 'sha256', $bucket );
	}
}
