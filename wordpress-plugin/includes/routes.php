<?php

function wp_mobile_client_register_routes() {
    register_rest_route('bgh/v1', '/health', array(
        'methods' => 'GET',
        'callback' => 'wp_mobile_client_health_check',
        'permission_callback' => '__return_true'
    ));

     register_rest_route('bgh/v1', '/login', [
        'methods'  => 'POST',
        'callback' => 'bgh_mobile_login',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('bgh/v1', '/me', [
    'methods' => 'GET',
    'callback' => 'bgh_get_me',
    'permission_callback' => 'bgh_require_auth',
]);

}

function wp_mobile_client_health_check() {
    return new WP_REST_Response(array(
        'status' => 'ok',
        'timestamp' => current_time('mysql'),
        'version' => '1.0.0'
    ), 200);
}


function bgh_mobile_login(WP_REST_Request $request) {

    $username = $request->get_param('username');
    $password = $request->get_param('password');

    if (empty($username) || empty($password)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Username and password are required',
        ], 400);
    }

    $user = wp_authenticate($username, $password);

    if (is_wp_error($user)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Invalid credentials',
        ], 401);
    }

    $token = bgh_generate_jwt($user->ID);


    return new WP_REST_Response([
        'success' => true,
        'token' => $token,
        'user' => [
            'id'       => $user->ID,
            'username' => $user->user_login,
            'email'    => $user->user_email,
            'roles'    => $user->roles,
        ],
    ], 200);
}


function bgh_get_me(WP_REST_Request $request) {

    $auth = $request->get_header('authorization');

    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        return new WP_REST_Response(['message' => 'Unauthorized'], 401);
    }

    $token = trim(str_replace('Bearer', '', $auth));
    $user = bgh_verify_jwt($token);

    if (!$user) {
        return new WP_REST_Response(['message' => 'Invalid or expired token'], 401);
    }


    return new WP_REST_Response([
        
            'id'       => $user->ID,
            'username' => $user->user_login,
            'email'    => $user->user_email,
            'roles'    => $user->roles,
    
    ], 200);
}


function bgh_require_auth(WP_REST_Request $request) {
    $auth = $request->get_header('authorization');

    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        return new WP_Error('unauthorized', 'Missing token', ['status' => 401]);
    }

    $token = trim(str_replace('Bearer', '', $auth));
    $user = bgh_verify_jwt($token);

    if (!$user) {
        return new WP_Error('unauthorized', 'Invalid token', ['status' => 401]);
    }

    wp_set_current_user($user->ID);
    return true;
}
