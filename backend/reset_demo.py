import bcrypt

from app.main import SessionLocal, User


accounts = [
    {
        "email": "organizer@example.com",
        "name": "Ban tổ chức",
        "password": "Admin@123",
        "role": "ORGANIZER",
    },
    {
        "email": "admin@example.com",
        "name": "Quản trị viên",
        "password": "Admin@123",
        "role": "ADMIN",
    },
    {
        "email": "author@example.com",
        "name": "Tác giả Demo",
        "password": "Admin@123",
        "role": "AUTHOR",
    },
    {
        "email": "reviewer@example.com",
        "name": "Phản biện Demo",
        "password": "Admin@123",
        "role": "REVIEWER",
    },
]


def make_password_hash(password):
    # Bcrypt giới hạn 72 bytes.
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    return bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    ).decode("utf-8")


s = SessionLocal()

try:

    for item in accounts:

        email = item["email"].strip().lower()

        user = (
            s.query(User)
            .filter(User.email == email)
            .first()
        )

        password_hash = make_password_hash(
            item["password"]
        )

        if user:

            user.name = item["name"]
            user.email = email
            user.password_hash = password_hash
            user.role = item["role"]

            print(
                "Đã cập nhật:",
                email
            )

        else:

            user = User(
                name=item["name"],
                email=email,
                password_hash=password_hash,
                role=item["role"]
            )

            s.add(user)

            print(
                "Đã tạo:",
                email
            )


    s.commit()

    print()
    print("======================================")
    print(" RESET TÀI KHOẢN THÀNH CÔNG")
    print("======================================")
    print()
    print("ORGANIZER")
    print("Email: organizer@example.com")
    print("Password: Admin@123")
    print()
    print("ADMIN")
    print("Email: admin@example.com")
    print("Password: Admin@123")
    print()
    print("AUTHOR")
    print("Email: author@example.com")
    print("Password: Admin@123")
    print()
    print("REVIEWER")
    print("Email: reviewer@example.com")
    print("Password: Admin@123")


except Exception as e:

    s.rollback()

    print()
    print("======================================")
    print("CÓ LỖI")
    print("======================================")
    print(e)


finally:

    s.close()