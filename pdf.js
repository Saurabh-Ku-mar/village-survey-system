class PDFGenerator {
    constructor() {
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margin = 10;
        this.lineHeight = 7;
    }

    // Generate PDF for single member
    async generateMemberPDF(memberId) {
        const member = await db.getMember(memberId);
        const house = await db.getHouse(member.houseId);
        const village = await db.getVillage(house.villageId);

        const doc = new jsPDFCompat('p', 'mm', 'A4');
        let y = this.margin;

        // Header
        doc.setFontSize(16);
        doc.text('Member Details Report', this.margin, y);
        y += 10;

        // Member Info
        doc.setFontSize(10);
        this.addLine(doc, `Full Name: ${member.fullName}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Father/Husband Name: ${member.fatherName}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Date of Birth: ${member.dob}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Age: ${member.age} years`, y);
        y += this.lineHeight;
        this.addLine(doc, `Gender: ${member.gender}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Marital Status: ${member.maritalStatus}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Education: ${member.education}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Occupation: ${member.occupation}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Mobile: ${member.mobile || 'N/A'}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Disability: ${member.disability ? 'Yes' : 'No'}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Caste Category: ${member.caste}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Voter ID Available: ${member.voterId ? 'Yes' : 'No'}`, y);
        y += this.lineHeight;

        if (member.aadhaarVerified) {
            this.addLine(doc, `Aadhaar Last 4 Digits: ${member.aadhaarLast4}`, y);
            y += this.lineHeight;
        }

        y += 5;
        doc.setFontSize(10);
        this.addLine(doc, `Family ID: ${member.familyId}`, y);
        y += this.lineHeight;
        this.addLine(doc, `House Number: ${house.houseNumber}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Village: ${village.name}`, y);
        y += this.lineHeight;

        if (member.notes) {
            y += 5;
            doc.setFontSize(10);
            this.addLine(doc, `Notes:`, y);
            y += this.lineHeight;
            const wrappedNotes = doc.splitTextToSize(member.notes, this.pageWidth - 2 * this.margin);
            doc.text(wrappedNotes, this.margin + 2, y);
        }

        const filename = `${member.fullName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        doc.save(filename);
    }

    // Generate PDF for single family/house
    async generateHousePDF(houseId) {
        const house = await db.getHouse(houseId);
        const village = await db.getVillage(house.villageId);
        const members = await db.getMembersByHouse(houseId);

        const doc = new jsPDFCompat('p', 'mm', 'A4');
        let y = this.margin;

        // Header
        doc.setFontSize(16);
        doc.text('Family Report', this.margin, y);
        y += 10;

        // House Info
        doc.setFontSize(10);
        this.addLine(doc, `Family ID: ${house.familyId}`, y);
        y += this.lineHeight;
        this.addLine(doc, `House Number: ${house.houseNumber}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Village: ${village.name}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Head of Family: ${house.headName}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Mobile: ${house.headMobile || 'N/A'}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Caste Category: ${house.casteCategory}`, y);
        y += this.lineHeight;
        this.addLine(doc, `House Type: ${house.houseType}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Toilet Available: ${house.toilet ? 'Yes' : 'No'}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Drinking Water: ${house.drinkingWater}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Electricity: ${house.electricity ? 'Yes' : 'No'}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Total Members: ${members.length}`, y);
        y += this.lineHeight;

        y += 10;
        doc.setFontSize(12);
        doc.text('Family Members', this.margin, y);
        y += 8;

        // Members table
        doc.setFontSize(9);
        const tableData = members.map((member, index) => [
            index + 1,
            member.fullName,
            member.age,
            member.gender,
            member.relation || 'Family Member'
        ]);

        this.drawTable(doc, this.margin, y, 
            ['#', 'Name', 'Age', 'Gender', 'Relation'],
            tableData);

        const filename = `Family_${house.houseNumber}_${Date.now()}.pdf`;
        doc.save(filename);
    }

    // Generate PDF for entire village
    async generateVillagePDF(villageId) {
        const village = await db.getVillage(villageId);
        const houses = await db.getHousesByVillage(villageId);
        const allMembers = await db.getMembers();
        const members = allMembers.filter(m => {
            const house = houses.find(h => h.id === m.houseId);
            return !!house;
        });

        const doc = new jsPDFCompat('p', 'mm', 'A4');
        let y = this.margin;

        // Header
        doc.setFontSize(16);
        doc.text(`Village Survey Report - ${village.name}`, this.margin, y);
        y += 10;

        // Summary
        doc.setFontSize(10);
        this.addLine(doc, `Total Houses: ${houses.length}`, y);
        y += this.lineHeight;
        this.addLine(doc, `Total Members: ${members.length}`, y);
        y += this.lineHeight;

        const maleCount = members.filter(m => m.gender === 'Male').length;
        const femaleCount = members.filter(m => m.gender === 'Female').length;
        this.addLine(doc, `Males: ${maleCount}, Females: ${femaleCount}`, y);
        y += this.lineHeight + 5;

        // House table
        doc.setFontSize(10);
        doc.text('Houses in Village', this.margin, y);
        y += 8;

        doc.setFontSize(9);
        const houseData = houses.map(house => {
            const houseMemberCount = members.filter(m => m.houseId === house.id).length;
            return [
                house.houseNumber,
                house.headName,
                houseMemberCount,
                house.casteCategory,
                house.houseType
            ];
        });

        this.drawTable(doc, this.margin, y, 
            ['House #', 'Head Name', 'Members', 'Caste', 'Type'],
            houseData);

        const filename = `Village_${village.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        doc.save(filename);
    }

    // Generate PDF for filtered results
    async generateFilteredPDF(members, filterName = 'Filtered') {
        const doc = new jsPDFCompat('p', 'mm', 'A4');
        let y = this.margin;

        // Header
        doc.setFontSize(16);
        doc.text(`${filterName} Results Report`, this.margin, y);
        y += 10;

        // Summary
        doc.setFontSize(10);
        this.addLine(doc, `Total Records: ${members.length}`, y);
        y += this.lineHeight + 5;

        // Table
        doc.setFontSize(9);
        const tableData = members.map(member => [
            member.fullName,
            member.age,
            member.gender,
            member.caste,
            member.occupation || 'N/A'
        ]);

        this.drawTable(doc, this.margin, y,
            ['Name', 'Age', 'Gender', 'Caste', 'Occupation'],
            tableData);

        const filename = `${filterName}_${Date.now()}.pdf`;
        doc.save(filename);
    }

    // Helper: Add a line of text
    addLine(doc, text, y) {
        const maxWidth = this.pageWidth - 2 * this.margin;
        const wrapped = doc.splitTextToSize(text, maxWidth);
        doc.text(wrapped, this.margin, y);
        return wrapped.length * this.lineHeight;
    }

    // Helper: Draw a table
    drawTable(doc, startX, startY, headers, data) {
        const colWidth = (this.pageWidth - 2 * this.margin) / headers.length;
        let y = startY;

        // Draw headers
        doc.setFillColor(200, 200, 200);
        headers.forEach((header, i) => {
            doc.rect(startX + i * colWidth, y, colWidth, 6, 'F');
            doc.text(header, startX + i * colWidth + 1, y + 4);
        });

        y += 6;

        // Draw data rows
        data.forEach(row => {
            row.forEach((cell, i) => {
                doc.text(String(cell), startX + i * colWidth + 1, y + 4);
            });
            doc.setDrawColor(200, 200, 200);
            doc.line(startX, y + 6, startX + this.pageWidth - 2 * this.margin, y + 6);
            y += 6;

            // Check if we need a new page
            if (y > this.pageHeight - 20) {
                doc.addPage();
                y = this.margin;
            }
        });
    }
}

// Simple jsPDF compatibility (lightweight alternative)
class jsPDFCompat {
    constructor(orientation = 'p', unit = 'mm', format = 'A4') {
        this.orientation = orientation;
        this.unit = unit;
        this.format = format;
        this.width = 210;
        this.height = 297;
        this.pages = [];
        this.currentPage = 0;
        this.fontSize = 12;
        this.text_color = '#000000';
        this.addPage();
    }

    addPage() {
        this.pages.push([]);
        this.currentPage = this.pages.length - 1;
    }

    setFontSize(size) {
        this.fontSize = size;
        return this;
    }

    setFillColor(r, g, b) {
        this.fill_color = `rgb(${r},${g},${b})`;
        return this;
    }

    setDrawColor(r, g, b) {
        this.draw_color = `rgb(${r},${g},${b})`;
        return this;
    }

    setTextColor(r, g, b) {
        if (typeof r === 'string') {
            this.text_color = r;
        } else {
            this.text_color = `rgb(${r},${g},${b})`;
        }
        return this;
    }

    text(text, x, y) {
        this.pages[this.currentPage].push({
            type: 'text',
            text: text,
            x: x,
            y: y,
            fontSize: this.fontSize,
            color: this.text_color
        });
        return this;
    }

    rect(x, y, w, h, style = 'S') {
        this.pages[this.currentPage].push({
            type: 'rect',
            x: x,
            y: y,
            w: w,
            h: h,
            style: style,
            fillColor: this.fill_color,
            drawColor: this.draw_color
        });
        return this;
    }

    line(x1, y1, x2, y2) {
        this.pages[this.currentPage].push({
            type: 'line',
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            color: this.draw_color
        });
        return this;
    }

    splitTextToSize(text, maxWidth) {
        const words = String(text).split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if (currentLine.length + word.length > 30) {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine += (currentLine ? ' ' : '') + word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    save(filename) {
        // Create HTML table version for printing
        let htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; }
                    h1 { text-align: center; }
                </style>
            </head>
            <body>
        `;

        // Reconstruct content from pages
        this.pages.forEach((page, pageIdx) => {
            if (pageIdx > 0) htmlContent += '<div style="page-break-before: always;"></div>';
            page.forEach(element => {
                if (element.type === 'text') {
                    htmlContent += `<p style="font-size: ${element.fontSize}px; color: ${element.color};">`;
                    if (Array.isArray(element.text)) {
                        htmlContent += element.text.join('<br>');
                    } else {
                        htmlContent += element.text;
                    }
                    htmlContent += '</p>';
                }
            });
        });

        htmlContent += '</body></html>';

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.pdf', '.html');
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global PDF generator instance
const pdfGenerator = new PDFGenerator();
