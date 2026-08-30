#!/usr/bin/env python3
"""Extract docs/Family_Itinerary...xlsx into a schema-shaped Itinerary document.

Source of truth: docs/Family_Itinerary_Detailed_With_Dining_MomSchedule_Sep10-19_2026.xlsx
Reads the "Normalized Import", "Dining Guide" and "Grocery Plan" sheets and emits
server/scripts/family.itinerary.json — a single Itinerary doc (one proposal, 10
days of Activity[] blocks) conforming to packages/shared/src/types.ts.

Re-run whenever the xlsx changes:  python3 server/scripts/extract-family.py
Then reseed:                        npm run seed --prefix server
"""
import json, re, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
XLSX = ROOT / "docs" / "Family_Itinerary_Detailed_With_Dining_MomSchedule_Sep10-19_2026.xlsx"
OUT = Path(__file__).resolve().parent / "family.itinerary.json"

A = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
HOME = "Avida Towers Verte"
HOME_LAT, HOME_LNG = 14.55522, 121.05302

# ---- xlsx reading (zero-dep) --------------------------------------------------
def read_sheets(path):
    z = zipfile.ZipFile(path)
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    relmap = {r.get("Id"): r.get("Target") for r in rels}
    sst = []
    try:
        sx = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in sx:
            sst.append("".join(t.text or "" for t in si.iter(f"{{{A}}}t")))
    except KeyError:
        pass

    def norm(t):
        t = t.lstrip("/")
        return t if t.startswith("xl/") else "xl/" + t

    def colnum(ref):
        c = re.match(r"([A-Z]+)", ref).group(1)
        n = 0
        for ch in c:
            n = n * 26 + (ord(ch) - 64)
        return n

    out = {}
    for s in wb.iter(f"{{{A}}}sheet"):
        name = s.get("name")
        ws = ET.fromstring(z.read(norm(relmap[s.get(f"{{{R}}}id")])))
        rows = {}
        for c in ws.iter(f"{{{A}}}c"):
            ref = c.get("r")
            if not ref:
                continue
            row = int(re.match(r"[A-Z]+(\d+)", ref).group(1))
            t = c.get("t")
            v = c.find(f"{{{A}}}v")
            isv = c.find(f"{{{A}}}is")
            val = ""
            if t == "s" and v is not None:
                val = sst[int(v.text)]
            elif t == "inlineStr" and isv is not None:
                val = "".join(x.text or "" for x in isv.iter(f"{{{A}}}t"))
            elif v is not None:
                val = v.text
            rows.setdefault(row, {})[colnum(ref)] = (val or "").strip()
        table = []
        for r in sorted(rows):
            maxc = max(rows[r]) if rows[r] else 0
            table.append([rows[r].get(i, "") for i in range(1, maxc + 1)])
        out[name] = table
    return out

def dicts(table):
    header = table[0]
    return [{header[i]: (r[i] if i < len(r) else "") for i in range(len(header))} for r in table[1:]]

# ---- helpers ------------------------------------------------------------------
def maps_url(lat, lng):
    return f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"

def parse_coords(link):
    m = re.search(r"query=(-?\d+\.\d+),(-?\d+\.\d+)", link or "")
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)

def iso_date(label):  # "Sep 10, 2026" -> "2026-09-10"
    months = {m: i + 1 for i, m in enumerate(
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}
    m = re.match(r"(\w{3}) (\d+), (\d+)", label)
    return f"{m.group(3)}-{months[m.group(1)]:02d}-{int(m.group(2)):02d}"

def short_label(label):  # "Sep 10, 2026" -> "Thu, Sep 10"
    import datetime
    d = datetime.date.fromisoformat(iso_date(label))
    return f"{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d.weekday()]}, {label.split(',')[0]}"

def as_int(s):
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return 0

# Curated per-day theme + one-line plan (10 fixed days).
DAY_META = {
    "2026-09-10": ("Arrival Night", "Land at NAIA, GrabCar home to Avida Verte, easy downstairs dinner and early sleep."),
    "2026-09-11": ("Settle-in + Mom WFH", "Mom's protected morning work block, first grocery run, condo swim, cook-at-home dinner."),
    "2026-09-12": ("BGC Walk + Mind Museum", "Early park-hop to Bonifacio High St breakfast, recovery nap, then The Mind Museum and Manam dinner."),
    "2026-09-13": ("Manila Ocean Park", "Weekend outing to Manila Ocean Park in two blocks around the toddler nap, ramen dinner downstairs."),
    "2026-09-14": ("Mom WFH + ActiveFun", "Focused WFH morning while Sister leads ActiveFun BGC; light family afternoon after Ocean Park."),
    "2026-09-15": ("Mom WFH + Fully Booked", "Protected work morning, condo swim, quiet Fully Booked BHS outing after nap, cook-at-home dinner."),
    "2026-09-16": ("Mom WFH + Grocery Restock", "Work morning, creative play, then a mid-stay Market! Market! restock Mom joins after 2 PM."),
    "2026-09-17": ("Mom WFH + Market! Market!", "Work morning, home reading, Market! Market! browse with Mann Hann merienda, light dinner home."),
    "2026-09-18": ("Mom WFH + Packing", "Final work morning, packing with an optional Uptown browse, farewell dinner at Italianni's."),
    "2026-09-19": ("Departure Day", "Final BGC walk and Wildflour breakfast, finish packing, nap, then GrabCar to NAIA for the evening flight."),
}
TRAVEL_CATS = {"Travel", "Airport", "Travel Prep"}

# ---- build --------------------------------------------------------------------
sheets = read_sheets(XLSX)
rows = dicts(sheets["Normalized Import"])

days_by_date = {}
for r in rows:
    days_by_date.setdefault(r["Date"], []).append(r)

places = {}   # where -> Place (only venues with real coords)
days = []
seq = 0
grand_total = 0
travel_total = 0

for date_label, drows in days_by_date.items():
    date = iso_date(date_label)
    activities = []
    day_travel = 0
    day_other = 0
    marquee = None       # (cost, where, lat, lng) for a non-home outing
    has_grab = False
    for r in drows:
        seq += 1
        lat, lng = parse_coords(r["Google Maps Link"])
        cost = as_int(r["Est. Cost (₱)"])
        cat = r["Category"]
        act = {
            "id": f"fam-{date}-{seq:03d}",
            "time": r["Time"],
            "activity": r["Activity"],
            "where": r["Where"],
        }
        if r["Reasoning"]:            act["reasoning"] = r["Reasoning"]
        if r["Google Maps Link"]:     act["mapsUrl"] = r["Google Maps Link"]
        if lat is not None:           act["lat"], act["lng"] = lat, lng
        if r["Participants"]:         act["participants"] = r["Participants"]
        if cat:                       act["category"] = cat
        if r["Meal / Menu Suggestion"]: act["mealSuggestion"] = r["Meal / Menu Suggestion"]
        if r["Mom Status"]:           act["momStatus"] = r["Mom Status"]
        if r["Dad Status"]:           act["dadStatus"] = r["Dad Status"]
        if r["Rest / Nap"]:           act["restNap"] = r["Rest / Nap"]
        if cost:                      act["cost"] = cost
        act["optional"] = r["Optional?"].strip().lower() == "yes"
        activities.append(act)

        if cat in TRAVEL_CATS:
            day_travel += cost
        else:
            day_other += cost
        if "grab" in r["Activity"].lower() or cat == "Travel":
            has_grab = True

        # place catalog (only real coords, skip home + airport)
        where = r["Where"]
        if lat is not None and where not in (HOME,) and where != "NAIA":
            if where not in places:
                area = "BGC / Taguig" if lng > 121.0 else "Manila"
                places[where] = {
                    "name": where, "area": area, "lat": lat, "lng": lng,
                    "coordinates": f"{lat}, {lng}", "googleMapsUrl": maps_url(lat, lng),
                    "why": r["Reasoning"] or "Stop on the family itinerary",
                }
            if where != HOME and cost >= (marquee[0] if marquee else 1):
                marquee = (cost, where, lat, lng)

    grand_total += day_travel + day_other
    travel_total += day_travel

    theme, plan = DAY_META[date]
    times = [a["time"] for a in activities]

    def meridiem(t):
        m = re.search(r"([AP]M)", t)
        return m.group(1) if m else ""

    def start_of(t):
        first = t.split("–")[0].replace(" onward", "").strip()
        if not re.search(r"[AP]M", first) and meridiem(t):  # borrow AM/PM from the range end
            first = f"{first} {meridiem(t)}"
        return first

    def end_of(t):
        parts = t.split("–")
        return (parts[1].strip() if len(parts) > 1 else parts[0]).replace(" onward", "").strip()

    time_window = f"{start_of(times[0])}–{end_of(times[-1])}"

    if marquee:
        dest, dlat, dlng = marquee[1], marquee[2], marquee[3]
    else:
        dest, dlat, dlng = f"{HOME} (home)", HOME_LAT, HOME_LNG

    day = {
        "id": f"fam-{date}",
        "date": date,
        "dateLabel": short_label(date_label),
        "theme": theme,
        "timeWindow": time_window,
        "comingFrom": HOME,
        "destination": dest,
        "detailedPlan": plan,
        "travelMode": "Walk / Grab" if has_grab else "Walk",
        "cost": {"travel": day_travel, "foodLow": day_other, "foodHigh": day_other},
        "notes": f"{len(activities)} scheduled blocks.",
        "location": {"mapAnchor": dest, "lat": dlat, "lng": dlng, "googleMapsUrl": maps_url(dlat, dlng)},
        "activities": activities,
    }
    days.append(day)

# Dining guide
dining = []
for r in dicts(sheets["Dining Guide"]):
    if not r.get("Restaurant"):
        continue
    dining.append({k: v for k, v in {
        "restaurant": r["Restaurant"],
        "whenWho": r.get("When / Who", ""),
        "recommendedOrder": r.get("Recommended Family Order", ""),
        "budget": r.get("Rough Budget", ""),
        "why": r.get("Why", ""),
        "mapsUrl": r.get("Google Maps", ""),
        "menuSource": r.get("Menu / Source", ""),
        "notes": r.get("Notes", ""),
    }.items() if v})

# Grocery plan
grocery = []
for r in dicts(sheets["Grocery Plan"]):
    if not r.get("When"):
        continue
    grocery.append({k: v for k, v in {
        "when": r["When"], "store": r.get("Store", ""), "who": r.get("Who", ""),
        "purpose": r.get("Purpose", ""), "basket": r.get("Suggested Basket", ""),
        "budget": r.get("Budget", ""), "why": r.get("Why", ""),
    }.items() if v})

itinerary = {
    "id": "family-bgc-2026",
    "title": "Family BGC Itinerary — Mom's Work Trip",
    "subtitle": "September 10 – 19, 2026",
    "dateRange": {"start": days[0]["date"], "end": days[-1]["date"]},
    "partySize": 6,
    "currency": "PHP",
    "homeBase": "Avida Towers Verte, BGC, Taguig",
    "kind": "family",
    "assumptions": [
        {"label": "Home Base", "value": "Avida Towers Verte, BGC, Taguig"},
        {"label": "Party", "value": "2 adults + Sister + 3 girls (incl. a toddler)"},
        {"label": "Mom's Work", "value": "Focused WFH weekday mornings 8–11 AM; joins family after"},
        {"label": "Dad's Work", "value": "Working weekdays; optional / READY to join, never required"},
        {"label": "Rhythm", "value": "Toddler nap protected 11:30 AM–1:30 PM; early nights"},
    ],
    "disclaimer": "All prices are planning estimates in PHP, not live quotes. Grab fares, restaurant "
                  "bills and attraction schedules vary. Confirm hours and reservations before each outing.",
    "proposals": [{
        "id": "family-plan",
        "name": "Family Plan — Sep 10–19",
        "shortName": "Family Plan",
        "style": "Work-aware family week",
        "bestFor": "A working parent balancing focused WFH with young kids on a BGC home base",
        "fullDayFocus": "Weekend outings (Mind Museum, Manila Ocean Park) on full-energy days",
        "weekdayRule": "Weekdays stay close to home around Mom's morning work block and the toddler nap",
        "estTotal": {"low": grand_total, "high": grand_total},
        "travelTotal": travel_total,
        "days": days,
    }],
    "places": list(places.values()),
    "diningGuide": dining,
    "groceryPlan": grocery,
    "createdAt": "2026-08-29T00:00:00.000Z",
    "updatedAt": "2026-08-29T00:00:00.000Z",
}

OUT.write_text(json.dumps(itinerary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {OUT}")
print(f"  days: {len(days)}  activities: {seq}  places: {len(places)}  dining: {len(dining)}  grocery: {len(grocery)}")
print(f"  grand total: ₱{grand_total:,}  travel total: ₱{travel_total:,}")
