from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime
from typing import Callable
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        logger.info("Email scheduler started")

    def schedule_email(self, job_id: str, scheduled_time: datetime,
                      callback: Callable, *args, **kwargs) -> str:
        """Schedule an email to be sent at a specific time"""
        try:
            job = self.scheduler.add_job(
                callback,
                trigger=DateTrigger(run_date=scheduled_time),
                id=job_id,
                args=args,
                kwargs=kwargs,
                replace_existing=True
            )
            logger.info(f"Scheduled email job {job_id} for {scheduled_time}")
            return job_id
        except Exception as e:
            logger.error(f"Failed to schedule email: {e}")
            raise

    def cancel_job(self, job_id: str) -> bool:
        """Cancel a scheduled job"""
        try:
            self.scheduler.remove_job(job_id)
            logger.info(f"Cancelled job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to cancel job {job_id}: {e}")
            return False

    def get_scheduled_jobs(self):
        """Get all scheduled jobs"""
        return self.scheduler.get_jobs()

    def shutdown(self):
        """Shutdown the scheduler"""
        self.scheduler.shutdown()
        logger.info("Scheduler shut down")
