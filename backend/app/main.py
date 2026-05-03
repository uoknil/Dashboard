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
