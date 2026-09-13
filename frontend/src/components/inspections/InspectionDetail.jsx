import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ScanLine, Eye, ZoomIn, X, Building2, MapPin, Calendar, User, Code, FileText, Loader2,
  ChevronLeft, ChevronRight, ShieldAlert, Lock, Shield
} from "lucide-react";
import { C, FONT, inputStyle } from "../../constants.jsx";
import ApiService from "../../services/api.js";
import { Card, SectionLabel, Button, ReqStatusChip, VerdictStamp } from "../common/UIComponents.jsx";
import ConsumerGrievanceModal from "../consumer/ConsumerGrievanceModal.jsx";

const LABEL_LAYOUT = {
  manufacturer: { top: "10%", left: "6%", width: "60%", height: "10%" },
  netQty: { top: "22%", left: "6%", width: "30%", height: "8%" },
  mrp: { top: "22%", left: "62%", width: "32%", height: "8%" },
  coo: { top: "32%", left: "6%", width: "40%", height: "8%" },
  consumerCare: { top: "42%", left: "6%", width: "88%", height: "14%" },
  mfgDate: { top: "58%", left: "6%", width: "40%", height: "8%" },
  bestBefore: { top: "58%", left: "50%", width: "44%", height: "8%" },
};

export function MockLabel({ highlightKey, requirement }) {
  const m = requirement ? ({ PASS: C.compliant, FAIL: C.violation, REVIEW: C.review }[requirement.status] || C.ink) : C.ink;
  return (
    <div className="relative w-full rounded-sm border overflow-hidden" style={{ borderColor: C.line, background: "var(--ll-bg-card)", aspectRatio: "4/5" }}>
      <div className="absolute inset-0 p-4 opacity-90">
        <div className="h-4 w-2/3 rounded-sm mb-3" style={{ background: "var(--ll-bg-paper-deep)" }} />
        {Object.entries(LABEL_LAYOUT).map(([key, pos]) => (
          <div key={key} className="absolute rounded-sm" style={{ ...pos, background: "var(--ll-bg-paper)", border: `1px solid ${C.line}` }} />
        ))}
      </div>
      {highlightKey && (
        <div
          className="absolute rounded-sm border-2"
          style={{
            ...LABEL_LAYOUT[highlightKey],
            borderColor: m,
            boxShadow: `0 0 0 3px ${m}33`,
            transition: "all .3s ease",
          }}
        />
      )}
    </div>
  );
}

export function EvidenceModal({ requirement, onClose }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {requirement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xs"
          style={{ background: "var(--ll-modal-overlay)" }}
          onClick={onClose}
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 15 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="rounded-sm max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden border shadow-2xl"
            style={{ background: "var(--ll-bg-card)", borderColor: C.line, maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5" style={{ background: "var(--ll-bg-paper-deep)" }}>
              <MockLabel highlightKey={requirement.key} requirement={requirement} />
              <div className="flex items-center justify-center gap-4 mt-3 text-xs" style={{ color: C.slate }}>
                <span className="flex items-center gap-1"><ZoomIn size={13} /> Zoom & pan supported</span>
              </div>
            </div>
            <div className="p-6 overflow-y-auto ll-scroll">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.08em" }}>EVIDENCE</div>
                  <h3 style={{ ...FONT.display, fontSize: 18, fontWeight: 600, color: C.ink }}>{requirement.label}</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="ll-focus p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </motion.button>
              </div>
              <ReqStatusChip status={requirement.status} />

              <div className="mt-5 space-y-4">
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>DETECTED TEXT</div>
                  <div style={{ ...FONT.mono, fontSize: 13, color: C.charcoal, marginTop: 3, background: "var(--ll-bg-paper)", border: `1px solid ${C.line}`, padding: "8px 10px", borderRadius: 2 }}>
                    {requirement.detected || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>OCR CONFIDENCE</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--ll-bg-paper-deep)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${requirement.confidence}%`, background: C.gold }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{requirement.confidence}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>RELATED RULE</div>
                  <div style={{ ...FONT.mono, fontSize: 13, color: C.ink, fontWeight: 600, marginTop: 3 }}>{requirement.rule}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>REASON</div>
                  <p style={{ fontSize: 12.5, color: C.charcoal, marginTop: 3, lineHeight: 1.5 }}>{requirement.reason}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function InspectionDetail({ inspection, users = [], currentUser, onSubmitGrievance }) {
  const [evidenceReq, setEvidenceReq] = useState(null);
  const [activeAngle, setActiveAngle] = useState("FRONT");
  const [hoveredReq, setHoveredReq] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);

  const isConsumer = currentUser?.role === "Consumer";
  const insp = inspection || {};

  // Restriction Guard: Customers cannot access internal product scans performed by enforcement officers
  const isMyScan = insp.inspector_email && currentUser?.email && insp.inspector_email.toLowerCase() === currentUser.email.toLowerCase();
  const isCustomerScan = insp.is_consumer === true || insp.created_by_role === "Consumer";
  const isOfficerScan = insp.is_officer_internal || Boolean(insp.inspector_badge) || insp.inspector_role === "Officer" || insp.is_officer_only || (!isMyScan && !isCustomerScan && Boolean(insp.inspector_badge || insp.inspector_name));

  if (isConsumer && !isMyScan && !isCustomerScan && isOfficerScan) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border shadow-xl text-center space-y-5" style={{ background: "var(--ll-bg-card)", borderColor: C.line }}>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
          <ShieldAlert size={32} />
        </div>
        <div>
          <span className="text-[11px] font-mono tracking-widest text-amber-500 uppercase font-bold flex items-center justify-center gap-1.5">
            <Lock size={12} /> Confidential Officer Enforcement Record
          </span>
          <h2 className="text-xl font-bold text-slate-100 mt-2">Restricted Case Access</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            This product inspection case <span className="font-mono text-slate-300">({insp.case_number || insp.id || "LM-CASE"})</span> was conducted by an Enforcement Officer and contains internal legal metrology notes. Consumers can only view product inspections scanned by themselves.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="primary" onClick={() => window.history.back()}>
            Return to Scanned History
          </Button>
        </div>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const cno = caseId || insp?.case_number || insp?.id;
      let url = insp?.pdf_url;
      if (!url || url.includes('/undefined')) {
        url = `${ApiService.getApiBase()}/reports/case/${encodeURIComponent(cno)}/pdf`;
      } else if (url.startsWith('/api')) {
        url = url.replace('/api', ApiService.getApiBase());
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Report_${(cno || 'inspection').replace(/\//g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Derive real product name from extraction or backend
  const rawExtractedName = insp.declarations?.find(d => d.field === "product_name")?.value;
  const derivedProduct = typeof insp.product === "object" ? insp.product?.name : insp.product;
  const productName = (derivedProduct && derivedProduct !== "Packaged Commodity" && derivedProduct !== "") ? derivedProduct
    : ((rawExtractedName && rawExtractedName !== "Packaged Commodity" && rawExtractedName !== "") ? rawExtractedName
      : ((insp.product_name && insp.product_name !== "Packaged Commodity" && insp.product_name !== "") ? insp.product_name
        : "NA"));

  const caseId = insp.case_number || (typeof insp.id === "number" ? `LM/2026/${String(insp.id).padStart(6, "0")}` : (insp.id || "LM/2026/000001"));

  // Only show requirements from a real scan
  let reqs = [];
  let extractedMap = {};

  const isEcom = insp.inspection_type === "E_COMMERCE_LISTING" || 
                 insp.type === "E_COMMERCE_LISTING" || 
                 String(insp.location || "").toLowerCase().includes("listing") || 
                 String(insp.location || "").toLowerCase().includes("marketplace") ||
                 String(insp.case_number || "").includes("ECOM");

  if (insp.declarations && Array.isArray(insp.declarations) && insp.declarations.length > 0) {
    const filteredDeclarations = insp.declarations.filter(d => {
      const fieldKey = d.field || d.field_name || "";
      if (fieldKey === "product_name") return false;
      if (isEcom && fieldKey === "mfg_date") {
        const raw = d.value || d.detected_value || d.raw_text || d.text;
        const hasVal = Boolean(raw && String(raw).trim() !== "" && String(raw).toLowerCase() !== "null" && String(raw).toLowerCase() !== "none");
        if (!hasVal) return false;
      }
      return true;
    });

    reqs = filteredDeclarations.map((d, index) => {
      const fieldKey = d.field || d.field_name || `decl_${index}`;
      const fieldLabel = d.label || (typeof fieldKey === "string" ? fieldKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Declaration");
      const isExempt = d.status === "EXEMPT" || d.is_exempt === true || (isEcom && fieldKey === "mfg_date");
      const rawTextVal = d.value || d.detected_value || d.raw_text || d.text || d.detected;
      const hasValue = Boolean(rawTextVal && String(rawTextVal).trim() !== "" && String(rawTextVal).trim() !== '""' && String(rawTextVal).toLowerCase() !== "none" && String(rawTextVal).toLowerCase() !== "null");
      const isDetected = (d.detected === true || d.is_present === true) && hasValue;
      
      let statusVal = "FAIL";
      let detectedVal = "NOT DETECTED / MISSING FROM LABEL";
      let confVal = 0;
      let reasonVal = d.reason || d.remarks;

      if (isExempt) {
        statusVal = "EXEMPT";
        detectedVal = hasValue ? String(rawTextVal) : "Exempt under Rule 6(10) PCR 2011 (Digital Listing)";
        confVal = 98;
        reasonVal = reasonVal || "Exempt from mandatory digital display under Rule 6(10) Legal Metrology (PCR 2011).";
      } else if (d.status === "REVIEW" || (!isEcom && fieldKey === "country_of_origin" && !hasValue && !insp.is_imported && !insp.product?.is_imported)) {
        statusVal = "REVIEW";
        detectedVal = hasValue ? String(rawTextVal) : "Requires Verification (Rule 6(1)(f))";
        confVal = 90;
        reasonVal = reasonVal || "Exempt under Rule 6(1)(f) PCR 2011 if manufactured domestically in India; mandatory if imported.";
      } else if (isDetected || hasValue) {
        statusVal = (d.status === "COMPLIANT" || d.status === "PASS" || d.is_compliant === true) ? "PASS" : (d.status || "PASS");
        detectedVal = String(rawTextVal);
        const confNum = typeof d.confidence === "number" ? d.confidence : (typeof d.confidence_score === "number" ? d.confidence_score : 0.95);
        confVal = Math.round(confNum > 1 ? confNum : confNum * 100);
        reasonVal = reasonVal || "Verified compliant under Legal Metrology (PCR 2011)";
      } else {
        statusVal = "FAIL";
        detectedVal = "NOT DETECTED / MISSING FROM LABEL";
        confVal = 0;
        reasonVal = reasonVal || "Mandatory statutory requirement not found or illegible on package label.";
      }

      const resolvedBox = (isDetected && Array.isArray(d.bbox) && d.bbox.length === 4) ? d.bbox : null;
      const targetImageIdx = (typeof d.image_index === "number" && d.image_index > 0) ? d.image_index : 1;

      return {
        key: fieldKey,
        label: fieldLabel,
        rule: d.rule || d.rule_citation || (isExempt ? "Rule 6(10) PCR 2011" : (statusVal === "REVIEW" ? "Rule 6(1)(f) PCR 2011" : "Rule 6(1) PCR 2011")),
        status: statusVal,
        confidence: confVal,
        detected: detectedVal,
        is_present: isDetected || isExempt,
        reason: reasonVal,
        bbox: resolvedBox,
        image_index: targetImageIdx,
        image_id: d.image_id
      };
    });

    extractedMap = {};
    filteredDeclarations.forEach((d, index) => {
      const fieldKey = d.field || d.field_name || `decl_${index}`;
      const fieldLabel = d.label || (typeof fieldKey === "string" ? fieldKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : `Declaration ${index + 1}`);
      const rawVal = d.value || d.detected_value || d.raw_text || (d.status === "EXEMPT" ? "Exempt (Rule 6(10))" : (d.is_present ? "Present" : "Missing"));
      extractedMap[fieldLabel] = rawVal && String(rawVal).trim() !== "" ? rawVal : (reqs[index]?.detected || "Verified Present");
    });
  }

  const mandatoryReqs = reqs.filter((r) => r.status !== "EXEMPT");
  const passCount = reqs.filter((r) => r.status === "PASS").length;
  const failCount = reqs.filter((r) => r.status === "FAIL").length;
  const exemptCount = reqs.filter((r) => r.status === "EXEMPT").length;
  const reviewCount = reqs.filter((r) => r.status === "REVIEW").length;
  const avgConf = Math.round(reqs.reduce((s, r) => s + (r.confidence || 90), 0) / (reqs.length || 1));

  const mandatoryCount = mandatoryReqs.length;
  const passRatio = mandatoryCount > 0 ? passCount / mandatoryCount : (passCount / (reqs.length || 1));
  const computedStatus = (failCount === 0 && passCount > 0)
    ? (reviewCount > 0 ? "REVIEW" : "COMPLIANT")
    : (passRatio < 0.50 ? "NON_COMPLIANT" : (failCount > 0 ? "NON_COMPLIANT" : "REVIEW"));

  const inspectionStatus = (insp.status && insp.status !== "REVIEW" && !((insp.status === "NON_COMPLIANT" || insp.status === "NON-COMPLIANT") && failCount === 0)) ? insp.status : computedStatus;

  const extractedMfr = insp.declarations?.find(d => d.field === "manufacturer")?.value;
  const manufacturerVal = extractedMfr || insp.manufacturer || (typeof insp.product === "object" && insp.product?.category) || "Registered Food Manufacturer";
  const locationVal = insp.location || "NA";
  const dateVal = insp.created_at ? new Date(insp.created_at).toLocaleDateString("en-IN") : (insp.date || new Date().toLocaleDateString("en-IN"));

  let currentUserFullName = "NA";
  try {
    const userStr = localStorage.getItem('legallens_current_user');
    const parsedUser = userStr ? JSON.parse(userStr) : null;
    if (parsedUser) {
      currentUserFullName = parsedUser.full_name || parsedUser.name || "Authorized Officer";
    }
  } catch (e) {
    console.warn("Failed to read user name from localStorage:", e);
  }

  let inspectorVal = insp.inspector_name || insp.inspector || currentUserFullName || "NA";
  if (String(inspectorVal).trim().toLowerCase() === "deleted user") {
    inspectorVal = "Deleted User";
  } else if (Array.isArray(users) && users.length > 0) {
    if (insp.inspector_email) {
      const u = users.find(x => x.email && x.email.toLowerCase() === insp.inspector_email.toLowerCase());
      if (u?.name) inspectorVal = u.name;
    } else if (insp.inspector_badge) {
      const u = users.find(x => x.badge && x.badge.toLowerCase() === insp.inspector_badge.toLowerCase());
      if (u?.name) inspectorVal = u.name;
    }
  }

  const canvasUploadRef = useRef(null);
  const [showBoxes, setShowBoxes] = useState(true);

  // Dynamic list of unique packaging photos
  const initialPhotos = [];
  const seenUrls = new Set();

  if (insp.uploaded_images && typeof insp.uploaded_images === "object" && Object.keys(insp.uploaded_images).length > 0) {
    Object.entries(insp.uploaded_images).forEach(([key, val], idx) => {
      let url = val?.previewUrl || val?.url || (typeof val === "string" ? val : null);
      if (url && typeof url === 'string') {
        if (url.startsWith('/uploads/')) {
          url = `${ApiService.getApiBase()}${url}`;
        } else if (url.startsWith('uploads/')) {
          url = `${ApiService.getApiBase()}/${url}`;
        }
      }
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        initialPhotos.push({
          id: `photo_${idx + 1}`,
          label: `PHOTO ${initialPhotos.length + 1}`,
          url: url
        });
      }
    });
  } else if (insp.images && Array.isArray(insp.images) && insp.images.length > 0) {
    insp.images.forEach((img, idx) => {
      let url = img.url || img.image_url || img.supabase_url || img.original_path;
      if (url && typeof url === 'string') {
        if (url.startsWith('/uploads/')) {
          url = `${ApiService.getApiBase()}${url}`;
        } else if (url.startsWith('uploads/')) {
          url = `${ApiService.getApiBase()}/${url}`;
        }
      }
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        initialPhotos.push({
          id: img.id || `img_${idx + 1}`,
          label: `PHOTO ${initialPhotos.length + 1}`,
          url: url
        });
      }
    });
  }

  const MISSING_IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='100%' height='100%' fill='%230f172a'/><g transform='translate(250, 140)' stroke='%23475569' stroke-width='2' fill='none'><rect x='0' y='0' width='100' height='80' rx='8'/><circle cx='35' cy='30' r='12'/><path d='M10,70 L40,40 L65,65 L80,50 L90,70'/></g><text x='300' y='250' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14' font-weight='600'>Image File Not Found on Server</text><text x='300' y='275' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='12'>Uploaded file path is not present on disk</text></svg>";

  if (initialPhotos.length === 0) {
    initialPhotos.push(
      { id: "FRONT", label: "PHOTO 1 (FRONT)", url: MISSING_IMAGE_PLACEHOLDER }
    );
  }

  const [photosList, setPhotosList] = useState(initialPhotos);
  const [activePhotoId, setActivePhotoId] = useState(initialPhotos[0]?.id || "photo_1");
  const photoTabsScrollRef = useRef(null);

  useEffect(() => {
    if (initialPhotos.length > 0) {
      setPhotosList(initialPhotos);
      setActivePhotoId(initialPhotos[0]?.id || "photo_1");
    }
  }, [insp.id, insp.case_number, insp.images]);

  useEffect(() => {
    const activeBtn = document.getElementById(`tab_${activePhotoId}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activePhotoId]);

  const scrollPhotoTabs = (direction) => {
    if (photoTabsScrollRef.current) {
      const scrollAmount = direction === "left" ? -140 : 140;
      photoTabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleTabsWheel = (e) => {
    if (photoTabsScrollRef.current && Math.abs(e.deltaY) > 0) {
      photoTabsScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleSelectReq = (r) => {
    if (!r) {
      setHoveredReq(null);
      return;
    }
    setHoveredReq(r.key);

    if (r.bbox && r.status !== "FAIL" && typeof r.image_index === "number" && r.image_index > 0) {
      const targetIdx = r.image_index - 1;
      if (photosList[targetIdx]) {
        setActivePhotoId(photosList[targetIdx].id);
      } else if (r.image_id) {
        const found = photosList.find(p => p.id === r.image_id);
        if (found) setActivePhotoId(found.id);
      }
    }
  };

  const currentPhoto = photosList.find(p => p.id === activePhotoId) || photosList[0] || { url: MISSING_IMAGE_PLACEHOLDER, label: "PHOTO" };

  const handleAddNewPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newItems = files.map((file, i) => {
        const id = `PHOTO_${Date.now()}_${i + 1}`;
        return {
          id: id,
          label: `PHOTO ${photosList.length + i + 1} (${file.name.slice(0, 10)})`,
          url: URL.createObjectURL(file)
        };
      });
      setPhotosList((prev) => [...prev, ...newItems]);
      setActivePhotoId(newItems[0].id);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={canvasUploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleAddNewPhotos}
      />
      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.08em" }}>{caseId}</div>
            <h2 style={{ ...FONT.display, fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 2 }}>{productName}</h2>
            <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ fontSize: 12.5, color: C.slate }}>
              <span className="flex items-center gap-1.5 min-w-0 max-w-full">
                <Building2 size={13} className="flex-shrink-0" />
                <span className="truncate max-w-[320px] sm:max-w-[420px] md:max-w-[550px]" title={manufacturerVal}>{manufacturerVal}</span>
              </span>
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {locationVal}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {dateVal}</span>
              <span className="flex items-center gap-1.5"><User size={13} /> {inspectorVal}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <VerdictStamp status={inspectionStatus} caseNo={caseId} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t" style={{ borderColor: C.line }}>
          {[
            ["Mandatory Declarations", `${passCount} / ${mandatoryReqs.length || reqs.length}`, "detected & verified"],
            ["Violations", failCount, "require correction"],
            ["Exempt / Review", exemptCount > 0 ? `${exemptCount} Exempt` : reviewCount, exemptCount > 0 ? "Rule 6(10) Digital Exemption" : "needs officer review"],
            ["Overall Confidence", `${avgConf}%`, "AI extraction average"],
          ].map(([l, v, s]) => (
            <div key={l}>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, letterSpacing: "0.02em" }}>{l.toUpperCase()}</div>
              <div style={{ ...FONT.display, fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 3 }}>{v}</div>
              <div style={{ fontSize: 11, color: C.slate }}>{s}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* MULTI-ANGLE PACKAGE VISION CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-xl shadow-md" padded={false}>
          <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ScanLine size={17} style={{ color: C.gold }} />
              <span style={{ ...FONT.display, fontSize: 14.5, fontWeight: 700, color: C.ink }}>
                Package Vision Canvas ({photosList.length} Photos)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end min-w-0 max-w-full">
              <div className="relative flex items-center max-w-[360px] sm:max-w-[440px] md:max-w-[500px] min-w-0">
                {photosList.length > 3 && (
                  <button
                    type="button"
                    onClick={() => scrollPhotoTabs("left")}
                    className="p-1 rounded-l-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex-shrink-0 cursor-pointer border border-r-0 border-slate-700"
                    title="Scroll left"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}

                <div
                  ref={photoTabsScrollRef}
                  onWheel={handleTabsWheel}
                  className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/40 dark:bg-slate-950/70 border border-slate-700/40 overflow-x-auto no-scrollbar scroll-smooth"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {photosList.map((p, pIdx) => (
                    <button
                      key={p.id}
                      id={`tab_${p.id}`}
                      type="button"
                      onClick={() => setActivePhotoId(p.id)}
                      className={`ll-focus text-[11px] font-mono px-3 py-1 rounded-md transition-all whitespace-nowrap font-semibold cursor-pointer flex-shrink-0 ${
                        activePhotoId === p.id
                          ? "bg-amber-500 text-slate-950 shadow-xs font-bold ring-1 ring-amber-400"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      {p.label || `PHOTO ${pIdx + 1}`}
                    </button>
                  ))}
                </div>

                {photosList.length > 3 && (
                  <button
                    type="button"
                    onClick={() => scrollPhotoTabs("right")}
                    className="p-1 rounded-r-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex-shrink-0 cursor-pointer border border-l-0 border-slate-700"
                    title="Scroll right"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowBoxes(!showBoxes)}
                className={`ll-focus text-xs font-mono px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs flex-shrink-0 ${
                  showBoxes
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
                title="Toggle bounding box highlights"
              >
                <Eye size={12} /> {showBoxes ? "Boxes: ON" : "Boxes: OFF"}
              </button>
            </div>
          </div>

          <div className="relative min-h-[360px] max-h-[500px] w-full bg-slate-950/95 flex items-center justify-center overflow-hidden group select-none p-2">
            <div className="relative inline-block max-h-full max-w-full">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.label}
                className="max-h-[460px] max-w-full block object-contain mx-auto rounded-md shadow-lg"
                onError={(e) => {
                  if (e.target.src !== MISSING_IMAGE_PLACEHOLDER) {
                    e.target.src = MISSING_IMAGE_PLACEHOLDER;
                  }
                }}
              />

              {showBoxes && reqs.map((r, i) => {
                if (!r.bbox || !Array.isArray(r.bbox) || r.bbox.length !== 4 || r.status === "FAIL" || !r.is_present) return null;
                const isHovered = hoveredReq === r.key;

                const declPhotoIdx = (typeof r.image_index === "number" ? r.image_index : 1) - 1;
                const activePhotoIndex = photosList.findIndex(p => p.id === activePhotoId);
                const isCurrentPhotoMatch = (declPhotoIdx === activePhotoIndex);

                if (!isCurrentPhotoMatch) return null;

                const [ymin, xmin, ymax, xmax] = r.bbox;
                const top = `${ymin / 10}%`;
                const left = `${xmin / 10}%`;
                const width = `${(xmax - xmin) / 10}%`;
                const height = `${(ymax - ymin) / 10}%`;
                const isPass = r.status === "PASS";

                return (
                  <motion.div
                    key={r.key || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: isHovered ? 1.04 : 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    onMouseEnter={() => handleSelectReq(r)}
                    onMouseLeave={() => setHoveredReq(null)}
                    className={`absolute border-2 cursor-pointer rounded-sm ${isHovered
                        ? "border-amber-400 bg-amber-400/30 shadow-[0_0_25px_#F59E0B] z-30 ring-2 ring-amber-300"
                        : isPass
                          ? "border-emerald-500/70 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20 z-10"
                          : "border-red-500/80 bg-red-500/15 hover:border-red-400 hover:bg-red-500/25 z-20"
                      }`}
                    style={{ top, left, width, height }}
                  >
                    <motion.span
                      animate={isHovered ? { y: -2, scale: 1.05 } : { y: 0, scale: 1 }}
                      className={`absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold whitespace-nowrap uppercase tracking-wider ${isHovered ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30" : (isPass ? "bg-emerald-600 text-white" : "bg-red-600 text-white")
                        } shadow-md`}
                    >
                      {r.label?.split(" ")[0]} ({r.confidence}%)
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>

            {(() => {
              const hoveredItem = reqs.find(r => r.key === hoveredReq);
              const isCompliantActive = hoveredItem && hoveredItem.status === "PASS";
              const isViolationActive = hoveredItem && hoveredItem.status === "FAIL";

              return (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 pointer-events-none">
                  <span className="flex items-center gap-2 select-none">
                    <span className="flex items-center gap-1.5 transition-all duration-200"
                      style={{
                        opacity: hoveredReq ? (isCompliantActive ? 1 : 0.35) : 1,
                        transform: isCompliantActive ? "scale(1.05)" : "scale(1)"
                      }}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ${isCompliantActive ? 'shadow-[0_0_8px_#10B981]' : ''}`} />
                      <span className={isCompliantActive ? 'text-emerald-400 font-bold' : ''}>Compliant</span>
                    </span>

                    <span className="flex items-center gap-1.5 transition-all duration-200 ml-3"
                      style={{
                        opacity: hoveredReq ? (isViolationActive ? 1 : 0.35) : 1,
                        transform: isViolationActive ? "scale(1.05)" : "scale(1)"
                      }}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-red-500 inline-block ${isViolationActive ? 'shadow-[0_0_8px_#EF4444]' : ''}`} />
                      <span className={isViolationActive ? 'text-red-400 font-bold' : ''}>Violation</span>
                    </span>
                  </span>
                  <span className="text-amber-400 font-semibold transition-all duration-200">
                    {hoveredReq ? `Inspecting: ${hoveredItem?.label || ''}` : "Hover any box or table row"}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="p-3 border-t bg-slate-950/90 flex items-center gap-2.5 overflow-x-auto select-none" style={{ borderColor: C.line }}>
            <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1 font-bold">
              Photos ({photosList.length}):
            </span>
            {photosList.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setActivePhotoId(p.id)}
                className={`relative flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${activePhotoId === p.id
                    ? "border-amber-400 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500"
                  }`}
                title={p.label}
              >
                <img
                  src={p.url}
                  alt={p.label}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.target.src !== MISSING_IMAGE_PLACEHOLDER) {
                      e.target.src = MISSING_IMAGE_PLACEHOLDER;
                    }
                  }}
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center text-slate-200 truncate px-0.5 font-semibold">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Live OCR Vision Terminal Stream */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden shadow-md h-[580px] border rounded-xl transition-all" style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-charcoal)" }}>
          <div className="p-3.5 bg-slate-950 text-slate-200 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span style={{ ...FONT.mono, fontSize: 11.5, fontWeight: 700 }} className="text-amber-400">
                EasyOCR Neural Stream
              </span>
            </div>

            <button
              onClick={() => {
                const rawJson = JSON.stringify(reqs.map(r => ({ label: r.label, text: r.detected, rule: r.rule, confidence: r.confidence, bbox: r.bbox, status: r.status })), null, 2);
                navigator.clipboard.writeText(rawJson);
                alert("Copied raw OCR bounding box JSON to clipboard!");
              }}
              className="ll-focus px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10.5px] font-mono text-amber-300 border border-slate-700 transition-all flex items-center gap-1"
            >
              <Code size={11} /> Copy JSON
            </button>
          </div>

          <div className="p-3.5 bg-slate-950/95 text-[11px] font-mono text-slate-300 space-y-2 flex-1 min-h-0 overflow-y-auto select-text">
            <div className="text-emerald-400 font-medium">➜ [STREAM] Res: 1000×1000 normalized grid</div>
            {reqs.map((r, i) => {
              const isPass = r.status === "PASS";
              const isHovered = hoveredReq === r.key;
              return (
                <div
                  key={r.key || i}
                  onMouseEnter={() => handleSelectReq(r)}
                  onMouseLeave={() => setHoveredReq(null)}
                  onClick={() => handleSelectReq(r)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${isHovered
                      ? "bg-slate-900 border-amber-400/80 text-white shadow-md shadow-amber-500/10 -translate-y-[1px]"
                      : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                >
                  <div className="text-[11px] font-bold text-amber-400/90 tracking-wide">
                    {r.label}
                  </div>
                  <div className="text-slate-200 font-mono text-[11px] bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex items-center gap-2">
                    <span className="text-emerald-400/80 font-bold select-none">➜</span>
                    <span className="font-medium truncate">{r.detected}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>{r.rule}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-amber-400/80 font-semibold">{r.confidence}% conf</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-wider ${
                          r.status === 'PASS'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : r.status === 'EXEMPT'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10.5px] font-mono text-amber-400 flex items-center justify-between">
            <span>✓ PCR 2011 Rule Matrix: {reqs.length} Checks</span>
            <span className="font-bold">{inspectionStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-x-auto rounded-xl" padded={false}>
          <div className="p-5 pb-0"><SectionLabel eyebrow="RULE-BY-RULE" title="Compliance Checklist" /></div>
          <table className="w-full" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em", background: "var(--ll-table-head-bg)" }}>
                {["REQUIREMENT", "RULE", "STATUS", "CONFIDENCE", ""].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: C.line }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reqs.map((r) => (
                <tr
                  key={r.key}
                  onMouseEnter={() => handleSelectReq(r)}
                  onMouseLeave={() => setHoveredReq(null)}
                  onClick={() => handleSelectReq(r)}
                  className={`ll-tr transition-all cursor-pointer ${hoveredReq === r.key ? 'bg-amber-500/10' : ''}`}
                >
                  <td className="px-5 py-3.5 border-b font-semibold" style={{ borderColor: C.line }}>{r.label}</td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line, ...FONT.mono, fontSize: 11.5, color: C.gold, fontWeight: 700 }}>{r.rule}</td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}><ReqStatusChip status={r.status} /></td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line, color: C.charcoal, fontWeight: 600 }}>{r.confidence}%</td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}>
                    <button onClick={() => setEvidenceReq(r)} className="ll-focus inline-flex items-center gap-1 cursor-pointer font-bold text-xs hover:scale-105 transition-transform" style={{ color: C.ink }}>
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionLabel eyebrow="EXTRACTED" title="Structured Declaration" />
            <dl className="space-y-2.5">
              {Object.entries(extractedMap).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 pb-2 border-b" style={{ borderColor: C.line }}>
                  <dt style={{ fontSize: 11.5, color: C.slate, flexShrink: 0 }}>{k}</dt>
                  <dd style={{ fontSize: 12, color: C.ink, fontWeight: 600, textAlign: "right" }}>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {isConsumer ? (
            <Card>
              <SectionLabel eyebrow="CITIZEN ACTION" title="Report Violation / Grievance" />
              <p style={{ fontSize: 11.5, color: C.slate, lineHeight: 1.5, marginBottom: 12 }}>
                Notice missing declarations, MRP overcharging, or unreadable details? You can lodge a formal consumer grievance directly to the Legal Metrology Department.
              </p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowGrievanceModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>⚖</span> File Consumer Grievance →
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <SectionLabel eyebrow="ACCOUNTABILITY" title="Officer Determination" />
              <p style={{ fontSize: 11.5, color: C.slate, lineHeight: 1.5, marginBottom: 10 }}>
                The finding above is AI-assisted. Confirm, override, or flag for further review before it becomes the final determination.
              </p>
              <textarea style={{ ...inputStyle, minHeight: 60, marginBottom: 12 }} placeholder="Officer remarks…" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText size={13} /> Generate Official PDF
                    </>
                  )}
                </Button>
                <Button size="sm" variant="ghost">Save Draft</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <EvidenceModal requirement={evidenceReq} onClose={() => setEvidenceReq(null)} />
      <ConsumerGrievanceModal
        open={showGrievanceModal}
        onClose={() => setShowGrievanceModal(false)}
        inspection={insp}
        currentUser={currentUser}
        onSubmitGrievance={onSubmitGrievance}
      />
    </div>
  );
}
