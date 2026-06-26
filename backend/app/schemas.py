from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional, Literal
from datetime import date

GenderType = Literal["male", "female", "intersex", "other", "unknown"]
InfectionType = Literal["infection", "colonization", "unknown"]
ImmuneStatus = Literal["immunocompetent", "immunocompromised", "unknown"]


class CaseReport(BaseModel):

    reporter_email: EmailStr

    age: Optional[int] = Field(None, ge=0, lt=120)
    gender: GenderType
    # reason for visit, i guess? or maybe "comorbidities" or "underlying conditions"?
    medical_history: str = Field(..., min_length=1)

    isolation_site: str = Field(..., min_length=1)
    date_of_isolation: date
    city: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)

    hospitalized_abroad: Optional[bool] = None
    hospital_name: Optional[str] = None
    travel_history: str = Field(..., min_length=1)
    relation_to: Optional[str] = None

    infection_type: InfectionType
    immune_status: Optional[ImmuneStatus] = None

    antifungal_therapy: Optional[bool] = None
    antifungal_therapy_details: Optional[str] = None

    topical_therapy: Optional[bool] = None
    topical_therapy_details: Optional[str] = None

    additional_info: Optional[str] = None

    # e.g., CLade I, Clade II, Clade III, Clade IV, etc.
    # clade: Optional[str] = None
    # e.g., "South Asian", "African" "South American", etc.
    # clade_region: Optional[str] = "Unknown" # i am not sure we should have this fiels in the formular.

    mic_and: Optional[float] = Field(None, ge=0)  # Anidulafungin
    mic_mic: Optional[float] = Field(None, ge=0)  # Micafungin
    mic_flc: Optional[float] = Field(None, ge=0)  # Fluconazole
    mic_cas: Optional[float] = Field(None, ge=0)  # Caspofungin
    mic_pos: Optional[float] = Field(None, ge=0)  # Posaconazole
    mic_vor: Optional[float] = Field(None, ge=0)  # Voriconazole
    mic_5fc: Optional[float] = Field(None, ge=0)  # 5-Flucytosine
    mic_amb: Optional[float] = Field(None, ge=0)  # Amphotericin B
    mic_mgx: Optional[float] = Field(None, ge=0)  # Manogepix

    captcha_token: Optional[str] = None

    @model_validator(mode="after")
    def check_conditional_details(self) -> "CaseReport":
        if self.hospitalized_abroad and not (self.hospital_name and self.hospital_name.strip()):
            raise ValueError(
                "Hospital name is required if hospitalized abroad is true.")

        if self.antifungal_therapy and not (self.antifungal_therapy_details and self.antifungal_therapy_details.strip()):
            raise ValueError(
                "Antifungal therapy details are required if antifungal therapy is true.")

        if self.topical_therapy and not (self.topical_therapy_details and self.topical_therapy_details.strip()):
            raise ValueError(
                "Topical therapy details are required if topical therapy is true.")

        return self

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    is_active: bool

    class Config:
        from_attributes = True


class CaseUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[GenderType] = None
    medical_history: Optional[str] = None
    isolation_site: Optional[str] = None
    date_of_isolation: Optional[date] = None
    city: Optional[str] = None
    state: Optional[str] = None
    clade: Optional[str] = None
    clade_region: Optional[str] = None
    hospitalized_abroad: Optional[bool] = None
    hospital_name: Optional[str] = None
    travel_history: Optional[str] = None
    relation_to: Optional[str] = None

    infection_type: Optional[InfectionType] = None
    immune_status: Optional[ImmuneStatus] = None

    antifungal_therapy: Optional[bool] = None
    antifungal_therapy_details: Optional[str] = None

    topical_therapy: Optional[bool] = None
    topical_therapy_details: Optional[str] = None
    additional_info: Optional[str] = None
    origin_country: Optional[str] = None

    mic_and: Optional[float] = None
    mic_mic: Optional[float] = None
    mic_cas: Optional[float] = None
    mic_flc: Optional[float] = None
    mic_pos: Optional[float] = None
    mic_vor: Optional[float] = None
    mic_5fc: Optional[float] = None
    mic_amb: Optional[float] = None
    mic_mgx: Optional[float] = None


class SubmissionUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[GenderType] = None
    medical_history: Optional[str] = None
    isolation_site: Optional[str] = None
    date_of_isolation: Optional[date] = None
    city: Optional[str] = None
    state: Optional[str] = None
    clade: Optional[str] = None
    clade_region: Optional[str] = None
    hospitalized_abroad: Optional[bool] = None
    hospital_name: Optional[str] = None
    travel_history: Optional[str] = None
    relation_to: Optional[str] = None

    infection_type: Optional[InfectionType] = None
    immune_status: Optional[ImmuneStatus] = None

    antifungal_therapy: Optional[bool] = None
    antifungal_therapy_details: Optional[str] = None

    topical_therapy: Optional[bool] = None
    topical_therapy_details: Optional[str] = None
    additional_info: Optional[str] = None
    origin_country: Optional[str] = None

    mic_and: Optional[float] = None
    mic_mic: Optional[float] = None
    mic_cas: Optional[float] = None
    mic_flc: Optional[float] = None
    mic_pos: Optional[float] = None
    mic_vor: Optional[float] = None
    mic_5fc: Optional[float] = None
    mic_amb: Optional[float] = None
    mic_mgx: Optional[float] = None

    class Config:
        from_attributes = True

# for staging
# Add to the bottom of app/schemas.py


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class UserToggle(BaseModel):
    is_active: bool


class PasswordResetRequest(BaseModel):
    username: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
