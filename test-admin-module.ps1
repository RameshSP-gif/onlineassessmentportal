# Admin Module Testing Script

Write-Host "🧪 Testing Admin Module APIs..." -ForegroundColor Cyan

# Base URL
$baseUrl = "http://localhost:5001/api"

# Test 1: Register Admin User
Write-Host "`n1️⃣  Testing Admin Registration..." -ForegroundColor Yellow
try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body (@{
        username = "testadmin"
        email = "testadmin@test.com"
        password = "admin123"
        role = "admin"
    } | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "✅ Admin registered successfully" -ForegroundColor Green
    Write-Host "   Token: $($registerResponse.token.Substring(0,20))..." -ForegroundColor Gray
    $token = $registerResponse.token
} catch {
    Write-Host "ℹ️  User already exists or registration failed" -ForegroundColor Gray
    
    # Try login instead
    Write-Host "`n1️⃣  Testing Admin Login..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
        email = "admin@test.com"
        password = "admin123"
    } | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "✅ Admin logged in successfully" -ForegroundColor Green
    $token = $loginResponse.token
}

# Test 2: Dashboard Stats
Write-Host "`n2️⃣  Testing Admin Dashboard..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" -Method GET
    Write-Host "✅ Dashboard loaded" -ForegroundColor Green
    Write-Host "   📊 Total Students: $($dashboard.stats.totalStudents)" -ForegroundColor Gray
    Write-Host "   📝 Total Exams: $($dashboard.stats.totalExams)" -ForegroundColor Gray
    Write-Host "   📋 Submissions: $($dashboard.stats.totalSubmissions)" -ForegroundColor Gray
    Write-Host "   💰 Revenue: ₹$($dashboard.stats.totalRevenue)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Dashboard failed: $_" -ForegroundColor Red
}

# Test 3: Get All Students
Write-Host "`n3️⃣  Testing Student Management..." -ForegroundColor Yellow
try {
    $students = Invoke-RestMethod -Uri "$baseUrl/admin/students" -Method GET
    Write-Host "✅ Students loaded: $($students.Count) students" -ForegroundColor Green
    if ($students.Count -gt 0) {
        $student = $students[0]
        Write-Host "   First Student: $($student.username) ($($student.email))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Students failed: $_" -ForegroundColor Red
}

# Test 4: Get All Exams
Write-Host "`n4️⃣  Testing Exam Management..." -ForegroundColor Yellow
try {
    $exams = Invoke-RestMethod -Uri "$baseUrl/exams" -Method GET
    Write-Host "✅ Exams loaded: $($exams.Count) exams" -ForegroundColor Green
    if ($exams.Count -gt 0) {
        Write-Host "   Exams:" -ForegroundColor Gray
        foreach ($exam in $exams[0..2]) {
            Write-Host "   - $($exam.title) ($($exam.duration)min, $($exam.total_marks) marks)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Exams failed: $_" -ForegroundColor Red
}

# Test 5: Get Fees
Write-Host "`n5️⃣  Testing Fee Management..." -ForegroundColor Yellow
try {
    $fees = Invoke-RestMethod -Uri "$baseUrl/admin/fees" -Method GET
    Write-Host "✅ Fees loaded: $($fees.Count) fee records" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No fees yet or endpoint error" -ForegroundColor Gray
}

# Test 6: Get Reports
Write-Host "`n6️⃣  Testing Reports..." -ForegroundColor Yellow
try {
    $reports = Invoke-RestMethod -Uri "$baseUrl/admin/reports" -Method GET
    Write-Host "✅ Reports generated" -ForegroundColor Green
    Write-Host "   📈 Exam Stats: $($reports.examStats.Count) exams" -ForegroundColor Gray
    Write-Host "   👥 User Performance: $($reports.userPerformance.Count) users" -ForegroundColor Gray
} catch {
    Write-Host "❌ Reports failed: $_" -ForegroundColor Red
}

# Test 7: Send Test Notification
Write-Host "`n7️⃣  Testing Notifications..." -ForegroundColor Yellow
try {
    $notification = Invoke-RestMethod -Uri "$baseUrl/admin/notifications" -Method POST -Body (@{
        title = "Test Notification"
        message = "This is a test notification from admin"
        target = "all"
    } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ Notification sent successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Notification failed: $_" -ForegroundColor Red
}

# Test 8: Create Test Exam
Write-Host "`n8️⃣  Testing Exam Creation..." -ForegroundColor Yellow
try {
    $newExam = Invoke-RestMethod -Uri "$baseUrl/exams" -Method POST -Body (@{
        title = "Test Admin Exam"
        description = "Created by admin test script"
        duration = 15
        total_marks = 5
        questions = @(
            @{
                question_text = "What is 2+2?"
                option_a = "3"
                option_b = "4"
                option_c = "5"
                option_d = "6"
                correct_answer = "b"
                marks = 1
            },
            @{
                question_text = "What is the capital of France?"
                option_a = "London"
                option_b = "Berlin"
                option_c = "Paris"
                option_d = "Madrid"
                correct_answer = "c"
                marks = 1
            }
        )
    } | ConvertTo-Json -Depth 10) -ContentType "application/json"
    Write-Host "✅ Exam created successfully" -ForegroundColor Green
    Write-Host "   Exam ID: $($newExam.examId)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Exam creation failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ All Tests Completed!" -ForegroundColor Green
Write-Host "`n📱 Frontend URLs:" -ForegroundColor Cyan
Write-Host "   Admin Dashboard: http://localhost:3000/admin/dashboard" -ForegroundColor Gray
Write-Host "   Student Management: http://localhost:3000/admin/students" -ForegroundColor Gray
Write-Host "   Exam Management: http://localhost:3000/admin/exams" -ForegroundColor Gray
Write-Host "   Fee Management: http://localhost:3000/admin/fees" -ForegroundColor Gray
Write-Host "   Reports: http://localhost:3000/admin/reports" -ForegroundColor Gray
Write-Host "   Notifications: http://localhost:3000/admin/notifications" -ForegroundColor Gray
Write-Host "   Submissions: http://localhost:3000/admin/submissions" -ForegroundColor Gray
