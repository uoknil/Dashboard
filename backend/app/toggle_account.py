from .database import SessionLocal
from .models import User


def toggle_account():
    uname = input(
        "Enter username to toggle status for: (if disabled will be enabled and vice versa): ")
    db = SessionLocal()
    user = db.query(User).filter(User.username == uname).first()
    if user:
        user.is_active = not user.is_active
        db.commit()
        print(f"User {uname} is_active column is now set to {user.is_active}")
    else:
        print("User not found.")
    db.close()


if __name__ == "__main__":
    toggle_account()
