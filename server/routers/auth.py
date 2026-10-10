import time
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=3, max_length=100)
    institution: str = Field(default="College Member", max_length=150)

class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=3, max_length=100)

class UpdateRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(SUPER_ADMIN|ADMIN|USER)$")

class UpdateStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|PENDING|SUSPENDED)$")

# In-memory user store seeded with official Super Admin and Demo Accounts
USERS_DB: list[dict] = [
    {
        "id": "usr_super_admin_01",
        "name": "Super Admin (Bhanu)",
        "email": "admin@college.edu",
        "password": "Bhanu@2006",
        "role": "SUPER_ADMIN",
        "status": "ACTIVE",
        "institution": "College AI Administration",
        "created_at": int(time.time()) - 30 * 86400,
    },
    {
        "id": "usr_faculty_02",
        "name": "Prof. Surya Admin",
        "email": "faculty@college.edu",
        "password": "Admin@2026",
        "role": "ADMIN",
        "status": "ACTIVE",
        "institution": "Department of Computer Science",
        "created_at": int(time.time()) - 10 * 86400,
    },
    {
        "id": "usr_student_03",
        "name": "Student Demo",
        "email": "student@college.edu",
        "password": "Student@2026",
        "role": "USER",
        "status": "ACTIVE",
        "institution": "School of Engineering",
        "created_at": int(time.time()) - 5 * 86400,
    },
]

def sanitize_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "password"}

@router.post("/signup")
async def signup(request: UserSignupRequest):
    email = request.email.strip().lower()
    if any(u["email"].lower() == email for u in USERS_DB):
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    is_super_admin = email in ("admin@college.edu", "admin@datai.edu")
    role = "SUPER_ADMIN" if is_super_admin else "USER"
    status = "ACTIVE" if is_super_admin else "PENDING"

    new_user = {
        "id": f"usr_{int(time.time())}",
        "name": request.name.strip(),
        "email": email,
        "password": request.password.strip(),
        "role": role,
        "status": status,
        "institution": request.institution.strip() or "College Member",
        "created_at": int(time.time()),
    }
    USERS_DB.insert(0, new_user)

    return {
        "status": "success",
        "user": sanitize_user(new_user),
        "pending_approval": status == "PENDING",
        "message": (
            "Registration submitted! Your account is pending access approval by the Super Admin (admin@college.edu)."
            if status == "PENDING"
            else "Account created successfully."
        ),
        "token": f"token_{new_user['id']}" if status == "ACTIVE" else None,
    }

@router.post("/login")
async def login(request: UserLoginRequest):
    email = request.email.strip().lower()
    password = request.password.strip()

    user = next((u for u in USERS_DB if u["email"].lower() == email), None)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email. Please sign up.")

    if user.get("password") and user["password"] != password:
        raise HTTPException(status_code=401, detail="Incorrect password. Please verify your credentials.")

    if user.get("status") == "PENDING":
        raise HTTPException(
            status_code=403,
            detail="Your account is pending access approval by the Super Admin (admin@college.edu). Access has not yet been granted."
        )

    if user.get("status") == "SUSPENDED":
        raise HTTPException(
            status_code=403,
            detail="This account has been suspended by the administrator."
        )

    return {
        "status": "success",
        "user": sanitize_user(user),
        "token": f"token_{user['id']}",
    }

@router.get("/users")
async def get_users():
    return {
        "status": "ok",
        "count": len(USERS_DB),
        "users": [sanitize_user(u) for u in USERS_DB],
        "open_registration": True,
    }

@router.patch("/users/{user_id}/status")
async def update_status(user_id: str, request: UpdateStatusRequest):
    user = next((u for u in USERS_DB if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["status"] = request.status
    return {"status": "ok", "user": sanitize_user(user)}

@router.patch("/users/{user_id}/role")
async def update_role(user_id: str, request: UpdateRoleRequest):
    user = next((u for u in USERS_DB if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["role"] = request.role
    return {"status": "ok", "user": sanitize_user(user)}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    global USERS_DB
    user = next((u for u in USERS_DB if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["role"] == "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="Cannot delete Super Admin account")

    USERS_DB = [u for u in USERS_DB if u["id"] != user_id]
    return {"status": "ok", "deleted_id": user_id}
