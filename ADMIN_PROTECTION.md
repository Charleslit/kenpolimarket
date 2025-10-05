# Admin Tools Protection

## Current Implementation: Temporary Password Protection

The admin tools (`/admin` page) are currently protected with a simple password-based authentication system. This is a **temporary solution** that will be replaced with proper JWT-based authentication in the future.

## How It Works

### Frontend Protection
- The `/admin` page requires a password to access
- Password is stored in environment variable `NEXT_PUBLIC_ADMIN_PASSWORD`
- Authentication state is stored in browser's `sessionStorage`
- Users remain authenticated for the browser session
- Logout clears the session and requires re-authentication

### Default Password
```
kenpolimarket2027
```

**⚠️ IMPORTANT: Change this password in production!**

## Setup Instructions

### 1. Set Your Admin Password

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password-here
```

### 2. Restart the Frontend Server

After changing the password, restart your Next.js development server:
```bash
cd frontend
npm run dev
```

### 3. Access Admin Tools

1. Navigate to `http://localhost:3000/admin`
2. Enter your password
3. Access the admin tools (Scenario Calculator & Candidate Management)

## Features

### ✅ Current Features
- Password-protected admin page
- Session-based authentication (persists during browser session)
- Logout functionality
- Clean login UI
- Error handling for incorrect passwords

### 🔄 Planned Features (Future Implementation)
- JWT-based authentication
- User accounts with different permission levels
- Backend API protection
- OAuth integration (Google, GitHub, etc.)
- Role-based access control (Admin, Editor, Viewer)
- Audit logging
- Password reset functionality
- Multi-factor authentication (MFA)

## Security Notes

### Current Limitations
⚠️ **This is NOT production-ready security!**

- Password is stored in environment variable (visible in client-side code)
- No backend validation
- No rate limiting
- No brute-force protection
- Session storage can be manipulated in browser dev tools
- Anyone with access to the source code can see the password

### Why This Approach?
This temporary solution provides:
1. **Quick protection** - Prevents casual access to admin tools
2. **Easy setup** - No database or auth service required
3. **Simple to replace** - Can be swapped with proper auth later
4. **Good for development** - Suitable for local development and testing

### When to Upgrade
You should implement proper authentication when:
- Deploying to production
- Multiple users need access
- Sensitive data is being managed
- Compliance requirements exist
- Public access is enabled

## Future Authentication Plan

### Phase 1: Backend JWT Authentication (Next)
```
✓ Create User model in database
✓ Implement JWT token generation
✓ Add login/register endpoints
✓ Protect API endpoints with middleware
✓ Add refresh token mechanism
```

### Phase 2: Frontend Integration
```
- Create login/register pages
- Implement token storage (httpOnly cookies)
- Add authentication context
- Protect routes with middleware
- Handle token refresh
```

### Phase 3: Advanced Features
```
- OAuth providers (Google, GitHub)
- Role-based access control
- User management dashboard
- Audit logging
- Session management
```

## API Protection

Currently, the API endpoints are **NOT protected**. Anyone can access:
- `GET /api/forecasts/*` - Read forecasts
- `GET /api/counties/*` - Read county data
- `POST /api/scenarios/calculate` - Calculate scenarios
- `POST /api/candidates/*` - Create/update candidates

### Protecting API Endpoints (Future)

When implementing proper authentication, protect endpoints like this:

```python
# backend/routers/candidates.py
from auth import get_current_admin_user

@router.post("/", response_model=CandidateResponse)
async def create_candidate(
    candidate_data: CandidateCreate,
    current_user: User = Depends(get_current_admin_user),  # Require admin
    db: Session = Depends(get_db)
):
    # Only authenticated admins can create candidates
    ...
```

## Environment Variables

### Development (.env.local)
```env
NEXT_PUBLIC_ADMIN_PASSWORD=kenpolimarket2027
```

### Production
```env
NEXT_PUBLIC_ADMIN_PASSWORD=<strong-unique-password>
```

**Never commit `.env.local` to version control!**

## Troubleshooting

### Can't Access Admin Page
1. Check that `NEXT_PUBLIC_ADMIN_PASSWORD` is set in `.env.local`
2. Restart the Next.js dev server
3. Clear browser cache and sessionStorage
4. Try incognito/private browsing mode

### Password Not Working
1. Verify the password in `.env.local` matches what you're entering
2. Check for extra spaces or special characters
3. Restart the dev server after changing `.env.local`

### Logged Out Unexpectedly
- Session storage is cleared when browser tab/window closes
- Clearing browser data will log you out
- This is expected behavior for session-based auth

## Migration Path

When ready to implement proper authentication:

1. **Keep the current system** as a fallback
2. **Implement backend auth** (JWT with User model)
3. **Add login page** with proper credentials
4. **Migrate admin page** to use JWT tokens
5. **Remove password protection** once JWT is working
6. **Delete this temporary code**

## Files Modified

- `frontend/app/admin/page.tsx` - Added password protection
- `frontend/.env.local` - Added admin password
- `.env.example` - Documented admin password variable
- `backend/auth.py` - Created (ready for future JWT implementation)

## Questions?

This is a temporary solution for development. For production deployment, proper authentication **must** be implemented before going live.

---

**Last Updated:** 2025-10-04  
**Status:** Temporary Development Solution  
**Next Step:** Implement JWT-based authentication

