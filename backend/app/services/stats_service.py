import csv
import io
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database

from ..models.enums import AssignmentStatus, Role
from .enrich import now_utc


class _Records:
    def __init__(self) -> None:
        self.total = 0
        self.completed = 0
        self.in_progress = 0
        self.not_started = 0
        self.overdue = 0

    @property
    def completion_percentage(self) -> float:
        return round(self.completed / self.total * 100, 1) if self.total else 0.0

    def add(self, assignment: dict, today) -> None:
        self.total += 1
        status = assignment.get("status")
        if status == AssignmentStatus.completed.value:
            self.completed += 1
        elif status == AssignmentStatus.in_progress.value:
            self.in_progress += 1
        else:
            self.not_started += 1
        due = assignment.get("due_date")
        if (
            due
            and due.date() < today
            and status != AssignmentStatus.completed.value
        ):
            self.overdue += 1


def _scope_joiners(db: Database, manager: dict, team_id: Optional[ObjectId] = None) -> list[dict]:
    query: dict = {
        "role": Role.new_joiner.value,
        "tower_id": manager.get("tower_id"),
        "status": "active",
    }
    allowed_teams = manager.get("team_ids") or []
    if allowed_teams:
        query["team_id"] = {"$in": list(allowed_teams)}
    if team_id is not None:
        query["team_id"] = team_id
    return list(db.users.find(query).sort("name", 1))


def dashboard_summary(db: Database, manager: dict, team_id: Optional[ObjectId] = None) -> dict:
    joiners = _scope_joiners(db, manager, team_id)
    joiner_ids = [j["_id"] for j in joiners]
    today = now_utc().date()

    overall = _Records()

    assignments = (
        list(db.training_assignments.find({"new_joiner_id": {"$in": joiner_ids}}))
        if joiner_ids
        else []
    )
    for assignment in assignments:
        overall.add(assignment, today)

    group: dict[str, dict] = {}
    for joiner in joiners:
        tid = joiner.get("team_id")
        key = str(tid)
        entry = group.setdefault(
            key,
            {"team_id": tid, "team_name": None, "joiners": 0},
        )
        entry["joiners"] += 1

    # assign assignments to teams via joiner lookup for accuracy
    joiner_map = {j["_id"]: j.get("team_id") for j in joiners}
    team_counts: dict[str, _Records] = {}
    for assignment in assignments:
        tid = joiner_map.get(assignment.get("new_joiner_id"))
        if tid is None:
            continue
        key = str(tid)
        if key not in team_counts:
            team_counts[key] = _Records()
        team_counts[key].add(assignment, today)

    team_breakdown = []
    for key, entry in group.items():
        tid = entry["team_id"]
        team = db.teams.find_one({"_id": tid}) if tid else None
        records = team_counts.get(key, _Records())
        team_breakdown.append(
            {
                "team_id": str(tid),
                "team_name": team.get("name") if team else "Unassigned",
                "total_joiners": entry["joiners"],
                "total_assignments": records.total,
                "completed": records.completed,
                "in_progress": records.in_progress,
                "not_started": records.not_started,
                "overdue": records.overdue,
                "completion_percentage": records.completion_percentage,
            }
        )

    team_breakdown.sort(key=lambda row: (row["team_name"] or ""))

    return {
        "total_joiners": len(joiners),
        "total_assignments": overall.total,
        "completed": overall.completed,
        "in_progress": overall.in_progress,
        "not_started": overall.not_started,
        "overdue": overall.overdue,
        "completion_percentage": overall.completion_percentage,
        "team_breakdown": team_breakdown,
    }


def team_report(db: Database, manager: dict, team_id: Optional[ObjectId] = None) -> list[dict]:
    joiners = _scope_joiners(db, manager, team_id)
    joiner_ids = [j["_id"] for j in joiners]
    assignments: list[dict] = (
        list(db.training_assignments.find({"new_joiner_id": {"$in": joiner_ids}}))
        if joiner_ids
        else []
    )
    today = now_utc().date()

    by_joiner: dict[ObjectId, _Records] = {}
    for assignment in assignments:
        by_joiner.setdefault(assignment["new_joiner_id"], _Records()).add(assignment, today)

    rows: list[dict] = []
    for joiner in joiners:
        tid = joiner.get("team_id")
        team = db.teams.find_one({"_id": tid}) if tid else None
        records = by_joiner.get(joiner["_id"], _Records())
        rows.append(
            {
                "joiner_id": str(joiner["_id"]),
                "joiner_name": joiner.get("name"),
                "employee_id": joiner.get("employee_id") or "",
                "username": joiner.get("username"),
                "team_name": team.get("name") if team else "Unassigned",
                "joining_date": (joiner.get("joining_date") or "").date().isoformat()
                if joiner.get("joining_date")
                else "",
                "status": joiner.get("status"),
                "total_assignments": records.total,
                "completed": records.completed,
                "in_progress": records.in_progress,
                "not_started": records.not_started,
                "overdue": records.overdue,
                "completion_percentage": records.completion_percentage,
            }
        )
    return rows


_REPORT_HEADERS = [
    "Joiner Name",
    "Employee ID",
    "Username",
    "Team",
    "Joining Date",
    "Status",
    "Total Assignments",
    "Completed",
    "In Progress",
    "Not Started",
    "Overdue",
    "Completion %",
]


def report_to_csv(rows: list[dict]) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=_REPORT_HEADERS, extrasaction="ignore", lineterminator="\n")
    mapping = {
        "Joiner Name": "joiner_name",
        "Employee ID": "employee_id",
        "Username": "username",
        "Team": "team_name",
        "Joining Date": "joining_date",
        "Status": "status",
        "Total Assignments": "total_assignments",
        "Completed": "completed",
        "In Progress": "in_progress",
        "Not Started": "not_started",
        "Overdue": "overdue",
        "Completion %": "completion_percentage",
    }
    writer.writeheader()
    for row in rows:
        writer.writerow({header: row.get(mapping[header], "") for header in _REPORT_HEADERS})
    return buffer.getvalue()