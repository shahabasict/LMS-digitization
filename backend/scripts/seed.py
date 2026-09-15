"""Seed script — creates demo towers/teams, accounts, training modules, assignments & feedback.

Usage (from backend/):
    PYTHONPATH=. .venv/bin/python scripts/seed.py
"""
import random
from datetime import datetime, timedelta, timezone

from app.core.database import db, ensure_indexes
from app.core.security import hash_password
from app.models.enums import AssignmentStatus, ContentType, Role

rng = random.Random(42)

COLLECTIONS = [
    "users",
    "towers",
    "teams",
    "training_modules",
    "training_assignments",
    "feedback",
]


def now() -> datetime:
    return datetime.now(timezone.utc)


def days_ago(days: int) -> datetime:
    return now() - timedelta(days=days)


def main() -> None:
    for collection in COLLECTIONS:
        db.drop_collection(collection)
    ensure_indexes()

    # --- Towers & Teams ---
    tower_defs = [
        ("Technology Enablement", ["Platform Engineering", "Digital Workplace"]),
        ("Client Solutions", ["Implementation", "Support Services"]),
        ("Operations Excellence", ["Quality Assurance", "Service Desk"]),
    ]
    tower_records = {}
    team_records = {}
    for tower_name, team_names in tower_defs:
        tower_id = db.towers.insert_one(
            {"name": tower_name, "description": f"{tower_name} tower", "created_at": now(), "updated_at": now()}
        ).inserted_id
        tower_records[tower_name] = tower_id
        team_records[tower_name] = {}
        for team_name in team_names:
            team_id = db.teams.insert_one(
                {"name": team_name, "tower_id": tower_id, "description": f"{team_name} team", "created_at": now(), "updated_at": now()}
            ).inserted_id
            team_records[tower_name][team_name] = team_id

    # --- Admin ---
    db.users.insert_one(
        {
            "role": Role.admin.value,
            "name": "System Administrator",
            "username": "admin",
            "email": "admin@example.com",
            "password_hash": hash_password("Admin@123"),
            "status": "active",
            "created_at": now(),
            "updated_at": now(),
        }
    )

    # --- Managers ---
    manager_defs = [
        {
            "name": "Priya Raman",
            "username": "priya.raman",
            "email": "priya.raman@example.com",
            "employee_id": "M-1001",
            "tower": "Technology Enablement",
            "teams": ["Platform Engineering", "Digital Workplace"],
        },
        {
            "name": "James Okafor",
            "username": "james.okafor",
            "email": "james.okafor@example.com",
            "employee_id": "M-1002",
            "tower": "Client Solutions",
            "teams": ["Implementation"],
        },
        {
            "name": "Elena Vasquez",
            "username": "elena.vasquez",
            "email": "elena.vasquez@example.com",
            "employee_id": "M-1003",
            "tower": "Operations Excellence",
            "teams": ["Quality Assurance", "Service Desk"],
        },
    ]
    manager_records = {}
    for m in manager_defs:
        mid = db.users.insert_one(
            {
                "role": Role.manager.value,
                "name": m["name"],
                "username": m["username"],
                "email": m["email"],
                "employee_id": m["employee_id"],
                "tower_id": tower_records[m["tower"]],
                "team_ids": [team_records[m["tower"]][t] for t in m["teams"]],
                "password_hash": hash_password("Manager@123"),
                "status": "active",
                "created_at": now(),
                "updated_at": now(),
            }
        ).inserted_id
        manager_records[m["username"]] = mid

    # --- Training Modules (~25, mirrors the onboarding kit) ---
    module_defs = [
        ("Welcome to the Organization", "Overview of company values, culture and vision.", ContentType.pdf, None, 45),
        ("Onboarding Kickoff Webinar", "Live session recording for first-week orientation.", ContentType.internal_link, "/content/onboarding-kickoff", 60),
        ("Code of Conduct", "Standards of behavior expected across teams.", ContentType.pdf, None, 30),
        ("Information Security Essentials", "Security hygiene for day-to-day work.", ContentType.external_link, "https://learn.example.com/infosec", 40),
        ("Data Privacy Foundations", "Basics of handling personal and client data.", ContentType.pdf, None, 35),
        ("Client Environment Overview", "How the client environment is organized.", ContentType.internal_link, "/content/client-overview", 50),
        ("IT & Account Setup", "Setting up email, VPN and access tools.", ContentType.internal_link, "/content/it-setup", 45),
        ("Time & Attendance", "Guidelines on time tracking and leave.", ContentType.pdf, None, 25),
        ("Leading by Example", "Percipio course on people fundamentals.", ContentType.percipio, "https://percipio.example.com/leading-by-example", 90),
        ("Effective Communication", "Percipio course on clear communication.", ContentType.percipio, "https://percipio.example.com/effective-communication", 75),
        ("Working in Agile Teams", "Intro to agile ceremonies and roles.", ContentType.internal_link, "/content/agile-teams", 55),
        ("Project Tools 101", "Using the project management tool.", ContentType.external_link, "https://learn.example.com/project-tools", 40),
        ("Customer Service Fundamentals", "Client-facing interaction basics.", ContentType.pdf, None, 60),
        ("Quality Assurance Basics", "QA process overview for operations teams.", ContentType.pdf, None, 45),
        ("Service Desk Playbook", "Triage and escalation guidelines.", ContentType.percipio, "https://percipio.example.com/service-desk", 100),
        ("Cloud Platform Primer", "Intro to the cloud platform used in engagements.", ContentType.external_link, "https://learn.example.com/cloud-primer", 80),
        ("Data Analytics for Teams", "Percipio course on analytics fundamentals.", ContentType.percipio, "https://percipio.example.com/data-analytics", 110),
        ("Continuous Learning Culture", "How to make the most of Percipio.", ContentType.percipio, "https://percipio.example.com/learning-culture", 30),
        ("Employee Handbook", "Policies and procedures reference.", ContentType.pdf, None, 70),
        ("Performance Snapshot", "Understanding mid-year check-ins.", ContentType.internal_link, "/content/performance-snapshot", 35),
        ("Payroll & Benefits", "Compensation cycle and benefits details.", ContentType.pdf, None, 30),
        ("Compliance Refresh", "Quarterly compliance refresher.", ContentType.pdf, None, 50),
        ("Tools & Automation Lab", "Self-paced lab on automation.", ContentType.percipio, "https://percipio.example.com/tools-automation", 120),
        ("Client Readiness Workshop", "Workshop material on client delivery readiness.", ContentType.internal_link, "/content/client-readiness", 90),
        ("Team Building Activities", "Shared activities to build camaraderie.", ContentType.external_link, "https://learn.example.com/team-building", 45),
    ]
    module_records = {}
    for name, description, content_type, url, duration in module_defs:
        if content_type == ContentType.pdf and url is None:
            url = f"/content/{name.lower().replace(' ', '-')}.pdf"
        tower_ids = []
        team_ids = []
        # Modules applicable to a specific tower when they mention a tower
        if "Service Desk" in name and "Client Solutions" in tower_records:
            tower_ids = [tower_records["Client Solutions"]]
            team_ids = [team_records["Client Solutions"]["Support Services"]]
        if "QA" in name or "Quality" in name:
            tower_ids = [tower_records["Operations Excellence"]]
            team_ids = [team_records["Operations Excellence"]["Quality Assurance"]]
        mid = db.training_modules.insert_one(
            {
                "name": name,
                "description": description,
                "content_type": content_type.value,
                "content_url": url,
                "duration_minutes": duration,
                "tower_ids": tower_ids,
                "team_ids": team_ids,
                "status": "active",
                "created_by": manager_records["priya.raman"],
                "created_at": now(),
                "updated_at": now(),
            }
        ).inserted_id
        module_records[name] = mid

    all_module_ids = list(module_records.values())

    # --- New Joiners ---
    joiner_defs = [
        ("Aisha Khan", "aisha.khan", "J-2001", "Technology Enablement", "Platform Engineering", "priya.raman"),
        ("Marco Silva", "marco.silva", "J-2002", "Technology Enablement", "Digital Workplace", "priya.raman"),
        ("Liam Chen", "liam.chen", "J-2003", "Technology Enablement", "Platform Engineering", "priya.raman"),
        ("Fatima Noor", "fatima.noor", "J-2004", "Client Solutions", "Implementation", "james.okafor"),
        ("Diego Torres", "diego.torres", "J-2005", "Client Solutions", "Implementation", "james.okafor"),
        ("Sofia Lindqvist", "sofia.lindqvist", "J-2006", "Operations Excellence", "Quality Assurance", "elena.vasquez"),
        ("Noah Williams", "noah.williams", "J-2007", "Operations Excellence", "Service Desk", "elena.vasquez"),
        ("Grace Adeyemi", "grace.adeyemi", "J-2008", "Operations Excellence", "Service Desk", "elena.vasquez"),
    ]
    joiner_records = {}
    for name, username, emp_id, tower, team, mgr_uname in joiner_defs:
        top = 5 if tower == "Technology Enablement" else 8
        jid = db.users.insert_one(
            {
                "role": Role.new_joiner.value,
                "name": name,
                "username": username,
                "email": f"{username}@example.com",
                "employee_id": emp_id,
                "tower_id": tower_records[tower],
                "team_id": team_records[tower][team],
                "manager_id": manager_records[mgr_uname],
                "joining_date": days_ago(rng.choice([top, top - 1, top - 2])),
                "password_hash": hash_password("Joiner@123"),
                "status": "active",
                "created_at": days_ago(top),
                "updated_at": now(),
            }
        ).inserted_id
        joiner_records[username] = jid

    # --- Training Assignments ---
    assignment_doc_ids = []
    for username, jid in joiner_records.items():
        module_pool = all_module_ids[:]
        rng.shuffle(module_pool)
        assigned = module_pool[: rng.randint(6, 10)]
        for idx, mid in enumerate(assigned):
            roll = rng.random()
            if roll < 0.35:
                status = AssignmentStatus.completed.value
                progress = 100
                completed_date = days_ago(rng.randint(0, 1))
                started_date = days_ago(rng.randint(8, 12))
            elif roll < 0.65:
                status = AssignmentStatus.in_progress.value
                progress = rng.randint(30, 80)
                completed_date = None
                started_date = days_ago(rng.randint(1, 6))
            else:
                status = AssignmentStatus.not_started.value
                progress = 0
                completed_date = None
                started_date = None
            due_offset = rng.choice([3, 5, 8, -2, -5])
            doc = {
                "new_joiner_id": jid,
                "training_module_id": mid,
                "assigned_by": (
                    manager_records["priya.raman"] if idx % 2 == 0 else manager_records["elena.vasquez"]
                ),
                "assigned_date": days_ago(rng.randint(10, 18)),
                "due_date": now() + timedelta(days=due_offset),
                "status": status,
                "progress": progress,
                "started_date": started_date,
                "completed_date": completed_date,
                "created_at": now(),
                "updated_at": now(),
            }
            assignment_doc_ids.append(db.training_assignments.insert_one(doc).inserted_id)

    # --- Feedback ---
    completed_assignments = db.training_assignments.find({"status": "completed"})
    feedback_count = 0
    for assignment in completed_assignments:
        if feedback_count >= 12:
            break
        module = db.training_modules.find_one({"_id": assignment["training_module_id"]})
        db.feedback.insert_one(
            {
                "new_joiner_id": assignment["new_joiner_id"],
                "training_module_id": assignment["training_module_id"],
                "rating": rng.randint(3, 5),
                "comment": f"Good coverage of {module['name']}. Clear and easy to follow.",
                "created_at": assignment.get("completed_date") or now(),
            }
        )
        feedback_count += 1

    print("Seed complete.")
    print("  Towers:")
    for t in db.towers.find():
        print(f"    - {t['name']}")
    print("  Accounts (username / password):")
    print("    - admin            / Admin@123")
    print("    - priya.raman      / Manager@123")
    print("    - james.okafor     / Manager@123")
    print("    - elena.vasquez    / Manager@123")
    for j in db.users.find({"role": "new_joiner"}):
        print(f"    - {j['username']} / Joiner@123")


if __name__ == "__main__":
    main()