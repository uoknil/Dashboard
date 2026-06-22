import os
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base, get_db
from . import models, schemas
import urllib.request
import urllib.parse
import json
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from fastapi.security import OAuth2PasswordRequestForm
from . import auth
from .utils import get_region_from_clade

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Candida Auris Dashboard API")


origins = [
    "http://localhost:5173",
    # "https://remarkable-rejoicing-production-598d.up.railway.app/",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    # "https://dashboard-production-92a8.up.railway.app/",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=origins,
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


@app.get("/")
def home():
    return {"message": "C. auris API is running"}


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

    secret_key = os.getenv("RECAPTCHA_SECRET_KEY")
    verify_url = "https://www.google.com/recaptcha/api/siteverify"

    # Construct payload for Google API
    payload = urllib.parse.urlencode({
        "secret": secret_key,
        "response": report.captcha_token
    }).encode("utf-8")

    try:
        req = urllib.request.Request(verify_url, data=payload, method="POST")
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))

        # If Google evaluation says false, deny access immediately
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=f"Sicherheitsüberprüfung fehlgeschlagen: {result.get('error-codes', ['invalid-input-response'])}"
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail="reCAPTCHA Server-Verifikationsfehler.")

    # DATABASE PROCESSING
    report_dict = report.model_dump()
    report_dict.pop("captcha_token", None)

    new_submission = models.Submission(**report_dict)
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

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


@app.get("/api/admin/cases")
def get_all_cases(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    cases = db.query(models.Case).order_by(models.Case.id).all()
    return cases


@app.get("/api/admin/submissions")
def get_submissions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Submission).order_by(models.Submission.submitted_at.desc()).all()


@app.post("/api/admin/approve-submission/{submission_id}")
def approve_submission(submission_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    try:
        automated_region = get_region_from_clade(submission.clade)

        new_case = models.Case(
            age=submission.age,
            gender=submission.gender,
            medical_history=submission.medical_history,
            isolation_site=submission.isolation_site,
            date_of_isolation=submission.date_of_isolation,
            city=submission.city,
            state=submission.state,
            clade=submission.clade,
            clade_region=automated_region,
            travel_history=submission.travel_history,
            relation_to=submission.relation_to,
            hospitalized_abroad=submission.hospitalized_abroad,
            hospital_name=submission.hospital_name,
            infection_type=submission.infection_type,
            immune_status=submission.immune_status,
            antifungal_therapy=submission.antifungal_therapy,
            antifungal_therapy_details=submission.antifungal_therapy_details,
            topical_therapy=submission.topical_therapy,
            topical_therapy_details=submission.topical_therapy_details,
            additional_info=submission.additional_info,
            # for world map visualization
            origin_country=submission.origin_country,

            mic_and=submission.mic_and,
            mic_mic=submission.mic_mic,
            mic_cas=submission.mic_cas,
            mic_flc=submission.mic_flc,
            mic_pos=submission.mic_pos,
            mic_vor=submission.mic_vor,
            mic_5fc=submission.mic_5fc,
            mic_amb=submission.mic_amb,
            mic_mgx=submission.mic_mgx,

        )

        db.add(new_case)
        db.delete(submission)
        db.commit()
        db.refresh(new_case)

        return {
            "message": "Submission moved to database successfully",
            "db_id": new_case.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Approval failed: {str(e)}")


@app.delete("/api/admin/submissions/{submission_id}")
def reject_submission(submission_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    db.delete(submission)
    db.commit()
    return {"message": "Submission rejected and deleted"}


@app.post("/api/auth/login", response_model=schemas.Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(
        models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )

    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.patch("/api/admin/cases/{case_id}")
def update_case(
    case_id: int,
    obj_in: schemas.CaseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Only fields provided in request
    update_data = obj_in.model_dump(exclude_unset=True)

    # Logic for Clade Region Automation
    if "clade" in update_data:
        update_data["clade_region"] = get_region_from_clade(
            update_data["clade"])

    for field in update_data:
        setattr(case, field, update_data[field])

    case.last_modified_by = current_user.username

    db.commit()
    db.refresh(case)
    return case


@app.delete("/api/admin/cases/{case_id}")
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
    return {"message": "Case permanently deleted"}


@app.patch("/api/admin/submissions/{submission_id}")
def update_submission(
    submission_id: int,
    obj_in: schemas.SubmissionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    update_data = obj_in.model_dump(exclude_unset=True)

    # Logic for Clade Region Automation
    if "clade" in update_data:
        # If clade is provided, update region. If clade is None, region becomes "Unknown"
        update_data["clade_region"] = get_region_from_clade(
            update_data["clade"]) if update_data["clade"] else "Unknown"

    for field in update_data:
        setattr(submission, field, update_data[field])

    db.commit()
    db.refresh(submission)
    return submission

# for world map visualization


@app.get("/api/stats/by-country")
def get_stats_by_country(db: Session = Depends(get_db)):
    """
    Returns aggregated case counts grouped by country of origin.
    Example output for FE World Map: {"India": 4, "Turkey": 2}
    """
    results = db.query(
        models.Case.origin_country,
        func.count(models.Case.id)
    ).filter(models.Case.origin_country.isnot(None)).group_by(models.Case.origin_country).all()

    return {country: count for country, count in results}
