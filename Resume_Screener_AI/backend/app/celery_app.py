from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "resume_screener",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.resume_processing_task",
        "app.tasks.reminder_tasks",
        "app.tasks.cleanup_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
    task_soft_time_limit=120,
    task_time_limit=150,
    # Priority queues
    task_queues={
        "high": {"exchange": "high", "routing_key": "high"},
        "default": {"exchange": "default", "routing_key": "default"},
        "low": {"exchange": "low", "routing_key": "low"},
    },
    task_default_queue="default",
    task_default_exchange="default",
    task_default_routing_key="default",
    task_routes={
        "process_resume_file": {"queue": "default"},
        "reanalyze_candidate": {"queue": "high"},
        "process_bulk_upload": {"queue": "default"},
    },
    # Rate limits per task type
    task_annotations={
        "process_resume_file": {"rate_limit": "30/m"},
        "reanalyze_candidate": {"rate_limit": "30/m"},
    },
    beat_schedule={
        "send-24h-reminders": {
            "task": "app.tasks.reminder_tasks.send_24h_reminders",
            "schedule": 3600.0,
        },
        "send-1h-reminders": {
            "task": "app.tasks.reminder_tasks.send_1h_reminders",
            "schedule": 3600.0,
        },
        "cleanup-old-data": {
            "task": "app.tasks.cleanup_tasks.cleanup_old_data",
            "schedule": 86400.0,
        },
    },
)
