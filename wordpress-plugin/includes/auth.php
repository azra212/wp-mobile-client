<?php



function bgh_jwt_base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

if (!defined('JWT_AUTH_SECRET_KEY')) {
    wp_die('JWT_AUTH_SECRET_KEY is not defined');
}


function bgh_generate_jwt($user_id) {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $issued_at = time();
    $expires = $issued_at + BGH_JWT_EXPIRATION;

    $payload = [
        'iss' => get_site_url(),
        'iat' => $issued_at,
        'exp' => $expires,
        'user_id' => $user_id,
    ];

$header_encoded = bgh_jwt_base64url_encode(
    json_encode($header, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
);

$payload_encoded = bgh_jwt_base64url_encode(
    json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
);



    $signature = hash_hmac(
        'sha256',
        "$header_encoded.$payload_encoded",
        JWT_AUTH_SECRET_KEY,
        true
    );

    $signature_encoded = bgh_jwt_base64url_encode($signature);

    return "$header_encoded.$payload_encoded.$signature_encoded";
}

function bgh_base64url_decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}


function bgh_verify_jwt($token) {

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    [$header, $payload, $signature] = $parts;

    $valid_signature = bgh_jwt_base64url_encode(
        hash_hmac(
            'sha256',
            "$header.$payload",
            JWT_AUTH_SECRET_KEY,
            true
        )
    );

    if (!hash_equals($valid_signature, $signature)) {
        return false;
    }

$payload_data = json_decode(
    bgh_base64url_decode($payload),
    true
);

$current_time = time();
    $exp_time = $payload_data['exp'] ?? null;
    
    error_log("[JWT] Current: $current_time, Expires: $exp_time, Valid: " . ($exp_time > $current_time ? 'YES' : 'NO'));

    if (!$payload_data || $exp_time < $current_time) {
        return false;
    }

    return get_user_by('id', $payload_data['user_id']);
}