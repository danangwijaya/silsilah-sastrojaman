<div align="center">
  <br />
  <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" alt="Quasar Logo" width="120" />
  <h1>Interactive Family Tree (Silsilah Sastrojaman)</h1>
  <p><strong>A Premium, Dynamic, and Mobile-First Family Tree Web Application made with Quasar Framework & Firebase</strong></p>
</div>

<br />

## 🌟 Overview
Silsilah Sastrojaman is a state-of-the-art interactive family tree web application designed to track and map complex family relationships (including spouses, siblings, and polygamy). Built with **Vue 3, Quasar Framework**, and powered by **Firebase**, this application offers an infinite-canvas interactive diagram, modern glassmorphism UI, and robust relationship management tools for the administrator.

Live Demo: [https://silsilah-sastrojaman.web.app](https://silsilah-sastrojaman.web.app) *(Admin access required for editing)*

## ✨ Key Features
- **Tree Diagram Engine**: Intelligent layout mapping with dynamic branch routing that perfectly handles complicated parent-child routing and multiple spouses (avoiding intersecting spaghetti lines).
- **Responsive & Mobile-First**: Uses custom Quasar scaling rules and floating macOS-style App Docks for seamless thumb-accessibility on standard mobile phones.
- **Premium Portrait User Cards**: Detailed member nodes boasting full-bleed avatar photos, sleek *glassmorphism* overlays, age badges, and dynamic status indicators.
- **Total Relational Control**: A dedicated Link Manager allows the administrator to add, swap, edit, or detach individual relations spanning generations instantly.
- **Root Focus Locking**: The capability to automatically pinpoint and lock onto a specified Ancestor/Leluhur Utama out of arbitrary databases, dynamically reconstructing descendants exclusively from their branch via LocalStorage pinning.
- **Interactive OpenStreetMap API**: Integration with Leaflet.js and Nominatim Geocoder API to instantly search, drop pins, and assign reverse-geocoded spatial addresses for member profiles.
- **High-Res PDF Exportation**: Generates perfectly stitched, landscape/portrait adapting lossless PDF canvases of your current tree using `html2canvas-pro` and `jspdf`.
- **Integrated Auth & FireStore**: Uses Google Provider Firebase Authentication and synchronizes the real-time node graph directly into Firestore NoSQL format. Supports manual importing of legacy `tree.json` formats too!

## 🚀 Technology Stack
- **Frontend**: [Vue 3](https://vuejs.org/) (Composition API), [Vite](https://vitejs.dev/)
- **UI Framework**: [Quasar Framework](https://quasar.dev/) (Material Icons)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore NoSQL, Auth, Hosting)
- **Map Tools**: [Leaflet.js](https://leafletjs.com/)
- **Exporting Modules**: [html2canvas-pro](https://www.npmjs.com/package/html2canvas-pro), [jspdf](https://github.com/parallax/jsPDF)

## 🛠 Installation & Local Setup
Follow these steps to spin up the local development server:

### 1. Requirements
Ensure you have the following installed on your machine:
- Node.js (v18+ recommended)
- `npm` or `yarn`

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/silsilah-sastrojaman.git

# Enter directory
cd silsilah-sastrojaman

# Install dependencies
npm install
```

### 3. Firebase Setup
Add your specific Firebase environment keys to `src/stores/treeStore.js` (or in `.env`). The app requires the following standard initialization inside your config:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "silsilah-sastrojaman.firebaseapp.com",
  projectId: "silsilah-sastrojaman",
  // ...
};
```

### 4. Running Locally
Simply spin up the Vite development server:
```bash
npm run dev
```

### 5. Deployment
To compile the site and deploy strictly to the integrated Firebase Hosting module:
```bash
npm run build
firebase deploy --only hosting
```

## 📐 Usage (Administrator mode)
1. **Login**: Click the floating "Login" button to authenticate with an authorized Google Account hooked to Firebase.
2. **Add Root**: Use the "Tambah Akar Baru" icon inside the App Dock to generate the foundational Ancestor nodes.
3. **Map Relatives**: Tap on the new card, access the Profil Jendela, and use the "Kelola Anggota" controls to stitch spouses and children accordingly.
4. **Theme Toggle**: Switch flawlessly between an illuminated Light theme or an immersive Dark theme via the bottom dock toggle button.

## 📄 License
This codebase is developed for private family documentation management, however, the interactive layout algorithms are fully open intended.


