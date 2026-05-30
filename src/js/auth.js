const apiUrl = 'https://my-media-tracker-api.onrender.com';

export function getMasterKey() {
    let key = localStorage.getItem('mt_master_key');
    if (!key) {
        key = prompt("🔒 ระบบรักษาความปลอดภัย: กรุณาใส่รหัส Master Key ผู้ดูแลระบบเพื่อยืนยันสิทธิ์ในการสมัครสมาชิก");
        if (key) {
            localStorage.setItem('mt_master_key', key);
        }
    }
    return key;
}

export function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    };
}

export async function handleLogin() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;

    const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('current_username', username); 
        location.reload();
    } else {
        window.showToast("Login Failed!", 'error');
    }
}

export function handleLogout() {
    if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_username');
        location.reload();
    }
}

export function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

export function toggleAuthView(view) {
    const loginSec = document.getElementById('loginSection');
    const regSec = document.getElementById('registerSection');

    if (view === 'register') {
        loginSec.classList.add('hidden');
        regSec.classList.remove('hidden');
    } else {
        regSec.classList.add('hidden');
        loginSec.classList.remove('hidden');
    }
}

export async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUsernameInput').value.trim();
    const pass = document.getElementById('regPasswordInput').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;
    
    if (!user || !pass || !confirmPass) {
        window.showToast("❌ กรุณากรอกข้อมูลให้ครบถ้วน!", 'error');
        return;
    }
    
    if (pass !== confirmPass) {
        window.showToast("❌ รหัสผ่านไม่ตรงกัน!", 'error');
        return;
    }
    
    const masterKey = getMasterKey();
    if (!masterKey) {
        window.showToast("❌ ยกเลิกการสมัคร: จำเป็นต้องใช้ Master Key", 'error');
        return;
    }
    
    try {
        const response = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-Key': masterKey
            },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        if (response.status === 401) {
            localStorage.removeItem('mt_master_key');
            window.showToast("❌ Master Key ไม่ถูกต้อง!", 'error');
            return;
        }
        
        if (response.ok) {
            window.showToast("✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ", 'success');
            toggleAuthView('login'); // กลับไปหน้า Login
        } else {
            const res = await response.json();
            window.showToast(res.message || "❌ Registration Failed!", 'error');
        }
    } catch (error) {
        console.error(error);
        window.showToast("❌ Server error during registration.", 'error');
    }
}

export function checkAuth() {
    const token = localStorage.getItem('access_token');
    const modal = document.getElementById('loginModal');
    const userInfoPanel = document.getElementById('userInfoPanel');
    const usernameDisplay = document.getElementById('currentUsernameDisplay');

    if (!token) {
        modal.classList.remove('hidden');
        if (userInfoPanel) userInfoPanel.classList.add('hidden');
    } else {
        modal.classList.add('hidden');
        if (userInfoPanel) userInfoPanel.classList.remove('hidden');

        const savedName = localStorage.getItem('current_username') || "User";
        if (usernameDisplay) usernameDisplay.textContent = savedName;

        // เรียกโหลดข้อมูลจากไฟล์เก่า
        if (typeof window.loadItems === 'function') {
            window.loadItems();
        }
    }
}