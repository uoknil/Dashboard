from .database import SessionLocal
from .models import User
from .auth import get_password_hash


def create_initial_admin(username, password):
    db = SessionLocal()

    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        print(f"User {username} already exists.")
        return

    hashed_pw = get_password_hash(password)
    new_user = User(username=username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    print(f"Admin '{username}' created successfully.")
    db.close()


if __name__ == "__main__":
    uname = input("Enter admin username: ")
    pword = input("Enter admin password: ")
    create_initial_admin(uname, pword)
