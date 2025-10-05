# 🔐 Quick Admin Access Guide

## Access Admin Tools

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8001

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Navigate to Admin Page
Open your browser and go to:
```
http://localhost:3000/admin
```

### 3. Enter Password
**Default Password:** `kenpolimarket2027`

### 4. Access Tools
Once logged in, you can:
- 🧮 **Scenario Calculator** - Create and test election scenarios
- 👥 **Candidate Management** - Add, edit, or remove candidates

## Change Password

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=your-new-password
```

Then restart the frontend server.

## Logout

Click the **🔓 Logout** button in the top-right corner of the admin page.

---

**Note:** This is temporary protection. See `ADMIN_PROTECTION.md` for full details.

