# CAMPUS-IQ Timetable Frontend

This package replaces the existing `src/pages/Timetable/Timetable.jsx` with a frontend that uses the timetable backend supplied by the team.

## Backend API used

The component expects these endpoints under `${VITE_API_URL}/timetable`:

- GET `/period-slots`
- POST `/period-slots`
- PUT `/period-slots/:id`
- DELETE `/period-slots/:id`
- POST `/period-slots/seed`
- POST `/`
- GET `/class?classId=...&sectionId=...&academicYearId=...`
- GET `/teacher?staffId=...&academicYearId=...`
- PUT `/:id`
- DELETE `/:id`

The uploaded backend routes/controller/service confirm these endpoints and that they require a Bearer JWT.

## Installation

1. Copy `Timetable.jsx` to:
   `frontend/src/pages/Timetable/Timetable.jsx`
2. If your project already has a `Timetable.jsx`, replace it after backing up the old version.
3. The component uses the existing project's `Card`, `Button`, and `Input` components and `lucide-react`; no new UI dependency is required.
4. Set the frontend API URL if your project does not proxy `/api`:

```env
VITE_API_URL=http://localhost:YOUR_BACKEND_PORT/api
```

If the backend is mounted as `/api/v1`, use:

```env
VITE_API_URL=http://localhost:YOUR_BACKEND_PORT/api/v1
```

5. Make sure the user's JWT is stored in localStorage. The component checks `token`, `accessToken`, `authToken`, `jwt`, and `campusIQToken`.

## Important project-specific note

The supplied timetable backend only provides IDs for class, section, subject, staff and academic year; it does not provide lookup endpoints for those entities in the uploaded timetable files. Therefore the Add Entry form intentionally accepts those IDs rather than inventing names or making unsupported API calls.

The backend itself prevents teacher/class double-booking and rejects assignments to recess/lunch slots.

## Run

Backend:

```bat
cd backend
npm run dev
```

Frontend:

```bat
cd frontend
npm run dev
```

Then open the Vite URL shown in the terminal.

## Git

After testing:

```bat
git status
git add frontend/src/pages/Timetable/Timetable.jsx
git commit -m "feat: integrate timetable frontend"
git push origin <your-branch>
```

Recommended team workflow: push a feature branch and open a PR instead of pushing directly to `main`.
