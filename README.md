# FreightFlow — Digital Freight Booking Platform

A production-ready React.js frontend for a digital freight management system.

---

## Quick Start

```bash
cd freight-app
npm install
npm start
```

App runs at **http://localhost:3000**

### Demo Login
```
Email:    demo@freightflow.com
Password: Demo@1234
```

---

## Project Structure

```
src/
├── App.js                              # Root router + protected/public route guards
├── index.js                            # React entry point
├── index.css                           # CSS custom properties (design tokens) + resets
│
├── context/
│   └── AuthContext.js                  # Auth state — login, register, logout
│
├── data/
│   └── mockData.js                     # All mock data — ports, containers, enquiries, etc.
│
├── components/
│   ├── ui/
│   │   └── index.jsx                   # Button, StatusBadge, ModeTag, PortCode, Avatar,
│   │                                   # Spinner, EmptyState, KycBanner, Dropdown
│   ├── common/
│   │   └── index.jsx                   # Field, Input, PortInput, Select, ToggleGroup,
│   │                                   # Checkbox, Radio, MultiSelect
│   └── layout/
│       ├── Navbar.jsx                  # Sticky top navbar + profile dropdown
│       └── AppLayout.jsx              # Wraps authenticated pages (Navbar + KYC banner)
│
└── pages/
    ├── auth/
    │   ├── LoginPage.jsx               # Login with validation + demo hint
    │   └── RegisterPage.jsx            # 3-step registration (Account → Company → KYC)
    ├── rate-search/
    │   └── RateSearchPage.jsx          # FCL / LCL / AIR search with correct toggles:
    │                                   #   FCL: DOOR|CY + Carrier SD + Include Nearby
    │                                   #   LCL: DOOR|CFS + Include Nearby
    │                                   #   AIR: No toggle, chargeable weight
    ├── enquiries/
    │   └── EnquiriesPage.jsx           # Sidebar filters + enquiry table
    ├── quotes/
    │   └── QuotesPage.jsx              # Sidebar filters + empty state
    ├── bookings/
    │   ├── BookingsPage.jsx            # Sidebar filters + empty state
    │   └── CreateBookingPage.jsx       # FCL: Port + Load Type
    │                                   # LCL: Port + Door + Pickup/Delivery address
    │                                   # AIR: Airport + Chargeable Weight
    └── profile/
        └── ProfilePage.jsx             # Account / KYC Status / Quote History / Settings
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No CSS frameworks** | Zero dependency overhead; pure CSS custom properties |
| **CSS custom properties** | All tokens in `index.css :root`; one-place theming |
| **Inline styles for components** | No CSS module collisions; components are self-contained |
| **Named exports everywhere** | Explicit imports; no default-export confusion |
| **React Context for auth** | Lightweight; easy to swap for Redux/Zustand later |
| **Mock data in one file** | `data/mockData.js` — replace with API calls from `services/` |

---

## Rate Search — Toggle Logic (per screenshots)

| Mode | Origin Toggle | Dest Toggle | Extra Options |
|------|--------------|-------------|---------------|
| FCL  | DOOR \| **CY** | **CY** \| DOOR | Carrier SD Services, Include Nearby |
| LCL  | DOOR \| **CFS** | **CFS** \| DOOR | Include Nearby only |
| AIR  | No toggle | No toggle | Chargeable weight input |
| LAND | Disabled | Disabled | — |

---

## Create Booking — Form Differences

| Mode | Unique Fields |
|------|--------------|
| FCL  | Origin port, Destination port, Container type, Carrier, Sailing date |
| LCL  | Origin port, Destination port, Origin door, Destination door, Pickup address, Delivery address, LCL load details |
| AIR  | Origin airport, Destination airport, Chargeable weight (KG), Carrier, Flight date |

All modes share: Cargo type, Commodity, References table, Incoterms, Tracking BL, HS Code, Requestor email.

---

## Production Build

```bash
npm run build
```

Outputs to `build/` — deploy to Vercel, Netlify, AWS S3/CloudFront.

### Vercel (recommended)
```bash
npm i -g vercel && vercel --prod
```

### Netlify
```bash
echo "/* /index.html 200" > public/_redirects
npm run build
# Drag the build/ folder to Netlify dashboard
```

---

## Connecting to Backend (Future)

Create `src/services/` and replace mock logic in context:

```js
// src/services/auth.js
export const loginAPI = (email, password) =>
  fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(r => r.json());
```

```js
// src/context/AuthContext.js — replace mock in login():
import { loginAPI } from '../services/auth';
const data = await loginAPI(email, password);
if (data.token) { setUser(data.user); }
```

## Environment Variables

```bash
# .env
REACT_APP_API_URL=http://localhost:5000/api/v1
```
