from enum import Enum


class Role(str, Enum):
    admin = "admin"
    manager = "manager"
    new_joiner = "new_joiner"


class AccountStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class ContentType(str, Enum):
    pdf = "pdf"
    internal_link = "internal_link"
    external_link = "external_link"
    percipio = "percipio"


class AssignmentStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class ProgressDefaults:
    not_started = 0
    in_progress = 50
    completed = 100