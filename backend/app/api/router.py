from fastapi import APIRouter

from . import admin, assignments, auth, feedback, joiners, master, me, modules, reports

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(master.router)
api_router.include_router(admin.router)
api_router.include_router(joiners.router)
api_router.include_router(modules.router)
api_router.include_router(assignments.router)
api_router.include_router(feedback.router)
api_router.include_router(reports.router)
api_router.include_router(me.router)