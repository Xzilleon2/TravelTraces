"""Southeast Asia geographic constraints for geocoding, routing, and map bounds."""
from __future__ import annotations

from app.core.mapping import Coordinate

SEA_COUNTRIES = (
    "Philippines",
    "Indonesia",
    "Malaysia",
    "Singapore",
    "Thailand",
    "Vietnam",
    "Cambodia",
    "Laos",
    "Myanmar",
    "Brunei",
    "Timor-Leste",
)

# Approximate bounding box covering Southeast Asia (lat/lon).
SEA_BOUNDS = {
    "min_lat": -11.0,
    "max_lat": 28.5,
    "min_lon": 92.0,
    "max_lon": 141.5,
}

SEA_CENTER = Coordinate(lat=6.5, lon=115.0)

DEFAULT_REGION_HINT = "Southeast Asia"


def is_in_sea_bounds(coordinate: Coordinate) -> bool:
    return (
        SEA_BOUNDS["min_lat"] <= coordinate.lat <= SEA_BOUNDS["max_lat"]
        and SEA_BOUNDS["min_lon"] <= coordinate.lon <= SEA_BOUNDS["max_lon"]
    )


def label_in_sea_region(label: str) -> bool:
    lowered = (label or "").lower()
    return any(country.lower() in lowered for country in SEA_COUNTRIES)
