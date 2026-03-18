import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


app = FastAPI()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.mail.ru")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "v.kosarev@list.ru")
APP_PASSWORD = os.getenv("APP_PASSWORD", "")
SEND_TO = os.getenv("SEND_TO", "v.kosarev@list.ru")


def build_html(data: dict) -> str:
    name = data.get("name", "—")
    phone = data.get("phone", "—")
    comment = data.get("comment", "—") or "—"
    config = data.get("config", {})
    price = data.get("price", {})
    ts = data.get("timestamp", datetime.now().isoformat())

    door_type = "Жалюзи" if config.get("doorType") == "jaluzi" else "ЛДСП"

    side_info = ""
    if config.get("sideShelf"):
        side_label = "слева" if config.get("sideShelfSide") == "left" else "справа"
        side_info = f"""
        <tr><td style="padding:4px 8px;border:1px solid #ddd;">Боковая полка</td>
            <td style="padding:4px 8px;border:1px solid #ddd;">{side_label}, {config.get('sideShelfWidth')} см, {config.get('sideShelves')} полок</td></tr>
        """

    separate_door = ""
    if config.get("separateDoorColor"):
        separate_door = f"""
        <tr><td style="padding:4px 8px;border:1px solid #ddd;">Цвет створок</td>
            <td style="padding:4px 8px;border:1px solid #ddd;">{config.get('doorColorName', '—')}</td></tr>
        """

    def fmt(v):
        try:
            return f"{int(v):,}".replace(",", " ")
        except (TypeError, ValueError):
            return str(v)

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;">
        <h2 style="color:#2c3e50;">Новая заявка на шкаф</h2>
        <p><strong>Дата:</strong> {ts[:19].replace('T', ' ')}</p>

        <h3 style="color:#34495e;">Контакт</h3>
        <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:4px 8px;border:1px solid #ddd;width:40%;">Имя</td>
                <td style="padding:4px 8px;border:1px solid #ddd;"><strong>{name}</strong></td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Телефон</td>
                <td style="padding:4px 8px;border:1px solid #ddd;"><strong>{phone}</strong></td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Комментарий</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{comment}</td></tr>
        </table>

        <h3 style="color:#34495e;">Конфигурация</h3>
        <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:4px 8px;border:1px solid #ddd;width:40%;">Ниша (Ш x В x Г)</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{config.get('nicheWidth')} x {config.get('nicheHeight')} x {config.get('nicheDepth')} см</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Основная секция</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{config.get('mainSectionWidth')} см</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Полки</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{config.get('shelves')}</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Створки</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{config.get('doors')} шт ({door_type}, {config.get('doorWidthCm')}x{config.get('doorHeightCm')} см)</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Цвет каркаса</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{config.get('mainColorName', '—')}</td></tr>
            {separate_door}
            {side_info}
        </table>

        <h3 style="color:#34495e;">Стоимость</h3>
        <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Каркас</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{fmt(price.get('frame', 0))} руб</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Полки</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{fmt(price.get('shelves', 0))} руб</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Боковые полки</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{fmt(price.get('sideShelves', 0))} руб</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Задняя стенка</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{fmt(price.get('back', 0))} руб</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Створки</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{fmt(price.get('doors', 0))} руб</td></tr>
            <tr><td style="padding:4px 8px;border:1px solid #ddd;">Сборка</td>
                <td style="padding:4px 8px;border:1px solid #ddd;">{fmt(price.get('assembly', 0))} руб</td></tr>
            <tr style="background:#f0f0f0;"><td style="padding:6px 8px;border:1px solid #ddd;"><strong>ИТОГО</strong></td>
                <td style="padding:6px 8px;border:1px solid #ddd;"><strong style="font-size:18px;color:#e74c3c;">{fmt(price.get('total', 0))} руб</strong></td></tr>
        </table>
    </div>
    """
    return html


def send_email(subject: str, html_body: str):
    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((str(Header("Конфигуратор шкафов", "utf-8")), EMAIL_ADDRESS))
    msg["To"] = SEND_TO
    msg["Subject"] = Header(subject, "utf-8")

    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(EMAIL_ADDRESS, APP_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, SEND_TO, msg.as_string())


@app.post("/api/order")
async def order(request: Request):
    try:
        data = await request.json()
        name = data.get("name", "Klient")
        phone = data.get("phone", "")
        total = data.get("price", {}).get("total", "?")

        subject = f"Zayavka ot {name} ({phone}) - {total} rub"
        html = build_html(data)
        send_email(subject, html)

        return JSONResponse({"status": "ok", "message": "Письмо отправлено"})
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.get("/api/health")
async def health():
    return {"status": "ok"}