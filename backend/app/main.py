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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "C. auris API is running"}


@app.get("/api/admin/cases")
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


# returns the date of the most recently added case report
@app.get("/api/meta/last-updated")
def get_last_updated(db: Session = Depends(get_db)):
    last_entry = db.query(func.max(models.Case.created_at)).scalar()
    return {"last_updated": last_entry.date() if last_entry else None}


@app.post("/api/report-case", status_code=201)
async def submit_case(report: schemas.CaseReport, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    report_dict = report.model_dump()

    # save the submission to the database submission table.
    new_submission = models.Submission(**report.model_dump())
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    report_dict = report.model_dump()
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
        "submission_id": new_submission.id
    }


@app.get("/api/admin/submissions")
async def get_submissions():
    return submitted_cases


@app.post("/api/admin/approve-submission/{index}")
def approve_submission(index: int, db: Session = Depends(get_db)):
    if index < 0 or index >= len(submitted_cases):
        raise HTTPException(status_code=404, detail="Submission not found")

    raw_data = submitted_cases[index]

    try:
        new_case = models.Case(
            age=raw_data['age'],
            gender=raw_data['gender'],
            medical_history=raw_data.get('medical_history'),
            isolation_site=raw_data['isolation_site'],
            date_of_isolation=raw_data['date_of_isolation'],
            city=raw_data['city'],
            state=raw_data['state'],
            clade=raw_data.get('clade'),
            clade_region=raw_data.get('clade_region'),
            travel_history=raw_data.get('travel_history'),
            relation_to=raw_data.get('relation_to'),
            mic_and=raw_data.get('mic_and'),
            mic_mic=raw_data.get('mic_mic'),
            mic_cas=raw_data.get('mic_cas'),
            mic_flc=raw_data.get('mic_flc'),
            mic_pos=raw_data.get('mic_pos'),
            mic_vor=raw_data.get('mic_vor'),
            mic_5fc=raw_data.get('mic_5fc'),
            mic_amb=raw_data.get('mic_amb'),
            mic_mgx=raw_data.get('mic_mgx')

        )

        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        # Remove from the temporary list
        submitted_cases.pop(index)

        return {
            "message": "Submission moved to database successfully",
            "db_id": new_case.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Approval failed: {str(e)}")
