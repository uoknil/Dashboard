from sqlalchemy import Column, Enum, Integer, String, Float, Date, DateTime, Text, func, Boolean
from .database import Base
from datetime import datetime, timezone

GENDER_CHOICES = ["male", "female", "intersex", "other", "unknown"]
INFECTION_TYPE_CHOICES = ["infection", "colonization", "unknown"]
IMMUNE_STATUS_CHOICES = ["immunocompetent", "immunocompromised", "unknown"]


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), onupdate=func.now())
    last_modified_by = Column(String, nullable=True)

    age = Column(Integer)
    gender = Column(Enum(*GENDER_CHOICES, name="gender_type"))
    medical_history = Column(Text, nullable=True)

    isolation_site = Column(String)
    date_of_isolation = Column(Date)
    city = Column(String)
    state = Column(String)
    travel_history = Column(Text, nullable=True)

    infection_type = Column(
        Enum(*INFECTION_TYPE_CHOICES, name="infection_type_enum"), nullable=False)
    immune_status = Column(
        Enum(*IMMUNE_STATUS_CHOICES, name="immune_status_enum"), nullable=True)

    hospitalized_abroad = Column(Boolean, default=False)
    hospital_name = Column(String, nullable=True)

    antifungal_therapy = Column(Boolean, default=False)
    antifungal_therapy_details = Column(Text, nullable=True)

    topical_therapy = Column(Boolean, default=False)
    topical_therapy_details = Column(Text, nullable=True)

    clade = Column(String)  # Clade I, Clade III, etc.
    clade_region = Column(String)  # South Asian, African, etc.
    # Relation to other cases (not in our db, i think. zB: "Relationship to isolates from Rhodes (RHO1-4) confirmed" )
    relation_to = Column(String, nullable=True)
    additional_info = Column(Text, nullable=True)
    origin_country = Column(String, nullable=True)

    # Resistance Data (MIC values in mg/L)
    mic_and = Column(Float, nullable=True)  # Anidulafungin
    mic_mic = Column(Float, nullable=True)  # Micafungin
    mic_cas = Column(Float, nullable=True)  # Caspofungin
    mic_flc = Column(Float, nullable=True)  # Fluconazole
    mic_pos = Column(Float, nullable=True)  # Posaconazole
    mic_vor = Column(Float, nullable=True)  # Voriconazole
    mic_5fc = Column(Float, nullable=True)  # 5-Flucytosine
    mic_amb = Column(Float, nullable=True)  # Amphotericin B
    mic_mgx = Column(Float, nullable=True)  # Manogepix


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    reporter_email = Column(String, nullable=False)

    age = Column(Integer, nullable=True)
    gender = Column(Enum(*GENDER_CHOICES, name="gender_type"), nullable=True)
    medical_history = Column(Text, nullable=True)
    isolation_site = Column(String, nullable=True)
    date_of_isolation = Column(Date, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    travel_history = Column(Text, nullable=True)
    clade = Column(String, nullable=True)
    clade_region = Column(String, nullable=True)
    relation_to = Column(String, nullable=True)

    infection_type = Column(
        Enum(*INFECTION_TYPE_CHOICES, name="infection_type_enum"), nullable=False)
    immune_status = Column(
        Enum(*IMMUNE_STATUS_CHOICES, name="immune_status_enum"), nullable=True)

    hospitalized_abroad = Column(Boolean, default=False)
    hospital_name = Column(String, nullable=True)

    antifungal_therapy = Column(Boolean, default=False)
    antifungal_therapy_details = Column(Text, nullable=True)

    topical_therapy = Column(Boolean, default=False)
    topical_therapy_details = Column(Text, nullable=True)
    additional_info = Column(Text, nullable=True)
    origin_country = Column(String, nullable=True)

    mic_and = Column(Float, nullable=True)
    mic_mic = Column(Float, nullable=True)
    mic_cas = Column(Float, nullable=True)
    mic_flc = Column(Float, nullable=True)
    mic_pos = Column(Float, nullable=True)
    mic_vor = Column(Float, nullable=True)
    mic_5fc = Column(Float, nullable=True)
    mic_amb = Column(Float, nullable=True)
    mic_mgx = Column(Float, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
