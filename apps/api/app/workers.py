"""Celery worker entry. Start with: celery -A app.workers.celery_app worker -l info"""

from celery import Celery

from app.core.config import get_settings

settings = get_settings()
celery_app = Celery("kurox", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_routes = {
    "app.workers.send_email": {"queue": "mail"},
}


@celery_app.task(name="app.workers.send_email")
def send_email(to: str, subject: str, body: str) -> None:
    from app.integrations.ports import email_port

    email_port.send(to, subject, body)
