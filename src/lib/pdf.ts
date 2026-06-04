import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ACADEMY_NAME,
  CENTER_NAME,
  CENTER_LOCATION,
  CONTACT_PHONE,
  WEBSITE_URL,
  DOCUMENTS,
} from "./constants";

export type ApplicationRow = Record<string, any>;

export function downloadReceipt(app: ApplicationRow) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(26, 60, 110);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${ACADEMY_NAME} — ${CENTER_NAME}`, pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${CENTER_LOCATION} | Contact: ${CONTACT_PHONE} | ${WEBSITE_URL}`,
    pageWidth / 2, 20, { align: "center" },
  );

  // Title
  doc.setTextColor(26, 60, 110);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Admission Registration Receipt", pageWidth / 2, 40, { align: "center" });

  // App ID box
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.6);
  doc.rect(14, 46, pageWidth - 28, 14);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Application ID: ${app.application_id}`, 18, 55);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Submitted: ${new Date(app.created_at).toLocaleString("en-IN")}`,
    pageWidth - 18,
    55,
    { align: "right" },
  );

  const collegePrefs: string[] = Array.isArray(app.college_preferences)
    ? app.college_preferences
    : [];
  const branchPrefs: string[] = Array.isArray(app.branch_preferences)
    ? app.branch_preferences
    : [];

  const rows: [string, string][] = [
    ["Full Name", app.full_name],
    ["Father's Name", app.father_name],
    ["Mother's Name", app.mother_name],
    ["Gender", app.gender],
    ["Date of Birth", app.dob],
    ["Category", app.category],
    ["Aadhaar No.", app.aadhaar_number],
    ["Mobile", app.mobile],
    ["Alternate Mobile", app.alternate_mobile || "-"],
    ["Email", app.email],
    ["Address", `${app.address}, ${app.district}, ${app.state} - ${app.pincode}`],
    ["10th Board / %", `${app.tenth_board || "-"} / ${app.tenth_percentage || "-"} (${app.tenth_year || "-"})`],
    ["12th Board / %", `${app.twelfth_board || "-"} / ${app.twelfth_percentage || "-"} (${app.twelfth_year || "-"})`],
    ["12th Stream", app.twelfth_stream || "-"],
    ["PCM/PCB %", app.pcm_pcb_percentage || "-"],
    ["Gap Year", app.gap_year || "-"],
    ["Selected Stream", app.stream],
    ["City Preference", app.city_preference || "-"],
    ["College Preferences",
      collegePrefs.length
        ? collegePrefs.map((c, i) => `${i + 1}. ${c}`).join("\n")
        : app.college_name || "-"],
    ["Branch Preferences",
      branchPrefs.length
        ? branchPrefs.map((b, i) => `${i + 1}. ${b}`).join("\n")
        : app.branch_name || "-"],
    ["Service Selected", app.service_selected || "-"],
    ["Scholarship", app.scholarship_details || "-"],
    ["Status", String(app.status).toUpperCase()],
  ];

  autoTable(doc, {
    startY: 66,
    head: [["Field", "Details"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [26, 60, 110], textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
    margin: { left: 14, right: 14 },
  });

  // Documents checklist table
  const docStatus = (app.documents_status ?? {}) as Record<string, boolean>;
  const docRows = DOCUMENTS.map((d) => [
    d.label,
    docStatus[d.key] ? "Present" : "Missing",
  ]);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Document", "Status"]],
    body: docRows,
    theme: "grid",
    headStyles: { fillColor: [26, 60, 110], textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 1) {
        if (data.cell.raw === "Present") {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [153, 27, 27];
        }
      }
    },
    columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: "auto" } },
    margin: { left: 14, right: 14 },
  });

  // Declaration / T&C
  doc.addPage();
  doc.setFontSize(13);
  doc.setTextColor(26, 60, 110);
  doc.setFont("helvetica", "bold");
  doc.text("Declaration & Consent", pageWidth / 2, 16, { align: "center" });

  const declaration =
    "I have submitted the required original documents and/or verified photocopies for my ward's admission process. I have been properly informed and explained about the admission procedure, college selection, CAP process, merit system, category rules, document verification, government regulations, and seat availability. I hereby confirm that I am giving consent for my ward's admission process after making proper inquiries, without any misunderstanding, pressure, or coercion of any kind.";

  const terms = [
    "1. The Admission Counseling Center only provides Career Guidance, Documentation Support, and Admission Process Assistance services.",
    "2. The admission process depends on the student's marks, merit, category, CAP rounds, government rules, and seat availability.",
    "3. No guarantee has been provided regarding admission into any specific college.",
    "4. The admission process will be carried out according to the availability of seats based on the TOP College Preferences provided by the student/parent.",
    "5. Registration, Documentation, Processing, and Counseling Charges paid for the admission process are non-refundable once the process has started under any circumstances.",
    "6. If the student or parent voluntarily cancels the admission process, the amount paid will not be refunded. Cancellation may attract Administrative Charges up to Rs.5000.",
    "7. Original documents may be temporarily retained for Provisional Admission / Seat Booking purposes and will be returned during College Confirmation Reporting.",
    "8. Guidance and assistance related to Form Registration and FC Center / ARC Center processes will be provided through the Counseling Center.",
    "9. In case of any dispute, efforts will be made to resolve the matter mutually through discussion and as per applicable law.",
    "10. The consultancy does not engage in any illegal admission process, donation-based admission, or any process against government rules and regulations.",
    "11. After carefully considering the best interests of my ward, I voluntarily grant permission to proceed with the admission process.",
    "12. No private agent, relative, or third party will interfere in my ward's admission process.",
    "13. I have read and understood this declaration and voluntarily grant my consent for the admission process.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const declLines = doc.splitTextToSize(declaration, pageWidth - 28);
  doc.text(declLines, 14, 24);
  let y = 24 + declLines.length * 4 + 4;

  doc.setFont("helvetica", "bold");
  doc.text("Terms & Conditions:", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  terms.forEach((t) => {
    const lines = doc.splitTextToSize(t, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 1;
  });

  // Signatures
  autoTable(doc, {
    startY: y + 4,
    head: [["Field", "Name"]],
    body: [
      ["Parent / Guardian", app.parent_signature_name || "-"],
      ["Student", app.full_name || "-"],
      ["Witness", app.witness_name || "-"],
      ["Consultant In-charge", "YCC Education"],
      [
        "Date",
        app.terms_accepted_at
          ? new Date(app.terms_accepted_at).toLocaleString("en-IN")
          : new Date(app.created_at).toLocaleDateString("en-IN"),
      ],
      ["Terms Accepted", app.terms_accepted ? "YES" : "NO"],
    ],
    theme: "grid",
    headStyles: { fillColor: [26, 60, 110], textColor: 255 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "Your application is under processing. You will receive further updates soon.",
    14,
    finalY,
  );
  doc.text(`Thank you, ${CENTER_NAME}, ${CENTER_LOCATION}.`, 14, finalY + 6);

  doc.save(`YCC-Receipt-${app.application_id}.pdf`);
}

export async function exportApplicationsToExcel(rows: ApplicationRow[]) {
  const XLSX = await import("xlsx");
  const flat = rows.map((r) => ({
    ...r,
    college_preferences: Array.isArray(r.college_preferences)
      ? r.college_preferences.join(" | ")
      : r.college_preferences,
    branch_preferences: Array.isArray(r.branch_preferences)
      ? r.branch_preferences.join(" | ")
      : r.branch_preferences,
    documents_status:
      r.documents_status && typeof r.documents_status === "object"
        ? Object.entries(r.documents_status)
            .filter(([_, v]) => v)
            .map(([k]) => k)
            .join(", ")
        : "",
  }));
  const sheet = XLSX.utils.json_to_sheet(flat);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Applications");
  XLSX.writeFile(wb, `YCC-Applications-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
