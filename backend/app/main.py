import os
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from . import models, schemas
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Candida Auris Dashboard API")


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

submitted_cases = []


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "C. auris API is running"}


@app.get("/api/cases")
def get_all_cases(db: Session = Depends(get_db)):
    cases = db.query(models.Case).order_by(models.Case.id).all()
    return cases


@app.get("/api/stats/by-state")
def get_stats_by_state(db: Session = Depends(get_db)):
    results = db.query(models.Case.state, func.count(
        models.Case.id)).group_by(models.Case.state).all()
    # Format: {"Vienna": 10, "Styria": 1, ...}
    return {state: count for state, count in results}


@app.get("/api/stats/by-site")
def get_stats_by_site(db: Session = Depends(get_db)):
    results = db.query(models.Case.isolation_site, func.count(
        models.Case.id)).group_by(models.Case.isolation_site).all()
    return {site: count for site, count in results}


@app.get("/api/stats/by-clade")
def get_stats_by_clade(db: Session = Depends(get_db)):
    results = db.query(models.Case.clade, func.count(
        models.Case.id)).group_by(models.Case.clade).all()
    return {clade: count for clade, count in results}


# Returns the number of cases reported each year, e.g., {"2023": 2, "2024": 6, ...}
@app.get("/api/stats/by-year")
def get_timeline(db: Session = Depends(get_db)):
    results = db.query(
        func.extract('year', models.Case.date_of_isolation).label('year'),
        func.count(models.Case.id)
    ).group_by('year').order_by('year').all()

    return {int(year): count for year, count in results}


# returs the date of the most recently added case report
@app.get("/api/meta/last-updated")
def get_last_updated(db: Session = Depends(get_db)):
    last_entry = db.query(func.max(models.Case.created_at)).scalar()
    return {"last_updated": last_entry.date() if last_entry else None}


@app.post("/api/report-case")
async def submit_case(report: schemas.CaseReport, background_tasks: BackgroundTasks):
    report_dict = report.model_dump()
    submitted_cases.append(report_dict)

    # Dynamically build a list of all fields for the email
    details_html = "".join([f"<li><b>{k.replace('_', ' ').title()}:</b> {v}</li>"
                            for k, v in report_dict.items() if v is not None])

    html = f"""
    <h3>New Candida auris Case Reported</h3>
    <ul>{details_html}</ul>
    <hr>
    <p><i>Check the admin dashboard to approve this submission.</i></p>
    """

    message = MessageSchema(
        subject=f"New Case Submission: {report.city}",
        recipients=[os.getenv("MAIL_FROM")],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message, message)

    return {
        "status": "success",
        "submission_index": len(submitted_cases) - 1
    }


@app.get("/api/submissions")
async def get_submissions():
    return submitted_cases
