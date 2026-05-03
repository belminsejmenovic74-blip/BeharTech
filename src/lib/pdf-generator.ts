import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Generates a PDF from a DOM element and triggers a download.
 * @param element The DOM element to capture.
 * @param filename The name of the file to save.
 */
export async function generatePdfFromElement(element: HTMLElement, filename: string) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      onclone: (clonedDoc) => {
        // Fix for "oklab" / "oklch" unsupported color functions in html2canvas
        // This scans the cloned document and removes modern color functions that cause crashes
        const elements = clonedDoc.querySelectorAll("*");
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            // Check computed styles and inline styles for oklab/oklch
            const style = window.getComputedStyle(htmlEl);
            for (let i = 0; i < style.length; i++) {
              const prop = style[i];
              const value = style.getPropertyValue(prop);
              if (value.includes("okl")) {
                htmlEl.style.setProperty(prop, "#888888", "important");
              }
            }
          }
        });

        // Specifically target CSS variables that might contain oklch
        const root = clonedDoc.documentElement;
        if (root) {
          const computed = window.getComputedStyle(root);
          // Common Tailwind variables
          const vars = ["--primary", "--secondary", "--accent", "--muted", "--background", "--foreground"];
          vars.forEach((v) => {
            const val = computed.getPropertyValue(v);
            if (val.includes("okl")) {
              root.style.setProperty(v, "#000000");
            }
          });
        }
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    let heightLeft = pdfHeight - pageHeight;
    let position = -pageHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
