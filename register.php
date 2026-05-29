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
    // Try multiple possible paths for database.php
    $possiblePaths = [
        __DIR__ . '/../config/database.php',  // php/api/../config/database.php
        __DIR__ . '/config/database.php',      // php/api/config/database.php
        dirname(__DIR__) . '/config/database.php', // Same as first
        $_SERVER['DOCUMENT_ROOT'] . '/student-management-system/php/config/database.php'
    ];
    
    $dbFileFound = false;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $dbFileFound = true;
            $response['debug_path'] = $path; // For debugging
            break;
        }
    }
    
    if (!$dbFileFound) {
        throw new Exception('Database configuration file not found. Tried paths: ' . implode(', ', $possiblePaths));
    }
    
    // Check if connection was successful
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed: ' . ($conn->connect_error ?? 'Connection object not found'));
    }
    
    // Get POST data
    $input = file_get_contents('php://input');
    if (!$input) {
        throw new Exception('No data received');
    }
    
    $data = json_decode($input, true);
    if (!$data) {
        throw new Exception('Invalid JSON data received. Raw input: ' . $input);
    }
    
    // Validate required fields
    if (empty($data['fullName']) || empty($data['dob']) || empty($data['email']) || empty($data['grade'])) {
        throw new Exception('Missing required fields. Received: ' . json_encode($data));
    }
    
    // Generate unique student ID
    $studentId = 'S' . rand(1000, 9999);
    
    // Check if student ID already exists (unlikely but possible)
    $checkSql = "SELECT student_id FROM students WHERE student_id = ?";
    $checkStmt = $conn->prepare($checkSql);
    if ($checkStmt) {
        $checkStmt->bind_param("s", $studentId);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        while ($checkResult->num_rows > 0) {
            $studentId = 'S' . rand(1000, 9999);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
        }
        $checkStmt->close();
    }
    
    // Insert student
    $sql = "INSERT INTO students (student_id, full_name, date_of_birth, email, phone, parent_contact, grade, registration_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param("sssssss", 
        $studentId, 
        $data['fullName'], 
        $data['dob'], 
        $data['email'], 
        $data['phone'], 
        $data['parentContact'], 
        $data['grade']
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Database execute failed: ' . $stmt->error);
    }
    
    $stmt->close();
    
    // Create default fees record
    $gradeNum = (int)filter_var($data['grade'], FILTER_SANITIZE_NUMBER_INT);
    $totalFees = ($gradeNum >= 10) ? 30000 : (($gradeNum >= 7) ? 25000 : 20000);
    
    $feesSql = "INSERT INTO fees (student_id, total_fees, amount_paid, status) VALUES (?, ?, 0, 'Pending')";
    $feesStmt = $conn->prepare($feesSql);
    if ($feesStmt) {
        $feesStmt->bind_param("si", $studentId, $totalFees);
        $feesStmt->execute();
        $feesStmt->close();
    }
    
    $response['success'] = true;
    $response['studentId'] = $studentId;
    $response['message'] = 'Registration successful';
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    $response['debug_info'] = [
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
}

// Close connection if it exists
if (isset($conn) && $conn) {
    $conn->close();
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>