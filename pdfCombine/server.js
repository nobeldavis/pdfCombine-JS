document.getElementById('pdfFiles').addEventListener('change', handleFileSelect);
document.getElementById('combinePDFs').addEventListener('click', combinePDFs);

let pdfFiles = [];
const pdfList = document.getElementById('pdfList');

// Initialize Sortable once
const sortable = new Sortable(pdfList, {
    animation: 150,
    onEnd: (event) => {
        const oldIndex = event.oldIndex;
        const newIndex = event.newIndex;
        const movedItem = pdfFiles.splice(oldIndex, 1)[0];
        pdfFiles.splice(newIndex, 0, movedItem);
        updateFileList();
    },
    touchStartThreshold: 5,
    forceFallback: true,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
});

function handleFileSelect(event) {
    const newFiles = Array.from(event.target.files);

    // Error handling: Check for non-PDF files
    for (const file of newFiles) {
        if (file.type !== 'application/pdf') {
            alert(`${file.name} is not a PDF file. Only PDF files are allowed.`);
            return;
        }
    }

    // Append new files to the existing list
    pdfFiles = pdfFiles.concat(newFiles);
    updateFileList();

    // Clear the input value to allow the same files to be selected again
    event.target.value = '';
}

function updateFileList() {
    pdfList.innerHTML = '';

    pdfFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = file.name;
        li.setAttribute('data-index', index);
        pdfList.appendChild(li);
    });
}

async function combinePDFs() {
    if (pdfFiles.length === 0) {
        alert('Please select at least one PDF file.');
        return;
    }

    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    progressContainer.style.display = 'block';
    progressFill.style.width = '0';

    const pdfLib = PDFLib;
    const mergedPdf = await pdfLib.PDFDocument.create();

    for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });

        // Update progress bar
        progressFill.style.width = `${((i + 1) / pdfFiles.length) * 100}%`;
    }

    const mergedPdfBytes = await mergedPdf.save();
    download(mergedPdfBytes, 'combined.pdf', 'application/pdf');

    // Hide progress bar after completion
    progressContainer.style.display = 'none';
}

function download(data, filename, type) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}
