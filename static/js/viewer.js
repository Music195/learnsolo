document.addEventListener("DOMContentLoaded", () => {
        
    // Set worker source right away
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    const urlParams = new URLSearchParams(window.location.search);

    // Encoded PDF URL passed from template (google Drive or others)
    const encodedUrl = urlParams.get('file');

    if (!encodedUrl) {
        console.error("No PDF URL provided");
        return;
    }
    // Decode it back to a real URL
    const rawUrl = decodeURIComponent(encodedUrl);
    // Build proxy URL ONCE ( encoding)
    const url = `${PROXY_PDF_URL}?url=${encodeURIComponent(rawUrl)}`;
    
    const canvas = document.getElementById('the-canvas');
    const ctx = canvas.getContext('2d');
    let pdfDoc = null,
        pageNum = 1,
        scale = 1.5;

    function updateZoomDisplay() {
        const zoomPercent = Math.round((scale / 1.5) * 100);
        document.getElementById('zoom_level').textContent = zoomPercent;
    }

    function updateButtonStates() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomInBtn = document.getElementById('zoom-in-btn');
        
        prevBtn.disabled = pageNum <= 1;
        nextBtn.disabled = pageNum >= pdfDoc.numPages;
        zoomOutBtn.disabled = scale <= 0.5;
        zoomInBtn.disabled = scale >= 4.0;
    }


    function renderPage(num) {
        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            page.render({ canvasContext: ctx, viewport });
            document.getElementById('page_num').textContent = num;
            updateButtonStates();
        });
    }

    function nextPage() {
        if (pageNum < pdfDoc.numPages) {
            pageNum++;
            renderPage(pageNum);
        }
    }

    function prevPage() {
        if (pageNum > 1) {
            pageNum--;
            renderPage(pageNum);
        }
    }

    function zoomIn() {
        if (scale < 4.0) {
            scale += 0.25;
            updateZoomDisplay();
            renderPage(pageNum);
        }
    }

    function zoomOut() {
        if (scale > 0.5) {
            scale -= 0.25;
            updateZoomDisplay();
            renderPage(pageNum);
        }
    }

    function resetZoom() {
        scale = 1.5;
        updateZoomDisplay();
        renderPage(pageNum);
    }

    function goBack() {
        window.history.back();
    }

    // 👇 expose to HTML
    window.nextPage = nextPage;
    window.prevPage =prevPage;
    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
    window.resetZoom = resetZoom;
    window.goBack = goBack;

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevPage();
        } else if (e.key === 'ArrowRight') {
            nextPage();
        } else if (e.key === '+' || e.key === '=') {
            zoomIn();
        } else if (e.key === '-') {
            zoomOut();
        } else if (e.key === '0') {
            resetZoom();
        } else if (e.key == "Escape") {
            goBack();
        }
    });

    // Load PDF
    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdfDoc = pdf;
        document.getElementById('page_count').textContent = pdf.numPages;
        updateZoomDisplay();
        renderPage(pageNum);
    }).catch(error => {
        console.error("Error loading PDF:", error);
        document.getElementById('canvas-container').innerHTML = 
            "<p style='color:white; text-align:center; padding:40px; background:rgba(255,0,0,0.2); border-radius:12px; margin:20px;'>" +
            "<i class='fas fa-exclamation-triangle' style='font-size:48px; margin-bottom:20px;'></i><br>" +
            "Error loading PDF: " + error.message + "</p>";
    });

});
