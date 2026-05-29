<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(E_ALL);
ini_set('display_errors', 1);

$response = ['success' => false, 'message' => ''];

try {
    // Direct database connection
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'student_management_system';
    
    $conn = new mysqli($host, $username, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    $studentId = $_GET['studentId'] ?? '';
    
    if (empty($studentId)) {
        throw new Exception('Student ID is required');
    }
    
    // Get student profile
    $profileSql = "SELECT * FROM students WHERE student_id = ?";
    $stmt = $conn->prepare($profileSql);
    $stmt->bind_param("s", $studentId);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();
    
    if (!$profile) {
        throw new Exception('Student not found');
    }
    
    // Get subjects and results (if any results table exists)
    $subjects = [];
    $results = [];
    
    // Check if student_results table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'student_results'");
    if ($tableCheck->num_rows > 0) {
        $subjectsSql = "SELECT s.subject_name, r.score, r.grade, r.exam_name, r.max_score
                        FROM student_results r 
                        JOIN subjects s ON r.subject_id = s.id 
                        WHERE r.student_id = ? 
                        ORDER BY r.id DESC";
        $stmt = $conn->prepare($subjectsSql);
        $stmt->bind_param("s", $studentId);
        $stmt->execute();
        $resultsResult = $stmt->get_result();
        
        while ($row = $resultsResult->fetch_assoc()) {
            $subjects[] = ['name' => $row['subject_name'], 'grade' => $row['grade']];
            $results[] = $row;
        }
    }
    
    // Get fees
    $feesSql = "SELECT * FROM fees WHERE student_id = ?";
    $stmt = $conn->prepare($feesSql);
    $stmt->bind_param("s", $studentId);
    $stmt->execute();
    $fees = $stmt->get_result()->fetch_assoc();
    
    if (!$fees) {
        // Create default fees if not exists
        $gradeNum = (int)filter_var($profile['grade'], FILTER_SANITIZE_NUMBER_INT);
        $totalFees = ($gradeNum >= 10) ? 30000 : (($gradeNum >= 7) ? 25000 : 20000);
        $fees = ['total_fees' => $totalFees, 'amount_paid' => 0, 'status' => 'Pending'];
    }
    
    // Calculate stats
    $totalSubjects = count($subjects);
    $averageScore = 0;
    if ($totalSubjects > 0 && isset($results[0]['score'])) {
        $totalScore = array_sum(array_column($results, 'score'));
        $averageScore = round($totalScore / $totalSubjects, 1);
    }
    
    $response['success'] = true;
    $response['profile'] = [
        'studentId' => $profile['student_id'],
        'name' => $profile['full_name'],
        'dob' => $profile['date_of_birth'],
        'email' => $profile['email'],
        'grade' => $profile['grade'],
        'registrationDate' => $profile['registration_date']
    ];
    $response['subjects'] = $subjects;
    $response['results'] = $results;
    $response['fees'] = [
        'total' => $fees['total_fees'],
        'paid' => $fees['amount_paid'],
        'balance' => $fees['total_fees'] - $fees['amount_paid'],
        'status' => $fees['status']
    ];
    $response['stats'] = [
        'totalSubjects' => $totalSubjects,
        'averageScore' => $averageScore,
        'attendance' => 85, // Default value
        'feesStatus' => $fees['status']
    ];
    
    $conn->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>