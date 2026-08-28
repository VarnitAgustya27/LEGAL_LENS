import os
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class InspectionReportGenerator:
    @staticmethod
    def generate_pdf(inspection_data: Dict[str, Any], output_path: str) -> str:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#132238'),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#5B6470'),
            alignment=1
        )
        h2_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#132238'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#22252A')
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#5B6470')
        )

        # Header
        story.append(Paragraph("GOVERNMENT OF INDIA", subtitle_style))
        story.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", subtitle_style))
        story.append(Paragraph("LEGAL METROLOGY DIVISION ? ENFORCEMENT WING", subtitle_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph("PRELIMINARY COMPLIANCE INSPECTION REPORT", title_style))
        story.append(Paragraph("Packaged Commodities Rules (PCR), 2011 Compliance Screening", subtitle_style))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#132238'), spaceAfter=12))

        # Case Metadata Block
        case_no = inspection_data.get("case_number", "LM/2026/000000")
        score = inspection_data.get("score", 0.0)
        status = inspection_data.get("status", "REVIEW")
        date_str = inspection_data.get("created_at", datetime.now().strftime("%d %B %Y, %H:%M"))
        inspector = inspection_data.get("inspector_name", "Authorized Enforcement Inspector")
        product = inspection_data.get("product_name", "Packaged Product")
        category = inspection_data.get("category", "Packaged Commodity")
        is_imported = "Yes" if inspection_data.get("is_imported") else "No (Domestic)"

        status_color = colors.HexColor('#3A6B35') if status == 'COMPLIANT' else colors.HexColor('#9B2C2C') if status == 'NON_COMPLIANT' else colors.HexColor('#966A16')

        meta_data = [
            [Paragraph("<b>Inspection ID:</b>", body_style), Paragraph(case_no, body_style), Paragraph("<b>Date / Time:</b>", body_style), Paragraph(str(date_str), body_style)],
            [Paragraph("<b>Product Name:</b>", body_style), Paragraph(product, body_style), Paragraph("<b>Category:</b>", body_style), Paragraph(category, body_style)],
            [Paragraph("<b>Inspector:</b>", body_style), Paragraph(inspector, body_style), Paragraph("<b>Imported:</b>", body_style), Paragraph(is_imported, body_style)],
            [Paragraph("<b>Screening Status:</b>", body_style), Paragraph(f"<b><font color='{status_color.hexval()}'>{status}</font></b>", body_style), Paragraph("<b>Compliance Score:</b>", body_style), Paragraph(f"<b>{score}%</b>", body_style)]
        ]

        t_meta = Table(meta_data, colWidths=[1.3*inch, 2.2*inch, 1.2*inch, 2.3*inch])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F4F2EC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#DAD4C2')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DAD4C2')),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 14))

        # Declarations Summary Table
        story.append(Paragraph("1. MANDATORY DECLARATIONS AUDIT MATRIX", h2_style))
        decl_rows = [[
            Paragraph("<b>Rule Reference</b>", body_style),
            Paragraph("<b>Mandatory Declaration</b>", body_style),
            Paragraph("<b>Extracted Value</b>", body_style),
            Paragraph("<b>AI Conf.</b>", body_style),
            Paragraph("<b>Status</b>", body_style)
        ]]

        evals = inspection_data.get("evaluations", [])
        for ev in evals:
            ev_status = ev.get("status", "PASS")
            st_color = '#3A6B35' if ev_status == 'PASS' else '#9B2C2C' if ev_status == 'FAIL' else '#966A16'
            conf_str = f"{int(ev.get('confidence', 0.9)*100)}%"
            val_str = ev.get("detected", ev.get("message", "Detected"))
            if len(val_str) > 40:
                val_str = val_str[:38] + "..."
            decl_rows.append([
                Paragraph(ev.get("statutory_reference", "PCR 2011"), body_style),
                Paragraph(ev.get("label", ev.get("field")), body_style),
                Paragraph(val_str, body_style),
                Paragraph(conf_str, body_style),
                Paragraph(f"<b><font color='{st_color}'>{ev_status}</font></b>", body_style)
            ])

        t_decl = Table(decl_rows, colWidths=[1.4*inch, 1.8*inch, 2.2*inch, 0.7*inch, 0.9*inch])
        t_decl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#132238')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#DAD4C2')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DAD4C2')),
            ('PADDING', (0,1), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t_decl)
        story.append(Spacer(1, 14))

        # Violations & Potential Non-Compliances
        violations = inspection_data.get("violations", [])
        story.append(Paragraph(f"2. POTENTIAL NON-COMPLIANCES & OBSERVATIONS ({len(violations)} Flagged)", h2_style))

        if not violations:
            story.append(Paragraph("<b>No statutory violations detected during automated screening.</b>", body_style))
        else:
            viol_rows = [[
                Paragraph("<b>Severity</b>", body_style),
                Paragraph("<b>Rule & Field</b>", body_style),
                Paragraph("<b>Finding & Statutory Reason</b>", body_style),
                Paragraph("<b>Action Required</b>", body_style)
            ]]
            for v in violations:
                sev = v.get("severity", "HIGH")
                sev_color = '#9B2C2C' if sev == 'HIGH' else '#966A16' if sev == 'MEDIUM' else '#5B6470'
                viol_rows.append([
                    Paragraph(f"<b><font color='{sev_color}'>{sev}</font></b>", body_style),
                    Paragraph(f"<b>{v.get('rule_code', '')}</b><br/>{v.get('field', '')}", body_style),
                    Paragraph(v.get("message", ""), body_style),
                    Paragraph("Inspector Physical Verification", body_style)
                ])

            t_viol = Table(viol_rows, colWidths=[0.9*inch, 1.3*inch, 3.3*inch, 1.5*inch])
            t_viol.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EAE6DA')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#DAD4C2')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DAD4C2')),
                ('PADDING', (0,0), (-1,-1), 4),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ]))
            story.append(t_viol)

        story.append(Spacer(1, 18))

        # Sign-off Block & Disclaimer
        sign_block = [
            [Paragraph("<b>Enforcement Inspector Signature:</b> ___________________", body_style),
             Paragraph("<b>Verified Date:</b> ___________________", body_style)],
            [Paragraph("<b>Badge / ID No:</b> ___________________", body_style),
             Paragraph("<b>Official Seal:</b> [                              ]", body_style)]
        ]
        t_sign = Table(sign_block, colWidths=[3.5*inch, 3.5*inch])
        t_sign.setStyle(TableStyle([('PADDING', (0,0), (-1,-1), 6)]))
        story.append(KeepTogether([t_sign]))

        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#DAD4C2'), spaceAfter=8))
        story.append(Paragraph(
            "<b>STATUTORY DISCLAIMER (LEGAL METROLOGY ACT, 2009):</b> This report is generated by Legal-Lens as an assistive preliminary compliance screening tool. AI confidence scores and bounding boxes are evidentiary aids. Final legal determination, compounding, or prosecution requires physical inspection and formal validation by an authorized Legal Metrology Officer under Section 15 & 18 of the Legal Metrology Act, 2009.",
            disclaimer_style
        ))

        doc.build(story)
        return output_path
