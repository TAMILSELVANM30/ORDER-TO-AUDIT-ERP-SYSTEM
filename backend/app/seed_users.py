from app.db import SessionLocal
from app.models.user import User, Role

DEMO_PASSWORD = "DemoPassword123!"

def seed_demo_users():
    db = SessionLocal()

    demo_users = [
        {'email': 'admin@demo.com', 'full_name': 'Admin User', 'role': Role.ADMIN},
        {'email': 'salesman.a@demo.com', 'full_name': 'Salesman A (Tamil Nadu)', 'role': Role.SALESMAN},
        {'email': 'salesman.b@demo.com', 'full_name': 'Salesman B (Karnataka)', 'role': Role.SALESMAN},
        {'email': 'production@demo.com', 'full_name': 'Production Supervisor', 'role': Role.PRODUCTION},
        {'email': 'auditor@demo.com', 'full_name': 'Chartered Auditor', 'role': Role.AUDITOR},
        {'email': 'owner@demo.com', 'full_name': 'Business Owner', 'role': Role.OWNER},
    ]

    try:
        for user_data in demo_users:
            existing = db.query(User).filter_by(email=user_data['email']).first()

            if not existing:
                user = User(
                    email=user_data['email'],
                    full_name=user_data['full_name'],
                    role=user_data['role'],
                    is_active=True
                )
                user.set_password(DEMO_PASSWORD)
                db.add(user)

        db.commit()
        print("Demo users seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"Demo user seeding failed: {e}")

    finally:
        db.close()