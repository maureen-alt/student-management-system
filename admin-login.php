<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$response = ['success' => false, 'message' => ''];

try {
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'student_management_system';
    
    $conn = new mysqli($host, $username, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || empty($data['username']) || empty($data['password'])) {
        throw new Exception('Username and password required');
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    // Prepare and execute query
    $sql = "SELECT * FROM admins WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $admin = $result->fetch_assoc();
        
        if (password_verify($password, $admin['password_hash'])) {
            $response['success'] = true;
            $response['full_name'] = $admin['full_name'];
            $response['message'] = 'Login successful';
        } else {
            $response['message'] = 'Invalid password';
        }
    } else {
        $response['message'] = 'Admin user not found';
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>