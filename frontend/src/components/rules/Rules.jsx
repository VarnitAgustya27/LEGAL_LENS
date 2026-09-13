import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { C, RULES, CATEGORIES, inputStyle } from "../../constants.jsx";
import { Card, SectionLabel, Button } from "../common/UIComponents.jsx";
import RuleBookPanel from "../rulebook/RuleBookPanel.jsx";

export default function Rules() {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 12.5, color: C.slate, maxWidth: 520 }}>
          Rules are versioned so amendments to the Packaged Commodities Rules can be added without changing application code. The deterministic engine always evaluates against the currently active version.
        </p>
        <Button onClick={() => setShowAdd(true)}><Plus size={15} /> Add Rule</Button>
      </div>

      <RuleBookPanel rules={RULES} />

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xs" style={{ background: "var(--ll-modal-overlay)" }} onClick={() => setShowAdd(false)}>
          <Card className="ll-rise max-w-lg w-full rounded-2xl shadow-2xl">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <SectionLabel eyebrow="RULE REPOSITORY" title="Add New Rule Version" />
                <button onClick={() => setShowAdd(false)} className="ll-focus p-1 rounded-full text-slate-400 hover:text-slate-200"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <div className="block mb-4"><div className="text-xs font-semibold text-slate-400 mb-1">Rule Code</div><input style={inputStyle} placeholder="e.g. PCR-MRP-001" /></div>
                <div className="block mb-4"><div className="text-xs font-semibold text-slate-400 mb-1">Severity</div><select style={inputStyle}><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></div>
                <div className="block mb-4"><div className="text-xs font-semibold text-slate-400 mb-1">Rule Name</div><input style={inputStyle} placeholder="Short descriptive name" /></div>
                <div className="block mb-4"><div className="text-xs font-semibold text-slate-400 mb-1">Version</div><input style={inputStyle} placeholder="e.g. 2026.2" /></div>
                <div className="block mb-4"><div className="text-xs font-semibold text-slate-400 mb-1">Effective From</div><input style={inputStyle} type="date" /></div>
                <div className="block mb-4"><div className="text-xs font-semibold text-slate-400 mb-1">Applicable Category</div><select style={inputStyle}><option>All Categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="block mb-4"><div className="text-xs font-semibold text-slate-400 mb-1">Description & Source</div><textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Legal text reference / gazette citation" /></div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t" style={{ borderColor: C.line }}>
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={() => setShowAdd(false)}>Save Rule</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
