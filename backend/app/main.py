from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from . import models

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
    cases = db.query(models.Case).all()
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
