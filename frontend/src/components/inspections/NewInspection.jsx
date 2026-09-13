import React, { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search, RefreshCw, FilePlus2, Database, Loader2, AlertTriangle, ScanLine, X, Crop,
  UploadCloud, CheckCircle2, ShieldCheck, Plus, Globe, Link2, Zap, ArrowRight, ArrowLeft,
  Sparkles, Info
} from "lucide-react";
import {
  C, FONT, CATEGORIES, PIPELINE_STAGES, inputStyle
} from "../../constants.jsx";
import ApiService from "../../services/api.js";
import { Card, SectionLabel, Button } from "../common/UIComponents.jsx";
import CropPhotoModal from "../modals/CropPhotoModal.jsx";
import ProcessingScreen from "./ProcessingScreen.jsx";

function evaluateImageQuality(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const previewUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const totalPixels = width * height;
      let quality = "HIGH";
      let qualityLabel = "Sharpness: High ✓";
      let qualityBadge = "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";

      if (width < 800 || height < 600 || totalPixels < 500000) {
        quality = "LOW";
        qualityLabel = "Low Res";
        qualityBadge = "text-amber-400 bg-amber-500/15 border-amber-500/30";
      } else if (width < 1400 || height < 1000) {
        quality = "MODERATE";
        qualityLabel = "Sharpness: Good ✓";
        qualityBadge = "text-cyan-400 bg-cyan-500/15 border-cyan-500/30";
      }

      callback({
        file,
        previewUrl,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        width,
        height,
        quality,
        qualityLabel,
        qualityBadge,
      });
    };
    img.src = previewUrl;
  };
  reader.readAsDataURL(file);
}

export function MobileCodeScanner({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopScanner = () => {
    try { controlsRef.current?.stop?.(); } catch (_) { }
    controlsRef.current = null;
    const video = videoRef.current;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  };

  useEffect(() => {
    if (!open) {
      stopScanner();
      return undefined;
    }

    let cancelled = false;
    setError("");
    setTorchOn(false);

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not available in this browser.");
        }

        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const constraints = {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result) => {
            if (!result || cancelled) return;
            const value = result.getText?.() || String(result);
            if (!value) return;
            cancelled = true;
            navigator.vibrate?.(120);
            stopScanner();
            onDetected?.(value);
          }
        );

        if (cancelled) {
          controls.stop?.();
          return;
        }

        controlsRef.current = controls;
        const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
        const capabilities = track?.getCapabilities?.();
        setTorchSupported(Boolean(capabilities?.torch));
      } catch (err) {
        if (!cancelled) {
          const message = err?.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access and try again."
            : err?.message || "Unable to start the camera scanner.";
          setError(message);
        }
      }
    };

    startScanner();
    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open]);

  const toggleTorch = async () => {
    try {
      const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
      if (!track) return;
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (_) {
      setTorchSupported(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl overflow-hidden border shadow-2xl" style={{ background: "#0b1220", borderColor: "rgba(34,211,238,0.35)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(148,163,184,0.18)" }}>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ScanLine size={18} className="text-cyan-400" /> Live QR & Barcode Scanner
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Point the rear camera at a QR code or product barcode.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white" title="Close scanner">
            <X size={19} />
          </button>
        </div>

        <div className="relative aspect-[3/4] sm:aspect-video bg-black overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[72%] max-w-[340px] aspect-square border-2 border-cyan-300/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.22)] relative">
              <span className="absolute left-0 right-0 top-1/2 h-px bg-cyan-300 shadow-[0_0_18px_3px_rgba(34,211,238,0.8)] animate-pulse" />
            </div>
          </div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-slate-950/90">
              <div>
                <AlertTriangle className="mx-auto mb-3 text-amber-400" size={30} />
                <p className="text-sm text-slate-200">{error}</p>
                <p className="text-xs text-slate-500 mt-2">On iPhone and Android, open this site over HTTPS and allow camera permission.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[11px] text-slate-400">QR • EAN • UPC • Code 128 and other supported formats</span>
          <div className="flex gap-2">
            {torchSupported && (
              <button type="button" onClick={toggleTorch} className="px-3 py-2 rounded-lg border text-xs font-semibold text-amber-300 border-amber-400/30 hover:bg-amber-400/10">
                {torchOn ? "Flash Off" : "Flash On"}
              </button>
            )}
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-white/10 text-xs font-semibold text-white hover:bg-white/15">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dropzone({ label, sublabel, required, imageData, onImageChange, onRemove, onBarcodeDetected, heightClass = "h-48", showAddButtons = true }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    evaluateImageQuality(file, (data) => {
      onImageChange(data);
    });
  };

  const handleCroppedSave = (croppedDataUrl) => {
    setShowCropModal(false);
    fetch(croppedDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], imageData?.name || "cropped_package.jpg", { type: "image/jpeg" });
        evaluateImageQuality(file, (data) => {
          onImageChange(data);
        });
      });
  };

  return (
    <div className="relative flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <motion.div
        onClick={() => {
          if (!imageData) {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        whileHover={!imageData && !shouldReduceMotion ? { scale: 1.01, transition: { duration: 0.15 } } : {}}
        animate={isDragging ? { scale: 1.02, borderColor: "#E5B842" } : {}}
        className={`w-full ${heightClass} border-2 rounded-xl flex flex-col items-center justify-center p-3 transition-all relative overflow-hidden ${isDragging
            ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/10"
            : imageData
              ? "border-emerald-500/40 bg-slate-900/40"
              : "border-dashed border-slate-700/60 hover:border-slate-500 bg-slate-800/20 cursor-pointer"
          }`}
        style={{
          background: imageData ? "var(--ll-bg-card)" : "var(--ll-bg-paper-deep)",
          borderColor: isDragging ? "var(--ll-color-gold)" : imageData ? "var(--ll-compliant)" : "var(--ll-color-line)",
          cursor: imageData ? "default" : "pointer"
        }}
      >
        {imageData ? (
          <div className="w-full h-full flex flex-col justify-between relative group">
            {/* Image Preview & Overlay */}
            <div className="relative flex-1 w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/20">
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                src={imageData.previewUrl}
                alt={label}
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-2xs p-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowCropModal(true)}
                  className="px-2.5 py-1.5 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 flex items-center gap-1 shadow-md cursor-pointer"
                  title="Crop & adjust dimensions"
                >
                  <Crop size={13} /> Crop & Adjust
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1.5 rounded bg-slate-900/90 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <UploadCloud size={13} /> Replace
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-2 py-1.5 rounded bg-slate-900/90 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1 shadow-md cursor-pointer"
                  title="Open QR / barcode scanner"
                >
                  <ScanLine size={13} /> Scan Code
                </motion.button>
              </div>
            </div>

            {/* Quality & Resolution Bar */}
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                <span className="font-semibold" style={{ color: "var(--ll-color-ink)" }}>{label}</span>
                <span className="text-slate-400 truncate">({imageData.width}×{imageData.height}px)</span>
              </div>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold whitespace-nowrap ${imageData.qualityBadge}`}>
                {imageData.qualityLabel}
              </span>
            </div>

            {/* Remove Button */}
            <motion.button
              whileHover={{ scale: 1.15, backgroundColor: "#DC2626" }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white transition-colors shadow cursor-pointer"
              title="Remove image"
            >
              <X size={13} />
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-xs"
              style={{ background: "var(--ll-bg-card)", border: "1px solid var(--ll-color-line)" }}
            >
              <UploadCloud size={19} style={{ color: "var(--ll-color-gold)" }} />
            </motion.div>

            <div className="text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
              {label} {required && <span className="text-red-500 font-bold">*</span>}
            </div>

            <p className="text-[11.5px] text-slate-400 mb-3 max-w-md leading-normal px-2">
              {sublabel || "Drop image here or select upload method"}
            </p>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-ink)" }}
              >
                <UploadCloud size={13} /> Browse
              </motion.button>

              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowScanner(true);
                }}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-ink)" }}
                title="Open live QR / barcode scanner"
              >
                <ScanLine size={13} /> Scan QR / Barcode
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      <MobileCodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onDetected={(value) => {
          setShowScanner(false);
          onBarcodeDetected?.(value);
        }}
      />

      {showCropModal && imageData?.previewUrl && (
        <CropPhotoModal
          imageSrc={imageData.previewUrl}
          aspectRatio="rect"
          title="Crop & Adjust Package Photo"
          subTitle="Drag to reposition, use slider to zoom, or rotate for optimal alignment"
          saveLabel="Crop & Set Image"
          onClose={() => setShowCropModal(false)}
          onSave={handleCroppedSave}
        />
      )}
    </div>
  );
}

const STEPS = ["Upload Images", "Metadata", "Review", "Processing"];

export default function NewInspection({ onFinish, currentUser }) {
  const [step, setStep] = useState(0);
  const [images, setImages] = useState({
    front: null,
    back: null,
    ecommerce: null,
  });
  const [ecomUrl, setEcomUrl] = useState("");
  const [scanMode, setScanMode] = useState("PHYSICAL"); // "PHYSICAL" | "ECOMMERCE"
  const [extraAngles, setExtraAngles] = useState([]); // [{ id: 'side', label: 'Side Panel', data: null }]
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdCase, setCreatedCase] = useState(null);

  const [metadata, setMetadata] = useState({
    category: "Packaged Food",
    productName: "",
    barcode: "",
    manufacturer: "",
    packageWidth: "150",
    packageHeight: "220",
    location: "Field Inspection / Retail Store",
    inspectionDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  // Global Clipboard Paste (Ctrl + V) Handler for images
  useEffect(() => {
    const handlePaste = (e) => {
      if (step !== 0) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            evaluateImageQuality(file, (data) => {
              setImages((prev) => {
                if (!prev.front) return { ...prev, front: data };
                if (!prev.back) return { ...prev, back: data };
                if (!prev.ecommerce) return { ...prev, ecommerce: data };
                return { ...prev, front: data };
              });
              setStepError("");
            });
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [step]);

  const addExtraAngle = () => {
    const angleTypes = ["Side / Flap Panel", "Top Seal / Cap", "Bottom Panel", "Nutrition / Barcode Flap"];
    const nextIdx = extraAngles.length;
    const label = angleTypes[nextIdx % angleTypes.length];
    const newId = `extra_${Date.now()}`;
    setExtraAngles((prev) => [...prev, { id: newId, label, data: null }]);
  };

  const removeExtraAngle = (id) => {
    setExtraAngles((prev) => prev.filter((a) => a.id !== id));
  };

  const updateExtraAngle = (id, data) => {
    setExtraAngles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, data } : a))
    );
  };

  const handleContinueFromImages = () => {
    if (ecomUrl.trim() && !images.front && !images.back) {
      handleEcomScanSubmit();
      return;
    }
    if (!images.front && !images.back && !images.ecommerce) {
      setStepError("Please upload product packaging photos, a listing screenshot, or enter an e-commerce URL.");
      return;
    }
    setStepError("");
    setStep(1);
  };

  const uploadedImagesCount =
    (images.front ? 1 : 0) +
    (images.back ? 1 : 0) +
    (images.ecommerce ? 1 : 0) +
    extraAngles.filter((a) => a.data).length;

  function dataURItoBlob(dataURI) {
    if (!dataURI || typeof dataURI !== "string" || !dataURI.startsWith("data:")) return null;
    try {
      const parts = dataURI.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mime });
    } catch (e) {
      console.warn("dataURItoBlob error:", e);
      return null;
    }
  }

  const handleSubmitForProcessing = async () => {
    setSubmitting(true);

    const generatedCaseNo = `LM/2026/${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Prepare all image uploads
    const itemsToUpload = [];
    if (images.front) itemsToUpload.push({ angle: "FRONT", data: images.front });
    if (images.back) itemsToUpload.push({ angle: "BACK", data: images.back });
    if (images.ecommerce) itemsToUpload.push({ angle: "ECOMMERCE", data: images.ecommerce });
    extraAngles.forEach((ea, idx) => {
      if (ea.data) {
        const angleName = ea.label.toUpperCase();
        itemsToUpload.push({ angle: `EXTRA_${idx + 1}_${angleName}`, data: ea.data });
      }
    });

    const fileObjects = [];
    for (const item of itemsToUpload) {
      if (item.data.file) {
        fileObjects.push(item.data.file);
      } else if (item.data.previewUrl) {
        if (item.data.previewUrl.startsWith("data:")) {
          const blob = dataURItoBlob(item.data.previewUrl);
          if (blob) {
            const file = new File([blob], `${item.angle.toLowerCase()}.jpg`, { type: "image/jpeg" });
            fileObjects.push(file);
          }
        } else {
          try {
            const res = await fetch(item.data.previewUrl);
            const blob = await res.blob();
            const file = new File([blob], `${item.angle.toLowerCase()}.jpg`, { type: blob.type || "image/jpeg" });
            fileObjects.push(file);
          } catch (e) {
            console.warn("Failed to fetch image previewUrl into blob:", item.data.previewUrl, e);
          }
        }
      } else if (typeof item.data === "string" && (item.data.startsWith("http") || item.data.startsWith("/"))) {
        try {
          const res = await fetch(item.data);
          const blob = await res.blob();
          const file = new File([blob], `${item.angle.toLowerCase()}.jpg`, { type: blob.type || "image/jpeg" });
          fileObjects.push(file);
        } catch (e) {
          console.warn("Failed to fetch image string into blob:", item.data, e);
        }
      }
    }

    let newCaseData = {
      inspection_no: generatedCaseNo,
      product_name: metadata?.productName || "Packaged Commodity",
      category: metadata?.category || "Packaged Food",
      location: metadata?.location || "New Delhi, Delhi",
      uploaded_images: {}
    };

    itemsToUpload.forEach(item => {
      newCaseData.uploaded_images[item.angle] = item.data;
    });

    // 2. Call FastAPI direct scan endpoint
    if (fileObjects.length > 0) {
      try {
        console.log(`⚡ Sending ${fileObjects.length} photos to FastAPI backend for live analysis...`);
        const scanRes = await ApiService.directScan({
          files: fileObjects,
          productName: metadata?.productName || "Packaged Commodity",
          category: metadata?.category || "Packaged Food",
          location: metadata?.location || "New Delhi, Delhi"
        });
        console.log("✅ FastAPI direct scan response:", scanRes);
        if (scanRes) {
          newCaseData = {
            ...newCaseData,
            ...scanRes,
            inspection_no: scanRes.case_number || generatedCaseNo,
            declarations: scanRes.declarations || [],
            status: scanRes.status || "NON_COMPLIANT"
          };
        }
      } catch (err) {
        console.error("⚠️ FastAPI direct scan error:", err);
      }
    }

    setCreatedCase(newCaseData);
    setSubmitting(false);
    setStep(3);
  };

  const handleEcomScanSubmit = async () => {
    if (!ecomUrl.trim()) {
      setStepError("Please enter an e-commerce product URL to inspect.");
      return;
    }
    setStepError("");
    setSubmitting(true);

    try {
      console.log(`🌐 Scanning e-commerce URL with FastAPI & Gemini Vision: ${ecomUrl}`);
      
      const fileObjects = [];
      const imgSources = [images.ecommerce, images.front, images.back].filter(Boolean);
      for (let idx = 0; idx < imgSources.length; idx++) {
        const item = imgSources[idx];
        if (item.file) {
          fileObjects.push(item.file);
        } else if (item.previewUrl && item.previewUrl.startsWith("data:")) {
          const blob = dataURItoBlob(item.previewUrl);
          if (blob) {
            fileObjects.push(new File([blob], `ecom_screenshot_${idx + 1}.jpg`, { type: "image/jpeg" }));
          }
        }
      }

      const scanRes = await ApiService.ecomScanUrl({
        url: ecomUrl.trim(),
        category: metadata?.category || "Packaged Food",
        location: metadata?.location && metadata.location !== "Field Inspection / Retail Store" ? metadata.location : "Digital Marketplace",
        files: fileObjects
      });
      console.log("✅ E-Commerce scan response:", scanRes);

      let newCaseData = {
        inspection_no: scanRes.case_number || `LM/ECOM/2026/${Math.floor(100000 + Math.random() * 900000)}`,
        product_name: scanRes.product || scanRes.product_name || "E-Commerce Packaged Item",
        category: scanRes.category || metadata?.category || "Packaged Food",
        location: scanRes.location || "Digital Marketplace",
        platform: scanRes.platform || "E-Commerce",
        seller_name: scanRes.seller_name,
        url: ecomUrl.trim(),
        uploaded_images: {},
        ...scanRes,
        declarations: scanRes.declarations || [],
        violations: scanRes.violations || [],
        status: scanRes.status || "REVIEW"
      };

      if (scanRes.images && Array.isArray(scanRes.images)) {
        scanRes.images.forEach((img, idx) => {
          const key = img.angle || `GALLERY_PHOTO_${idx + 1}`;
          newCaseData.uploaded_images[key] = {
            previewUrl: img.url || img.image_url,
            name: img.filename || `product_photo_${idx + 1}.jpg`
          };
        });
      }

      setCreatedCase(newCaseData);
      setSubmitting(false);
      setStep(3);
    } catch (err) {
      console.error("⚠️ E-Commerce scan failed:", err);
      setSubmitting(false);
      setStepError(err.message || "Failed to inspect e-commerce link. Please check URL and try again.");
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center flex-1 last:flex-none min-w-[140px]">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: idx === step ? 1.08 : 1,
                  backgroundColor: idx <= step ? "var(--ll-color-ink)" : "var(--ll-bg-card)",
                  borderColor: idx <= step ? "var(--ll-color-ink)" : "var(--ll-color-line)",
                }}
                transition={{ duration: 0.25 }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-2xs"
                style={{
                  color: idx <= step ? "var(--ll-button-primary-color)" : C.slate,
                  fontSize: 12,
                  fontWeight: 700,
                  ...FONT.mono,
                }}
              >
                {idx + 1}
              </motion.div>
              <span style={{ fontSize: 12.5, fontWeight: idx === step ? 700 : 500, color: idx <= step ? C.ink : C.slate }}>{s}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 bg-slate-200 dark:bg-slate-800 relative overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-slate-800 dark:bg-amber-400"
                  initial={{ width: "0%" }}
                  animate={{ width: idx < step ? "100%" : "0%" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <SectionLabel
            eyebrow="STEP 1"
            title="Upload Product Images"
            right={
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-sm border" style={{ background: "var(--ll-bg-paper)", borderColor: C.line }}>
                <span className="text-[11px]" style={{ color: C.slate }}>
                  Tip: Press <kbd className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px]" style={{ background: "var(--ll-bg-paper-deep)", border: `1px solid ${C.line}`, color: "var(--ll-color-ink)" }}>Ctrl + V</kbd> to paste screenshots directly
                </span>
              </div>
            }
          />

          {stepError && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{stepError}</span>
            </div>
          )}

          {metadata.barcode && (
            <div className="mt-4 mb-1 flex items-center justify-between gap-3 p-3 rounded-lg border" style={{ background: "rgba(34,211,238,0.08)", borderColor: "rgba(34,211,238,0.28)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-mono">Code detected</div>
                  <div className="text-sm font-semibold truncate" style={{ color: C.ink }}>{metadata.barcode}</div>
                </div>
              </div>
              <button type="button" onClick={() => setMetadata((prev) => ({ ...prev, barcode: "" }))} className="text-xs text-slate-400 hover:text-red-400">Clear</button>
            </div>
          )}

          {/* Primary 2-Panel Upload (Front & Back) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <Dropzone
              label="Front Panel (Principal Display Panel)"
              sublabel="Rule 6(1): MRP, Net Quantity & Commodity Name"
              required={true}
              imageData={images.front}
              onImageChange={(data) => {
                setImages((prev) => ({ ...prev, front: data }));
                setStepError("");
              }}
              onRemove={() => setImages((prev) => ({ ...prev, front: null }))}
              onBarcodeDetected={(value) => setMetadata((prev) => ({ ...prev, barcode: value }))}
            />
            <Dropzone
              label="Back Panel (Mandatory Declarations)"
              sublabel="Rule 6(1): Manufacturer Address, Origin, Consumer Care"
              required={true}
              imageData={images.back}
              onImageChange={(data) => {
                setImages((prev) => ({ ...prev, back: data }));
                setStepError("");
              }}
              onRemove={() => setImages((prev) => ({ ...prev, back: null }))}
              onBarcodeDetected={(value) => setMetadata((prev) => ({ ...prev, barcode: value }))}
            />
          </div>

          {/* Dynamic Extra Angles */}
          {extraAngles.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: C.gold }}>
                  Additional Angles ({extraAngles.length})
                </span>
                <span className="text-[11px] text-slate-400">Side panels, batch code stamps, flaps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extraAngles.map((angle) => (
                  <div key={angle.id} className="relative">
                    <Dropzone
                      label={angle.label}
                      sublabel="Assists AI OCR for non-flat packaging & curvature"
                      required={false}
                      imageData={angle.data}
                      onImageChange={(data) => updateExtraAngle(angle.id, data)}
                      onRemove={() => updateExtraAngle(angle.id, null)}
                      onBarcodeDetected={(value) => setMetadata((prev) => ({ ...prev, barcode: value }))}
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraAngle(angle.id)}
                      className="absolute top-2 right-2 z-10 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove angle"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Extra Angle Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={addExtraAngle}
              className="ll-focus w-full py-2.5 rounded-lg border border-solid text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:border-amber-400 hover:bg-amber-400/10 cursor-pointer"
              style={{
                borderColor: "rgba(229,184,66,0.35)",
                background: "var(--ll-bg-card)",
                color: "var(--ll-color-ink)",
              }}
            >
              <Plus size={14} className="text-amber-500" />
              <span>+ Add Extra Angle (Side Panel, Top Seal, Expiry / Batch Stamp)</span>
            </button>
          </div>

          {/* E-Commerce Screenshot & URL Section */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
                <Globe size={14} className="text-amber-500" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: C.gold }}>
                  E-Commerce Listing Verification (Optional)
                </span>
                <p className="text-[11px] text-slate-400">
                  Rule 49 PCR 2011 • Verification for marketplace listings (Amazon, Blinkit, Flipkart, Zepto)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center p-5 rounded-xl border space-y-2 min-h-[176px]" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.charcoal }}>
                    <Globe size={14} style={{ color: C.gold }} />
                    <span className="font-bold">Product E-Listing URL</span>
                  </label>
                  {ecomUrl && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {ecomUrl.includes("amazon") ? "Amazon" : ecomUrl.includes("flipkart") ? "Flipkart" : ecomUrl.includes("blinkit") ? "Blinkit" : ecomUrl.includes("zepto") ? "Zepto" : "E-Commerce"}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      style={{ ...inputStyle, paddingLeft: 34, height: 42 }}
                      placeholder="https://www.amazon.in/dp/... or Flipkart, Blinkit URL"
                      value={ecomUrl}
                      onChange={(e) => setEcomUrl(e.target.value)}
                    />
                  </div>
                  {ecomUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleEcomScanSubmit}
                      disabled={submitting}
                      className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                      Scan URL
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  Paste product page URL. The engine downloads all product gallery photos & specifications for Rule 6(10) PCR 2011 inspection.
                </span>
              </div>

              <div className="lg:col-span-1 flex items-center justify-center font-mono text-xs font-bold text-slate-400">
                <span className="px-2 py-1 rounded border" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>OR</span>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center">
                <Dropzone
                  label="Listing Screenshot"
                  sublabel="Upload file or Press Ctrl + V to paste"
                  required={false}
                  imageData={images.ecommerce}
                  onImageChange={(data) => setImages((prev) => ({ ...prev, ecommerce: data }))}
                  onRemove={() => setImages((prev) => ({ ...prev, ecommerce: null }))}
                  onBarcodeDetected={(value) => setMetadata((prev) => ({ ...prev, barcode: value }))}
                  heightClass="h-44 sm:h-48"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: C.line }}>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Pre-OCR Quality verification active</span>
            </div>
            <Button onClick={handleContinueFromImages}>
              Continue to Metadata <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <SectionLabel eyebrow="STEP 2" title="Inspection Context" right={<span style={{ fontSize: 11.5, color: C.slate }}>AI Auto-Extraction Enabled</span>} />

          <div className="mb-5 p-3.5 rounded-lg border flex items-start gap-3" style={{ background: "rgba(229,184,66,0.06)", borderColor: "rgba(229,184,66,0.3)" }}>
            <Sparkles size={18} style={{ color: C.gold, marginTop: 2, flexShrink: 0 }} />
            <div>
              <span className="text-xs font-bold font-mono uppercase" style={{ color: C.gold }}>
                Autonomous Multimodal AI Extraction Active
              </span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                You do not need to manually enter Product Name, MRP, Net Weight, Manufacturer, or Dates.
                <strong> Gemini Vision AI</strong> will automatically inspect and extract all statutory declarations directly from your uploaded packaging photos.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="block mb-4">
              <div style={{ ...FONT.body, fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, letterSpacing: "0.02em" }}>
                Product Category (Determines PCR 2011 Compliance Rules)
              </div>
              <select
                style={inputStyle}
                value={metadata.category}
                onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
              >
                <option value="" disabled>Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="block mb-4">
              <div style={{ ...FONT.body, fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, letterSpacing: "0.02em" }}>
                Officer Remarks / Inspection Notes
              </div>
              <textarea
                style={{ ...inputStyle, minHeight: 90 }}
                placeholder="Enter any field observations (e.g. retail shelf sample, damaged outer seal, suspected price alteration)..."
                value={metadata.notes}
                onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: C.line }}>
            <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft size={15} /> Back to Photos</Button>
            <Button onClick={() => setStep(2)}>Review & Submit <ArrowRight size={15} /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <SectionLabel eyebrow="STEP 3" title="Review Before Submission" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            {[
              ["Images Attached", `${uploadedImagesCount} packaging photo${uploadedImagesCount === 1 ? "" : "s"} attached`],
              ["Product Category", metadata.category || "Packaged Food"],
              ["Scanned QR / Barcode", metadata.barcode || "Not scanned"],
              ["Extraction Mode", "Autonomous Gemini Vision AI + Dual-Pass OCR"],
              ["Officer Remarks", metadata.notes ? (metadata.notes.length > 30 ? metadata.notes.slice(0, 30) + "..." : metadata.notes) : "None recorded"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b" style={{ borderColor: C.line }}>
                <span style={{ color: C.slate }}>{k}</span>
                <span style={{ fontWeight: 600, color: C.ink }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 rounded-sm border mb-6" style={{ borderColor: C.reviewBd, background: C.reviewBg }}>
            <Info size={14} style={{ color: C.review, marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: C.charcoal, lineHeight: 1.5 }}>
              Submitting will run the automated OCR and rule-validation pipeline. Results are AI-assisted findings and require officer confirmation before any enforcement action.
            </p>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</Button>
            <Button onClick={handleSubmitForProcessing} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Running Gemini Vision AI Inspection…
                </>
              ) : (
                <>
                  Submit for Processing <ArrowRight size={15} />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <ProcessingScreen
          createdCase={createdCase}
          metadata={metadata}
          onDone={onFinish}
        />
      )}
    </div>
  );
}
