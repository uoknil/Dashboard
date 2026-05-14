CLADE_MAP = {
    "Clade I": "South Asian",
    "Clade II": "East Asian",
    "Clade III": "African",
    "Clade IV": "South American",
    "Clade V": "Iranian"
}


def get_region_from_clade(clade_name: str) -> str:
    return CLADE_MAP.get(clade_name, "Unknown")
