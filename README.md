# VisionLens AI — Color Blindness Simulator & Accessibility Auditor

VisionLens AI is a premium, accessibility-focused web application designed to help developers, designers, and digital accessibility experts audit, simulate, and optimize graphics for various forms of color vision deficiency (CVD).

Featuring real-time, mathematically accurate LMS color space simulation matrices via high-performance HTML5 Canvas pixel manipulation, VisionLens AI provides diagnostic toolsets resembling commercial editors like Figma Inspect, Adobe Photoshop, and Apple Photos.

---

## 🎯 Key Features

* **Multi-Deficiency Simulation**: Real-time analysis of Normal Vision, Protanopia (Red-Blind), Deuteranopia (Green-Blind), Tritanopia (Blue-Blind), and Achromatopsia (Total Color Blindness).
* **Flexible Viewports**: Single inspect view, side-by-side comparative views, 2x2 audits grid, and an interactive wipe-slider split viewport.
* **Pixel Loupe & Magnifier**: Real-time cursor magnifying lens with rgb and hex color code sampling.
* **Loss Heatmap**: Highlights parts of the image that lose major detail or contrast when desaturated or deshifted.
* **WCAG 2.1 Audit & PDF Export**: Dynamically compiles dominant color palettes, identifies color blindness confusion points, checks WCAG AA/AAA typography compliance, and generates print-ready PDF audit reports.
* **Zero Backend Overhead**: Built completely client-side in React 18, TypeScript, and Tailwind CSS.

---

## 🔬 Accessibility Background & Algorithms Used

Color vision deficiency arises from mutations or absences in the retinal photopigments (cones):
1. **L-cones** (Long wavelength/Red): Defect causes **Protanopia** or Protanomaly.
2. **M-cones** (Medium wavelength/Green): Defect causes **Deuteranopia** or Deuteranomaly.
3. **S-cones** (Short wavelength/Blue): Defect causes **Tritanopia** or Tritanomaly.

### Linear RGB Simulation Matrix

VisionLens AI processes images in the **Linear RGB color space** to ensure physical accuracy of light mixing. The sRGB input pixels are first linearized (gamma de-corrected), multiplied against normalized LMS reduction projections (Viénot, Brettel & Mollon models), and then re-compressed using sRGB gamma correction before rendering:

#### Protanopia (L-Cone Deficiency) Matrix:
$$
\begin{bmatrix} R' \\ G' \\ B' \end{bmatrix} = 
\begin{bmatrix} 
0.567 & 0.433 & 0.000 \\ 
0.558 & 0.442 & 0.000 \\ 
0.000 & 0.242 & 0.758 
\end{bmatrix}
\begin{bmatrix} R \\ G \\ B \end{bmatrix}
$$

#### Deuteranopia (M-Cone Deficiency) Matrix:
$$
\begin{bmatrix} R' \\ G' \\ B' \end{bmatrix} = 
\begin{bmatrix} 
0.625 & 0.375 & 0.000 \\ 
0.700 & 0.300 & 0.000 \\ 
0.000 & 0.300 & 0.700 
\end{bmatrix}
\begin{bmatrix} R \\ G \\ B \end{bmatrix}
$$

---

## 📂 Folder Structure

```
C:\Vscode\COSC\ColorBlindness\
├── .github/                  # CI/CD Workflows
├── public/                   # Static assets
└── src/
    ├── components/           # Modular visual components
    │   ├── AccessibilityReport.tsx
    │   ├── ImageUploader.tsx
    │   ├── ImageWorkspace.tsx
    │   ├── ViewModeSelector.tsx
    │   ├── VisionSelector.tsx
    │   └── VisualTools.tsx
    ├── types/                # TypeScript Interfaces
    │   └── index.ts
    ├── utils/                # CVD Simulations, Math, & Exporters
    │   ├── colorUtils.ts
    │   ├── imageProcessor.ts
    │   └── pdfGenerator.ts
    ├── App.tsx               # Main layout coordinator
    ├── index.css             # Tailwind rules & global variables
    └── main.tsx              # React mounting root
```

---

## ⚙️ Installation & Usage

1. **Clone & Enter directory**:
   ```bash
   cd ColorBlindness
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🚀 Deployment

VisionLens AI is configured for simple static hosting.
To deploy to GitHub Pages:
1. Ensure the `base` path in `vite.config.ts` matches your repository name (e.g. `/repository-name/`).
2. Build and push the static outputs from the `dist/` directory.

---

## 📽️ Demo Placeholders
* **Screenshots**: `[Placeholder: Add screenshot of main dashboard grid layout view]`
* **Walkthrough Video**: `[Placeholder: Add link to visual demo showing loupe picker and heatmap toggle]`

---

## 🔮 Future Improvements
* **Severity Sliders**: Allow users to adjust simulation severity from 0% (mild anomaly) to 100% (complete anopia).
* **Figma Plugin Integration**: Expose the audit matrix directly inside design editors via canvas manifest extensions.
