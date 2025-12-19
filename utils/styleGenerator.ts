
// Deterministic random number generator (Mulberry32)
// This ensures that the same code always produces the same random sequence.
const mulberry32 = (a: number) => {
    return () => {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Pick exactly one random item from an array and assign a descriptive weight
const pickOneWithWeight = (arr: string[], rand: () => number): string => {
    if (arr.length === 0) return "";
    
    // Pick Item
    const item = arr[Math.floor(rand() * arr.length)];
    
    // Generate Weight (0.0 to 1.0)
    const weight = rand();
    
    let prefix = "";
    if (weight < 0.2) {
        prefix = "Faint hint of ";
    } else if (weight < 0.4) {
        prefix = "Subtle ";
    } else if (weight < 0.6) {
        prefix = ""; // Standard application
    } else if (weight < 0.8) {
        prefix = "Strong ";
    } else {
        prefix = "Intense ";
    }
    
    return `${prefix}${item}`;
};

// Abstracted aesthetics and artistic movements (no literal locations or diagram-triggering words)
const VIBES = [
    // Digital & Future
    "Cybernetic Industrialism", "Chromatic Synth-Aesthetic", "Retro-Digital Vapor", "High-Tech Futurism", "Degraded Signal Artifacts", 
    "Utopian Solarpunk Brightness", "Organic-Synthetic Hybridization", "Y2K Digital Gloss", "Algorithmic Data Chaos", "Liminal Spatiality",
    "Acidic Pixelation", "Holographic Iridescence", "Minimalist Wireframe", "Digital Surrealist Depth", "Transhumanist Sheen",
    "Network-Centric Complexity", "Monochromatic Textual Texture", "Quantum Visualization", "Sub-Atomic Particulate", "Analog-Future Hybrid",
    
    // Art History & Techniques
    "High-Contrast Chiaroscuro", "Saturated Kodachrome Tones", "Ornate Baroque Shadows", "Geometric Art Deco Line-work", "Fluid Art Nouveau Curvature", 
    "Bauhaus Functional Minimalism", "Clockwork Industrialism", "Mid-Century Atomic Design", "Ethereal Romanticism", "Pre-Raphaelite Depth",
    "Flemish Still-Life Detail", "Byzantine Gilded Surface", "Weathered Fresco Texture", "Constructivist Geometry", "Faded Instant-Film Grain", 
    "Aggressive Grunge Distortion", "Golden-Era Monochrome", "Illuminated Intricacy", "Primal Expressive Markings", "Graphic Stylization",
    "Crystalline Patterning", "Impressionist Color-Daubs", "Pointillist Spectral Mixing", "Dadaist Randomization", "Surrealist Dream-Logic",
    
    // Atmospheric & Moody
    "Ethereal Luminescence", "Gothic Dark Fantasy", "Gritty Cinematic Noir", "Rustic Pastoral Simplicity", "Whimsical Narrative Quality", 
    "Moody Atmospheric Haze", "Desolate Nordic Melancholy", "Oppressive Tropical Humidity", "Mirage-like Distant Heat", 
    "Bioluminescent Depth", "Cosmic Existentialism", "Subdued Pastel Softness", "Ominous Fog-Bound Isolation", "Post-Systemic Decay",
    "Celestial Radiance", "Infernal Warmth", "Fresh Dewy Clarity", "Midnight Mystery", "Dust-Mote Suspension",
    "Moist Earthy Scent", "Golden Low-Sun Warmth", "Cool Twilight Blue-Hour", "Turbulent Kinetic Energy",
    
    // Conceptional & Philosophical
    "Abstract Minimalism", "Maximalist Pattern Chaos", "Layered Multi-Media", "Geometric Structuralism",
    "Fluid Kinetic Ink Wash", "Fragmented Cubist Perspective", "Fauvist Color Intensity", "Precision Editorial Sharpness",
    "Clean Nordic Practicality", "Chaotic Visual Density", "Modular Deconstructivism"
];

// Pure light quality descriptions
const LIGHTING = [
    "Golden-Hour Warmth", "Soft Overcast Diffusion", "Dramatic High-Contrast Chiaroscuro", "Volumetric Light Shafts", "Dappled Shadow Patterns",
    "Harsh Midday Directness", "Cool Twilight Ambient", "Serene Silvery Moonlight", "Intermittent High-Energy Flashes", "Refractive Underwater Caustics",
    "Soft-Focus Volumetric Haze", "Vibrant Neon Edge-Lighting", "Clean Flat Studio Illumination", "Sharp Rim-Lighting Contours", 
    "Stroboscopic Pulse", "Soft Global Ambient Fill", "Concentrated Spot Illumination", "Saturated Color Gel Wash",
    "Abstract Rhythmic Light Patterns", "Flickering Warm Incandescence", "Cool Blue Digital Glow", "Scattered Fiber-Optic Points",
    "High-Intensity Focused Beam", "Diagonal Split Lighting", "Halo-Effect Backlighting", "Gradient Background Wash", "Textured Shadow Gels",
    "Soft-Key Facial Illumination", "Jittery Phosphor Luminance", "High-Angle Multi-Point Overexposure", "Cool Industrial Vapor Glow",
    "Warm Sodium-Vapor Amber", "Internal Diffused Glow", "Prismatic Spectral Refraction", "Subtle Optic Flare",
    "Electromagnetic Energy Glow", "Bioluminescent Internal Radiance", "Thermal Spectrum Visualization", "Ultraviolet Reactive Glow"
];

// Color theory palettes
const PALETTES = [
    "Teal and Orange Contrast", "Magenta and Cyan Vibrancy", "High-Contrast Noir Monochrome", "Warm Sepia Tones", "Earthy Terracotta and Sage",
    "Cool Sapphire and Amethyst", "Desaturated Melancholy Grey", "Vibrant Rainbow Prismatic", "Deep Jewel-Tone Richness", 
    "Acidic Lime and Violet", "Metallic Gold and Obsidian", "Oxidized Rust and Verdigris", "Saturated Sunset Gradient", 
    "Electric Cyber-Neon", "Industrial Slate and Safety-Orange", "Royal Purple and Crimson", "Midnight Navy and Silver",
    "Thermal-Vision Spectrum", "CMYK Print-Process Halftones", "Faded Analog Film Tones", "Wes Anderson Pastel Symmetry",
    "Studio Ghibli Lush Greenery", "Bleach-Bypass Desaturation", "Cross-Processed Spectral Shifts"
];

// Surface and material properties (abstracted)
const TEXTURES = [
    "Smooth Matte Finish", "Highly Polished Specular", "Liquid Viscosity", "Precision Vector Definition", 
    "Crystalline Translucence", "Satin Fibrous Sheen", "Aerogel Diffusion", "Obsidionic Glassiness",
    "Granular Fine-Grain Noise", "Coarse Woven Canvas", "Distressed Oxidized Grunge", "Cracked Mineral Surface", 
    "Corroded Metallic Patina", "Peeling Layered Pigment", "Rough Sandpaper Grit", "Scratched Celluloid Base",
    "Organic Cellular Structure", "Fibrous Wooden Growth", "Soft Micro-Fiber Plush", "Reptilian Scaled Pattern",
    "Crystalline Geode Sharpening", "Smoky Amorphous Vapor", "Pixelated Digital Matrix", "Impasto Paint Peaks",
    "Carbon-Fiber Weave Pattern", "Holographic Micro-Etching", "Stained-Glass Fragmentation", "Intaglio Fine-Line Printing"
];

// Camera and framing techniques (Replaced 'Golden Ratio' and 'Spiral' with abstract flow terms)
const COMPOSITIONS = [
    "Minimalist Negative Space", "Symmetrical Center-Weighting", "Harmonious Proportional Balancing", "Chaotic Crowded Density",
    "Extreme Low-Angle Heroism", "High-Angle Omniscient Overview", "Macro-Level Microscopic Focus", "Expansive Wide-Angle Pan",
    "Dutch-Angle Kinetic Disorientation", "Internal Geometric Spatial Framing", "Harmonic Balance and Flow", "Dynamic Diagonal Flow",
    "Circular Aperture Vignette", "Shallow Depth-of-Field Bokeh", "Isometric Theoretical Perspective", "Spherical Fisheye Expansion",
    "Telephoto Compression", "Dual-Panel Triptych", "Inverted Reflection Symmetry", "Aerial Bird's-Eye View", "Worm's-Eye Grounded Angle",
    "Extreme Proximity Focus", "Cinematic Establishing Perspective", "Kinetic Motion Blur", "Radially Symmetrical Layout",
    "Knolled Organizational Arrangement", "Forced Perspective Illusion", "Layered Silhouette Depth", "Centric Multi-Quadrant Focus",
    "Cylindrical Panoramic Warp", "Quadrilateral Boundary Framing", "Infinite Vanishing Point", "Curvilinear Depth Trajectories"
];

export const getStyleDescription = (code: number): string => {
    // Seed the generator with the provided code
    const rand = mulberry32(code);

    // Pick exactly one from each category with a descriptive weight term
    const vibe = pickOneWithWeight(VIBES, rand);
    const light = pickOneWithWeight(LIGHTING, rand);
    const palette = pickOneWithWeight(PALETTES, rand);
    const texture = pickOneWithWeight(TEXTURES, rand);
    const comp = pickOneWithWeight(COMPOSITIONS, rand);

    return `(IMPORTANT: Apply the following styles as integrated visual qualities within the scene. DO NOT add literal graphic overlays, UI elements, diagrams, lines, spirals, or technical symbols on top of the image. Visual Style: ${vibe}. Lighting: ${light}. Color Palette: ${palette}. Texture/Surface: ${texture}. Composition: ${comp}.)`;
}
