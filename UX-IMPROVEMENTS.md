# ALL INDIA DRIVER APP — UX Improvements

This update focuses on making the Vercel app flow easier to understand without removing the existing Driver, Vehicle Owner, Mechanic, SOS, AI assistant, chat, donation, or profile features.

## What changed

- Removed the extra app-wide navigation bar that was appearing above role dashboards and competing with their own navigation.
- Kept clear local navigation within each flow, including a main-website link from the dashboard brand area.
- Made dashboard tabs role-specific:
  - Driver: Dashboard, Kाफिला, नौकरी खोजें, मेरी प्रोफाइल, सेटिंग्स.
  - Vehicle Owner: Dashboard, काफिला, ड्राइवर खोजें, मेरी प्रोफाइल, सेटिंग्स.
  - Mechanic: नई रिक्वेस्ट, सभी रिक्वेस्ट, मेरी प्रोफाइल, सेटिंग्स.
- Removed the Mechanic “काफिला” tab because that screen did not have any content.
- Added a short title and explanation under dashboard navigation so users know what the current page is for.
- Kept AI सहायता, SOS where relevant, Theme, and Role Switch in the dashboard header; moved Share and Support into the Profile area so the mobile header stays uncluttered.
- Clarified the next step after role selection and corrected the message about switching roles later.
- Added step guidance to Driver and Vehicle Owner profile setup screens.

## Build / deployment

The GitHub Pages `docs/` folder has not been modified. The app source changes are in `src/`.

For Vercel, the existing `vercel.json` already uses `npm run build` and outputs `dist/`. Install dependencies and deploy the project as usual. Do not upload `node_modules`, `.git`, `.vercel`, or private `.env` files.
