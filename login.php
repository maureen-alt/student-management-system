<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$response = ['success' => false, 'message' => ''];

try {
    // Direct database connection (same as working register.php)
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'student_management_system';
    
    $conn = new mysqli($host, $username, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    // Get POST data
    $input = file_get_contents('php://input');
    if (!$input) {
        throw new Exception('No data received');
    }
    
    $data = json_decode($input, true);
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    // Validate required fields
    if (empty($data['studentId']) || empty($data['dob'])) {
        throw new Exception('Student ID and Date of Birth are required');
    }
    
    $studentId = $data['studentId'];
    $dob = $data['dob'];
    
    // Query to check student credentials
    $sql = "SELECT student_id, full_name, date_of_birth FROM students WHERE student_id = ? AND date_of_birth = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param("ss", $studentId, $dob);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $student = $result->fetch_assoc();
        $response['success'] = true;
        $response['name'] = $student['full_name'];
        $response['studentId'] = $student['student_id'];
        $response['message'] = 'Login successful';
    } else {
        $response['success'] = false;
        $response['message'] = 'Invalid Student ID or Date of Birth';
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>