import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Crop, X, ZoomIn, ZoomOut, RotateCw, RefreshCw, Check } from "lucide-react";
import { Button } from "../common/UIComponents.jsx";

export default function CropPhotoModal({
  imageSrc,
  onClose,
  onSave,
  isDark,
  title = "Crop & Adjust Photo",
  subTitle = "Drag to reposition, use slider to zoom",
  saveLabel = "Crop & Save",
  aspectRatio = "round"
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [cropShape, setCropShape] = useState(aspectRatio); // "round" or "rect"
  const [fitMode, setFitMode] = useState("contain"); // "contain" (fits entire photo) or "cover" (fills viewport)
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isRect = cropShape === "rect";
  const viewportW = isRect ? 380 : 300;
  const viewportH = isRect ? 260 : 300;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPan({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setFitMode("contain");
  };

  const handleCropAndSave = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const outW = isRect ? 800 : 500;
    const outH = isRect ? 600 : 500;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, outW, outH);

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const baseScale = fitMode === "contain"
      ? Math.min(viewportW / img.naturalWidth, viewportH / img.naturalHeight)
      : Math.max(viewportW / img.naturalWidth, viewportH / img.naturalHeight);

    const finalScale = (baseScale * zoom) * (outW / viewportW);

    const renderW = img.naturalWidth * finalScale;
    const renderH = img.naturalHeight * finalScale;

    const panX = pan.x * (outW / viewportW);
    const panY = pan.y * (outH / viewportH);

    ctx.drawImage(img, -renderW / 2 + panX, -renderH / 2 + panY, renderW, renderH);
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.96);
    onSave(croppedDataUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--ll-bg-card)",
          borderColor: "var(--ll-color-line)",
          color: "var(--ll-color-ink)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--ll-color-line)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
              <Crop size={18} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight" style={{ color: "var(--ll-color-ink)" }}>{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ll-focus p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Stage / Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-black/50 min-h-[340px] relative">
          {/* Shape & Fit Controls Overlay Toolbar */}
          <div className="absolute top-3 left-6 right-6 flex items-center justify-between z-10">
            {/* Shape Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setCropShape("round")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${cropShape === "round" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
              >
                ● Circle
              </button>
              <button
                type="button"
                onClick={() => setCropShape("rect")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${cropShape === "rect" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
              >
                █ Rectangle
              </button>
            </div>

            {/* Fit Strategy Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setFitMode("contain")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${fitMode === "contain" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                title="Fit full photo inside viewport"
              >
                Fit Whole Image
              </button>
              <button
                type="button"
                onClick={() => setFitMode("cover")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${fitMode === "cover" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                title="Fill entire crop frame"
              >
                Fill Frame
              </button>
            </div>
          </div>

          <div
            className={`relative select-none cursor-grab active:cursor-grabbing flex items-center justify-center bg-slate-950 overflow-hidden border-2 border-amber-500 shadow-[0_0_30px_rgba(229,184,66,0.3)] mt-8 ${isRect ? "w-[380px] h-[260px] rounded-xl" : "w-[300px] h-[300px] rounded-full"
              }`}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {imageLoaded && (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none pointer-events-none transition-transform duration-75"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${(fitMode === "contain"
                      ? Math.min(viewportW / (imgRef.current?.naturalWidth || 1), viewportH / (imgRef.current?.naturalHeight || 1))
                      : Math.max(viewportW / (imgRef.current?.naturalWidth || 1), viewportH / (imgRef.current?.naturalHeight || 1))) * zoom
                    })`,
                  transformOrigin: "center center",
                }}
              />
            )}

            {/* Grid Guidelines overlay */}
            {isRect ? (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20 pointer-events-none">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>
            ) : (
              <>
                <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                <div className="absolute inset-[33%] rounded-full border border-white/15 pointer-events-none" />
                <div className="absolute inset-[66%] rounded-full border border-white/15 pointer-events-none" />
              </>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="px-6 py-4 border-t space-y-4" style={{ borderColor: "var(--ll-color-line)", background: "var(--ll-bg-paper-deep)" }}>
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut size={15} className="text-slate-400 flex-shrink-0" />
            <input
              type="range"
              min="0.3"
              max="4.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
            <ZoomIn size={15} className="text-slate-400 flex-shrink-0" />
            <span className="text-xs font-mono w-12 text-right text-amber-500 font-bold">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all cursor-pointer"
                style={{ borderColor: "var(--ll-color-line)", color: "var(--ll-color-ink)" }}
                title="Rotate 90 degrees clockwise"
              >
                <RotateCw size={14} className="text-amber-500" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-500/10 transition-all cursor-pointer text-slate-400 hover:text-slate-200"
                style={{ borderColor: "var(--ll-color-line)" }}
                title="Reset zoom, rotation, and position"
              >
                <RefreshCw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="ll-focus px-4 py-1.5 rounded-md border text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                style={{ borderColor: "var(--ll-color-line)", color: "var(--ll-color-slate)" }}
              >
                Cancel
              </button>

              <Button
                onClick={handleCropAndSave}
                size="sm"
                className="px-5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
              >
                <Check size={14} /> {saveLabel}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
