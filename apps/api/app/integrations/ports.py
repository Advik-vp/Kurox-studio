from abc import ABC, abstractmethod
from typing import Any


class EmailPort(ABC):
    @abstractmethod
    def send(self, to: str, subject: str, body: str) -> None: ...


class StoragePort(ABC):
    @abstractmethod
    def presign_put(self, key: str, mime: str) -> dict[str, Any]: ...

    @abstractmethod
    def presign_get(self, key: str) -> str: ...


class PaymentPort(ABC):
    @abstractmethod
    def create_checkout(self, invoice_id: str, amount_minor: int, currency: str) -> dict: ...


class AdsMetricsPort(ABC):
    @abstractmethod
    def fetch_metrics(self, account_ref: str) -> list[dict]: ...


class ConsoleEmail(EmailPort):
    def send(self, to: str, subject: str, body: str) -> None:
        print(f"[kurox-email] to={to} subject={subject}\n{body}")


class LocalStorage(StoragePort):
    def presign_put(self, key: str, mime: str) -> dict[str, Any]:
        return {
            "url": f"/api/v1/assets/local-upload/{key}",
            "headers": {"Content-Type": mime},
            "backend": "local",
            "note": "Dev filesystem adapter — replace with S3/R2 in production",
        }

    def presign_get(self, key: str) -> str:
        return f"/api/v1/assets/local-download/{key}"


class NoOpPayment(PaymentPort):
    def create_checkout(self, invoice_id: str, amount_minor: int, currency: str) -> dict:
        return {
            "provider": "noop",
            "status": "not_configured",
            "invoice_id": invoice_id,
            "amount_minor": amount_minor,
            "currency": currency,
        }


class NoOpAds(AdsMetricsPort):
    def fetch_metrics(self, account_ref: str) -> list[dict]:
        return []


email_port: EmailPort = ConsoleEmail()
storage_port: StoragePort = LocalStorage()
payment_port: PaymentPort = NoOpPayment()
ads_port: AdsMetricsPort = NoOpAds()
