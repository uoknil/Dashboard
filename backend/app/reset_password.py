from .database import SessionLocal
from .models import User
from .auth import get_password_hash


def reset_password():
    uname = input("Enter username to reset: ")
    new_pword = input("Enter new password: ")
    db = SessionLocal()
    user = db.query(User).filter(User.username == uname).first()
    if user:
        user.hashed_password = get_password_hash(new_pword)
        db.commit()
        print("Password updated.")
    else:
        print("User not found.")
    db.close()


if __name__ == "__main__":
    reset_password()
